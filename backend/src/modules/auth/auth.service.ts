import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/error.middleware';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
} from '../../utils/auth.util';
import { Role } from '@prisma/client';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GooglePayload {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
}

/**
 * Strict Cryptographic Verification of Google ID Token using OAuth2Client.
 * Validates aud, iss, exp, email_verified, sub.
 * Rejects forged, expired, or invalid audience tokens.
 */
export const verifyGoogleIdToken = async (idToken: string): Promise<GooglePayload> => {
  if (!idToken || typeof idToken !== 'string') {
    throw new AppError('Google ID Token is missing or invalid format.', 400);
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: googleClientId || undefined,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new AppError('Google token payload is empty.', 401);
    }

    // 1. Verify Issuer (iss)
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!payload.iss || !validIssuers.includes(payload.iss)) {
      throw new AppError('Invalid Google token issuer.', 401);
    }

    // 2. Verify Email & Email Verification Status
    if (!payload.email) {
      throw new AppError('Google account has no email address associated.', 400);
    }
    if (!payload.email_verified) {
      throw new AppError('Google email address is not verified.', 401);
    }

    // 3. Verify Token Expiration (exp)
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowInSeconds) {
      throw new AppError('Google token has expired.', 401);
    }

    // 4. Verify Audience (aud) if Client ID is configured
    if (googleClientId && payload.aud !== googleClientId) {
      throw new AppError('Google token audience mismatch.', 401);
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      avatar: payload.picture,
      emailVerified: payload.email_verified,
    };
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.error('Google ID token verification failed:', error?.message);
    throw new AppError(`Google authentication failed: ${error?.message || 'Invalid credential token'}`, 401);
  }
};

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: Role;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── Register ────────────────────────────────────────────────────────────────

export const registerUser = async (input: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError('Email is already in use.', 409);

  const hashedPassword = await hashPassword(input.password);
  const userRole = input.role ?? 'CUSTOMER';

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
      phone: input.phone,
      role: userRole,
      provider: 'CREDENTIALS',
      lastLogin: new Date(),
    },
    select: {
      id: true, name: true, email: true,
      phone: true, role: true, avatar: true, createdAt: true,
    },
  });

  // Auto-create wallet
  await prisma.wallet.create({ data: { userId: user.id } });

  // Role profile initialization
  if (userRole === 'RIDER') {
    await prisma.riderProfile.create({
      data: { userId: user.id, isOnline: false, isAvailable: true },
    });
  } else if (userRole === 'SELLER') {
    await prisma.sellerProfile.create({
      data: { userId: user.id, shopName: `${user.name}'s Shop` },
    });
  } else if (userRole === 'PROVIDER') {
    await prisma.providerProfile.create({
      data: { userId: user.id },
    });
  }

  const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id });

  // Store refresh token in DB
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  return { user, tokens: { accessToken, refreshToken } };
};

// ─── Email / Password Login ──────────────────────────────────────────────────

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      sellerProfile: true,
      riderProfile: true,
      providerProfile: true,
    },
  });
  if (!user) throw new AppError('Invalid email or password.', 401);
  if (!user.isActive) throw new AppError('Account is deactivated. Contact support.', 403);
  if (!user.password) {
    throw new AppError('This account was registered using Google Sign-In. Please sign in with Google.', 400);
  }

  const isValid = await comparePassword(input.password, user.password);
  if (!isValid) throw new AppError('Invalid email or password.', 401);

  const now = new Date();
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: now },
  });

  const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id });

  // Save Refresh Token in DB
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, tokens: { accessToken, refreshToken } };
};

// ─── Real Production Google Login ─────────────────────────────────────────────

export interface GoogleAuthInput {
  idToken?: string;
  credential?: string;
}

export const googleLoginUser = async (input: GoogleAuthInput) => {
  const rawIdToken = input.credential || input.idToken;

  if (!rawIdToken) {
    throw new AppError('Google ID Token (credential) is required.', 400);
  }

  // Cryptographically verify token with Google's official OAuth2 client
  const googleData = await verifyGoogleIdToken(rawIdToken);

  const now = new Date();

  // Find existing user by googleId OR email
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { googleId: googleData.googleId },
        { email: googleData.email },
      ],
    },
    include: {
      sellerProfile: true,
      riderProfile: true,
      providerProfile: true,
    },
  });

  if (user) {
    if (!user.isActive) {
      throw new AppError('Account is deactivated. Contact support.', 403);
    }
    // Update existing user with Google details, lastLogin & emailVerified
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: googleData.googleId,
        provider: 'GOOGLE',
        providerId: googleData.googleId,
        emailVerified: true,
        avatar: user.avatar || googleData.avatar,
        lastLogin: now,
      },
      include: {
        sellerProfile: true,
        riderProfile: true,
        providerProfile: true,
      },
    });
  } else {
    // Create new User with default role CUSTOMER
    user = await prisma.user.create({
      data: {
        name: googleData.name,
        email: googleData.email,
        googleId: googleData.googleId,
        provider: 'GOOGLE',
        providerId: googleData.googleId,
        avatar: googleData.avatar,
        role: 'CUSTOMER',
        emailVerified: true,
        lastLogin: now,
      },
      include: {
        sellerProfile: true,
        riderProfile: true,
        providerProfile: true,
      },
    });

    // Auto-create wallet for new user
    await prisma.wallet.create({ data: { userId: user.id } });
  }

  const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id });

  // Store Refresh Token in DB
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, tokens: { accessToken, refreshToken } };
};

// ─── Get Current User ─────────────────────────────────────────────────────────

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, phone: true,
      role: true, avatar: true, emailVerified: true,
      isActive: true, lastLogin: true, createdAt: true,
      provider: true, googleId: true,
      wallet: { select: { balance: true } },
      providerProfile: true,
      sellerProfile: true,
      riderProfile: true,
    },
  });

  if (!user) throw new AppError('User not found.', 404);
  return user;
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refreshUserToken = async (token: string) => {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    if (storedToken) await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const user = storedToken.user;
  if (!user || !user.isActive) throw new AppError('Account deactivated or not found.', 401);

  // Rotate Refresh Token
  const newAccessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
  const newRefreshToken = generateRefreshToken({ id: user.id });
  const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Delete old & create new in atomic transaction
  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: storedToken.id } }),
    prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: user.id, expiresAt: newExpiresAt },
    }),
  ]);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

// ─── Invalidate Refresh Token (Logout) ───────────────────────────────────────

export const logoutUserToken = async (token?: string) => {
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } }).catch(() => {});
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────

export const changeUserPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found.', 404);
  if (!user.password) {
    throw new AppError('Password cannot be changed for accounts registered via Google.', 400);
  }
  if (!newPassword || newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters long.', 400);
  }

  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) throw new AppError('Current password is incorrect.', 400);

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  await prisma.refreshToken.deleteMany({ where: { userId } });
};

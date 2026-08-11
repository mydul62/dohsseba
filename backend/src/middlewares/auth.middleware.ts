import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

export const protect = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new AppError('Not authorized. No token provided.', 401));
    }

    const secret = process.env.JWT_SECRET || 'dohssheba_jwt_secret_dev_key_2026';
    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: Role;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      return next(new AppError('User not found.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Account is deactivated.', 403));
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token.', 401));
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authorized.', 401));
    }
    const hasRole = roles.includes(req.user.role) || (req.user.role === Role.SUPER_ADMIN && roles.includes(Role.ADMIN));
    if (!hasRole) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const secret = process.env.JWT_SECRET || 'dohssheba_jwt_secret_dev_key_2026';
      const decoded = jwt.verify(token, secret) as {
        id: string;
        email: string;
        role: Role;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, isActive: true },
      });

      if (user && user.isActive) {
        req.user = { id: user.id, email: user.email, role: user.role };
      }
    }
  } catch (_) {
    // Ignore invalid token for optional authentication
  }
  next();
};


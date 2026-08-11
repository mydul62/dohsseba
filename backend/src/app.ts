import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { errorHandler } from './middlewares/error.middleware';
import { notFound } from './middlewares/notFound.middleware';

// ─── Module & Route Imports ───────────────────────────────────────────────────
import authRoutes                              from './modules/auth/auth.routes';
import userRoutes                              from './modules/user/user.routes';
import serviceRoutes, { categoryRouter as serviceCategoryRoutes, slotRouter as serviceSlotRoutes } from './modules/service/service.routes';
import bookingRoutes                           from './modules/booking/booking.routes';
import productRoutes, { categoryRouter as productCategoryRoutes } from './modules/product/product.routes';
import cartRoutes                              from './modules/cart/cart.routes';
import orderRoutes                             from './modules/order/order.routes';
import reviewRoutes                            from './modules/review/review.routes';
import adminRoutes                             from './modules/admin/admin.routes';
import * as adminController                    from './modules/admin/admin.controller';
import sellerRoutes                            from './modules/seller/seller.routes';
import walletRoutes                            from './modules/wallet/wallet.routes';
import uploadRoutes                            from './modules/upload/upload.routes';
import couponRoutes                            from './modules/coupon/coupon.routes';
import riderRoutes                             from './modules/rider/rider.routes';
import bannerRoutes                            from './modules/banner/banner.routes';
import technicianRoutes                        from './modules/technician/technician.routes';
import homepageRoutes                         from './routes/homepage.routes';
import adminHomepageRoutes                    from './routes/adminHomepage.routes';
import brandRoutes                            from './routes/brand.routes';
import deliveryRulesRoutes                    from './modules/delivery-rules/delivery-rules.routes';
import reviewAndRatingRoutes                  from './modules/review-and-rating/review-and-rating.routes';

const app = express();
app.set('trust proxy', 1);

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // allow all in dev
  },
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      Number(process.env.RATE_LIMIT_MAX)        || 10000,
  message:  { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') return true;
    const url = req.originalUrl || req.url || '';
    return url.includes('/seller') || url.includes('/rider') || url.includes('/dashboard') || url.includes('/orders');
  },
});
app.use('/api', limiter);

// ─── Body & Cookies ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({
  success:     true,
  message:     '🚀 dohsSheba API is running successfully',
  environment: process.env.NODE_ENV,
  timestamp:   new Date().toISOString(),
}));

app.get('/health', (_req, res) => res.json({
  success:     true,
  message:     '🚀 dohsSheba API is running',
  environment: process.env.NODE_ENV,
  timestamp:   new Date().toISOString(),
}));

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`,                authRoutes);
app.use(`${API}/users`,               userRoutes);
app.use(`${API}/services`,            serviceRoutes);
app.use(`${API}/service-categories`,  serviceCategoryRoutes);
app.use(`${API}/service-slots`,       serviceSlotRoutes);
app.use(`${API}/bookings`,            bookingRoutes);
app.use(`${API}/products`,            productRoutes);
app.use(`${API}/product-categories`,  productCategoryRoutes);
app.use(`${API}/cart`,                cartRoutes);
app.use(`${API}/orders`,              orderRoutes);
app.use(`${API}/reviews`,             reviewRoutes);
app.use(`${API}/review-and-rating`,   reviewAndRatingRoutes);
app.use(`${API}/admin`,               adminRoutes);
app.use(`${API}/seller`,              sellerRoutes);
app.use(`${API}/wallet`,              walletRoutes);
app.use(`${API}/upload`,              uploadRoutes);
app.use(`${API}/coupons`,             couponRoutes);
app.use(`${API}/rider`,               riderRoutes);
app.use(`${API}/banners`,             bannerRoutes);
app.use(`${API}/technicians`,          technicianRoutes);
app.use(`${API}/homepage`,            homepageRoutes);
app.use(`${API}/admin/homepage`,      adminHomepageRoutes);
app.use(`${API}/brands`,              brandRoutes);
app.use(`${API}/delivery-rules`,      deliveryRulesRoutes);
app.get(`${API}/settings`,            adminController.getSiteSettings);

// ─── 404 & Error ─────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;

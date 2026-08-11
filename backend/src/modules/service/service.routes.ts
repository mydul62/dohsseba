import { Router } from 'express';
import * as serviceController from './service.controller';
import { protect, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createServiceValidator,
  updateServiceValidator,
  serviceCategoryValidator,
} from './service.validate';

const router = Router();

// ─── Service Categories ───────────────────────────────────────────────────────
const categoryRouter = Router();

categoryRouter.get('/',     serviceController.getCategories);
categoryRouter.post('/',    protect, authorize('PROVIDER', 'ADMIN', 'SUPER_ADMIN'), serviceCategoryValidator, validate, serviceController.createCategory);
categoryRouter.patch('/:id', protect, authorize('PROVIDER', 'ADMIN', 'SUPER_ADMIN'), serviceController.updateCategory);
categoryRouter.put('/:id',  protect, authorize('PROVIDER', 'ADMIN', 'SUPER_ADMIN'), serviceController.updateCategory);
categoryRouter.delete('/:id', protect, authorize('PROVIDER', 'ADMIN', 'SUPER_ADMIN'), serviceController.deleteCategory);

// ─── Services ─────────────────────────────────────────────────────────────────

// Provider-specific routes first (before :id to avoid conflict)
router.get('/provider/my-services', protect, authorize('PROVIDER', 'ADMIN'), serviceController.getMyServices);

// Public routes
router.get('/',     serviceController.getServices);
router.get('/:id',  serviceController.getService);

// Protected routes
router.post('/',
  protect, authorize('PROVIDER', 'ADMIN'),
  createServiceValidator, validate,
  serviceController.createService
);
router.put('/:id',
  protect, authorize('PROVIDER', 'ADMIN', 'SUPER_ADMIN'),
  updateServiceValidator, validate,
  serviceController.updateService
);
router.patch('/:id',
  protect, authorize('PROVIDER', 'ADMIN', 'SUPER_ADMIN'),
  updateServiceValidator, validate,
  serviceController.updateService
);
router.delete('/:id',
  protect, authorize('PROVIDER', 'ADMIN'),
  serviceController.deleteService
);

import * as serviceSlotController from './service-slot.controller';

// ─── Service Slots ────────────────────────────────────────────────────────────
const slotRouter = Router();

slotRouter.get('/available',        serviceSlotController.getAvailableSlots);
slotRouter.get('/provider',         protect, authorize('PROVIDER', 'ADMIN', 'SUPER_ADMIN'), serviceSlotController.getProviderSlots);
slotRouter.post('/',                protect, authorize('PROVIDER', 'ADMIN', 'SUPER_ADMIN'), serviceSlotController.createSlot);
slotRouter.put('/:id',             protect, authorize('PROVIDER', 'ADMIN', 'SUPER_ADMIN'), serviceSlotController.updateSlot);
slotRouter.patch('/:id/block',     protect, authorize('PROVIDER', 'ADMIN', 'SUPER_ADMIN'), serviceSlotController.toggleBlockSlot);
slotRouter.delete('/:id',          protect, authorize('PROVIDER', 'ADMIN', 'SUPER_ADMIN'), serviceSlotController.deleteSlot);

export { categoryRouter, slotRouter };
export default router;

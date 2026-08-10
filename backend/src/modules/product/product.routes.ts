import { Router } from 'express';
import * as productController from './product.controller';
import { protect, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createProductValidator, updateProductValidator, productCategoryValidator } from './product.validate';

const router = Router();

// ─── Categories ───────────────────────────────────────────────────────────────
const categoryRouter = Router();
categoryRouter.get('/seed-cooking-now', productController.seedCookingNow);
categoryRouter.get('/seed-fruits-vegetables-now', productController.seedFruitsVegetablesNow);
categoryRouter.get('/seed-dairy-now', productController.seedDairyNow);
categoryRouter.get('/seed-meat-fish-now', productController.seedMeatFishNow);
categoryRouter.get('/',     productController.getCategories);
categoryRouter.get('/slug/:slug', productController.getCategoryBySlug);
categoryRouter.post('/',    protect, authorize('SELLER', 'ADMIN'), productCategoryValidator, validate, productController.createCategory);
categoryRouter.put('/:id',  protect, authorize('SELLER', 'ADMIN'), productController.updateCategory);
categoryRouter.delete('/:id', protect, authorize('SELLER', 'ADMIN'), productController.deleteCategory);

// ─── Products ─────────────────────────────────────────────────────────────────
router.get('/seller/my-products', protect, authorize('SELLER', 'ADMIN'), productController.getMyProducts);

router.get('/',     productController.getProducts);
router.get('/:id',  productController.getProduct);
router.post('/',    protect, authorize('SELLER', 'ADMIN'), createProductValidator, validate, productController.createProduct);
router.put('/:id',     protect, authorize('SELLER', 'ADMIN'), updateProductValidator, validate, productController.updateProduct);
router.patch('/:id/stock', protect, authorize('SELLER', 'ADMIN'), productController.patchStock);
router.post('/bulk-delete', protect, authorize('SELLER', 'ADMIN'), productController.bulkDeleteProducts);
router.delete('/:id',  protect, authorize('SELLER', 'ADMIN'), productController.deleteProduct);

export { categoryRouter };
export default router;

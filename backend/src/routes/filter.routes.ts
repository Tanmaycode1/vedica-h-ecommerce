import express from 'express';
import * as filterController from '../controllers/filter/product-filter.controller';

const router = express.Router();

// Main routes for product filtering
router.get('/products', filterController.filterProducts);
router.get('/categories', filterController.getFilterableCategories);
router.get('/brands', filterController.getFilterableBrands);
router.get('/colors', filterController.getFilterableColors);

export default router; 
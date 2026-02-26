const express = require('express');
const router = express.Router();
const { getProducts, getCategories, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, getProducts);
router.get('/categories', protect, getCategories);
router.get('/:id', protect, getProduct);
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;

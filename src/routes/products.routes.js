/**
 * products.routes.js - Rotas de produtos/veículos
 */

const { Router } = require('express');
const productsController = require('../controllers/products.controller');
const authMiddleware = require('../middlewares/auth');

const router = Router();

router.use(authMiddleware);

router.post('/', productsController.create);
router.get('/', productsController.list);
router.put('/:id', productsController.update);
router.delete('/:id', productsController.remove);

module.exports = router;

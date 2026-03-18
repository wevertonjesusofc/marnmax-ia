/**
 * admin.routes.js - Rotas de administração master
 */

const { Router } = require('express');
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');

const router = Router();

// Todas as rotas requerem autenticação + admin
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', adminController.listUsers);
router.put('/users/:id/grant-access', adminController.grantAccess);
router.post('/coupons', adminController.createCoupon);
router.get('/coupons', adminController.listCoupons);
router.delete('/coupons/:id', adminController.deleteCoupon);
router.get('/dashboard', adminController.dashboard);

module.exports = router;

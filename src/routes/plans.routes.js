/**
 * plans.routes.js - Rotas de planos e cupons
 */

const { Router } = require('express');
const plansController = require('../controllers/plans.controller');
const authMiddleware = require('../middlewares/auth');

const router = Router();

// Rota pública - listar planos
router.get('/', plansController.listPlans);

// Rota protegida - aplicar cupom
router.post('/apply-coupon', authMiddleware, plansController.applyCoupon);

module.exports = router;

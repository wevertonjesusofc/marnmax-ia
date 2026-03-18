/**
 * auth.routes.js - Rotas de autenticação
 */

const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth');

const router = Router();

// Rotas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rotas protegidas
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;

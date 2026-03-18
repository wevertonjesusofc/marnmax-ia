/**
 * gamification.routes.js - Rotas de gamificação
 */

const { Router } = require('express');
const gamificationController = require('../controllers/gamification.controller');
const authMiddleware = require('../middlewares/auth');

const router = Router();

router.use(authMiddleware);

router.get('/status', gamificationController.getStatus);

module.exports = router;

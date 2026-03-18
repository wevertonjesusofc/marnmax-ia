/**
 * aiConfig.routes.js - Rotas de configuração da IA
 */

const { Router } = require('express');
const aiConfigController = require('../controllers/aiConfig.controller');
const authMiddleware = require('../middlewares/auth');

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

router.post('/', aiConfigController.create);
router.get('/', aiConfigController.get);
router.put('/:id', aiConfigController.update);

module.exports = router;

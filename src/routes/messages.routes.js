/**
 * messages.routes.js - Rotas de histórico de mensagens
 */

const { Router } = require('express');
const messagesController = require('../controllers/messages.controller');
const authMiddleware = require('../middlewares/auth');

const router = Router();

router.use(authMiddleware);

router.get('/', messagesController.list);
router.put('/:id/correct', messagesController.correct);

module.exports = router;

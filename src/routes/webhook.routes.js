/**
 * webhook.routes.js - Rota do webhook WhatsApp
 */

const { Router } = require('express');
const webhookController = require('../controllers/webhook.controller');

const router = Router();

// O webhook NÃO usa autenticação JWT
// A validação é feita pelo instanceId do Z-API
router.post('/', webhookController.handleIncoming);

module.exports = router;

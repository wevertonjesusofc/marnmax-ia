/**
 * training.routes.js - Rotas de treinamento da IA
 */

const { Router } = require('express');
const trainingController = require('../controllers/training.controller');
const authMiddleware = require('../middlewares/auth');

const router = Router();

router.use(authMiddleware);

router.post('/', trainingController.create);
router.get('/', trainingController.list);
router.delete('/:id', trainingController.remove);

module.exports = router;

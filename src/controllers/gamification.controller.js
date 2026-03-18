/**
 * gamification.controller.js - Controlador de gamificação
 * 
 * Endpoint:
 * GET /api/gamification/status - Status de XP e evolução da IA
 */

const gamificationService = require('../services/gamification.service');

/**
 * Retorna o status de gamificação da IA do usuário
 * Inclui XP, nível, progresso e estatísticas
 */
async function getStatus(req, res) {
    try {
        const status = await gamificationService.getStatus(req.user.id);

        res.json({
            message: `Sua IA está no nível ${status.emoji} ${status.level}!`,
            ...status
        });

    } catch (error) {
        console.error('❌ Erro ao buscar status de gamificação:', error.message);
        res.status(500).json({ error: 'Erro interno' });
    }
}

module.exports = { getStatus };

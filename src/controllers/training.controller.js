/**
 * training.controller.js - Controlador de treinamento da IA
 * 
 * Endpoints:
 * POST   /api/training     - Adicionar treinamento (texto ou áudio transcrito)
 * GET    /api/training      - Listar treinamentos do usuário
 * DELETE /api/training/:id  - Remover treinamento
 */

const { db } = require('../config/database');
const gamification = require('../services/gamification.service');

/**
 * Adiciona um novo treinamento para a IA
 * Suporta tipo "text" (texto direto) e "audio" (transcrição de áudio)
 */
async function create(req, res) {
    try {
        const { type, title, content, source } = req.body;

        // Validação
        if (!content) {
            return res.status(400).json({
                error: 'O campo "content" é obrigatório'
            });
        }

        const validTypes = ['text', 'audio'];
        if (type && !validTypes.includes(type)) {
            return res.status(400).json({
                error: `Tipo inválido. Opções: ${validTypes.join(', ')}`
            });
        }

        // Cria o treinamento
        const training = await db.insert('ai_training', {
            user_id: req.user.id,
            type: type || 'text',
            title: title || '',
            content,
            source: source || 'manual',
            is_active: true
        });

        // Adiciona XP pela adição de treinamento (+10 XP)
        const xpResult = await gamification.addXP(req.user.id, 'TRAINING_ADDED');

        res.status(201).json({
            message: 'Treinamento adicionado com sucesso!',
            training,
            gamification: xpResult
        });

    } catch (error) {
        console.error('❌ Erro ao criar treinamento:', error.message);
        res.status(500).json({ error: 'Erro interno ao adicionar treinamento' });
    }
}

/**
 * Lista todos os treinamentos do usuário
 */
async function list(req, res) {
    try {
        const trainings = await db.find('ai_training', { user_id: req.user.id });

        res.json({
            total: trainings.length,
            trainings
        });

    } catch (error) {
        console.error('❌ Erro ao listar treinamentos:', error.message);
        res.status(500).json({ error: 'Erro interno' });
    }
}

/**
 * Remove um treinamento
 */
async function remove(req, res) {
    try {
        const { id } = req.params;

        // Verifica se pertence ao usuário
        const training = await db.findOne('ai_training', { id, user_id: req.user.id });
        if (!training) {
            return res.status(404).json({ error: 'Treinamento não encontrado' });
        }

        await db.delete('ai_training', id);

        res.json({ message: 'Treinamento removido com sucesso' });

    } catch (error) {
        console.error('❌ Erro ao remover treinamento:', error.message);
        res.status(500).json({ error: 'Erro interno ao remover treinamento' });
    }
}

module.exports = { create, list, remove };

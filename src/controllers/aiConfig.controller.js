/**
 * aiConfig.controller.js - Controlador de configuração da IA
 * 
 * Endpoints:
 * POST /api/ai-config     - Criar configuração da IA
 * GET  /api/ai-config     - Obter configuração atual
 * PUT  /api/ai-config/:id - Atualizar configuração
 */

const { db } = require('../config/database');

/**
 * Cria uma nova configuração de IA para o usuário
 */
async function create(req, res) {
    try {
        const { ai_name, tone, objective, sales_strategy, welcome_message } = req.body;

        // Verifica se já existe uma configuração
        const existing = await db.findOne('ai_config', { user_id: req.user.id });
        if (existing) {
            return res.status(409).json({
                error: 'Você já possui uma configuração de IA. Use PUT para atualizar.',
                existing: existing
            });
        }

        // Validação do tom de voz
        const validTones = ['amigável', 'direto', 'persuasivo', 'consultivo', 'formal'];
        if (tone && !validTones.includes(tone)) {
            return res.status(400).json({
                error: `Tom inválido. Opções: ${validTones.join(', ')}`
            });
        }

        // Validação do objetivo
        const validObjectives = ['vender', 'agendar visita', 'qualificar lead'];
        if (objective && !validObjectives.includes(objective)) {
            return res.status(400).json({
                error: `Objetivo inválido. Opções: ${validObjectives.join(', ')}`
            });
        }

        const config = await db.insert('ai_config', {
            user_id: req.user.id,
            ai_name: ai_name || 'Assistente',
            tone: tone || 'amigável',
            objective: objective || 'vender',
            sales_strategy: sales_strategy || '',
            welcome_message: welcome_message || '',
            is_active: true
        });

        res.status(201).json({
            message: 'Configuração da IA criada com sucesso!',
            config
        });

    } catch (error) {
        console.error('❌ Erro ao criar config da IA:', error.message);
        res.status(500).json({ error: 'Erro interno ao criar configuração' });
    }
}

/**
 * Retorna a configuração da IA do usuário
 */
async function get(req, res) {
    try {
        const config = await db.findOne('ai_config', { user_id: req.user.id });

        if (!config) {
            return res.status(404).json({
                error: 'Nenhuma configuração de IA encontrada. Crie uma primeiro.'
            });
        }

        res.json({ config });

    } catch (error) {
        console.error('❌ Erro ao buscar config da IA:', error.message);
        res.status(500).json({ error: 'Erro interno' });
    }
}

/**
 * Atualiza a configuração da IA
 */
async function update(req, res) {
    try {
        const { id } = req.params;
        const { ai_name, tone, objective, sales_strategy, welcome_message } = req.body;

        // Verifica se a config pertence ao usuário
        const config = await db.findOne('ai_config', { id, user_id: req.user.id });
        if (!config) {
            return res.status(404).json({ error: 'Configuração não encontrada' });
        }

        // Monta objeto de atualização (apenas campos enviados)
        const updateData = {};
        if (ai_name !== undefined) updateData.ai_name = ai_name;
        if (tone !== undefined) updateData.tone = tone;
        if (objective !== undefined) updateData.objective = objective;
        if (sales_strategy !== undefined) updateData.sales_strategy = sales_strategy;
        if (welcome_message !== undefined) updateData.welcome_message = welcome_message;

        const updated = await db.update('ai_config', id, updateData);

        res.json({
            message: 'Configuração atualizada com sucesso!',
            config: updated
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar config da IA:', error.message);
        res.status(500).json({ error: 'Erro interno ao atualizar configuração' });
    }
}

module.exports = { create, get, update };

/**
 * messages.controller.js - Controlador de histórico de mensagens
 * 
 * Endpoints:
 * GET /api/messages             - Listar histórico de mensagens
 * PUT /api/messages/:id/correct - Corrigir resposta da IA (aprendizado contínuo)
 */

const { db } = require('../config/database');
const gamification = require('../services/gamification.service');

/**
 * Lista o histórico de mensagens do usuário
 * Suporta filtro por telefone do cliente
 */
async function list(req, res) {
    try {
        const { client_phone, limit } = req.query;

        // Monta filtros
        const filters = { user_id: req.user.id };
        if (client_phone) filters.client_phone = client_phone;

        const messages = await db.find('messages', filters, {
            orderBy: 'created_at',
            ascending: false,
            limit: parseInt(limit) || 50
        });

        // Agrupa por cliente para facilitar visualização
        const clients = {};
        messages.forEach(msg => {
            if (!clients[msg.client_phone]) {
                clients[msg.client_phone] = {
                    phone: msg.client_phone,
                    name: msg.client_name || 'Desconhecido',
                    totalMessages: 0,
                    lastMessage: null
                };
            }
            clients[msg.client_phone].totalMessages++;
            if (!clients[msg.client_phone].lastMessage) {
                clients[msg.client_phone].lastMessage = msg.created_at;
            }
        });

        res.json({
            total: messages.length,
            clients: Object.values(clients),
            messages
        });

    } catch (error) {
        console.error('❌ Erro ao listar mensagens:', error.message);
        res.status(500).json({ error: 'Erro interno' });
    }
}

/**
 * Corrige uma resposta da IA
 * A correção humana é usada como exemplo de aprendizado para futuras respostas
 */
async function correct(req, res) {
    try {
        const { id } = req.params;
        const { human_response } = req.body;

        if (!human_response) {
            return res.status(400).json({
                error: 'O campo "human_response" é obrigatório'
            });
        }

        // Verifica se a mensagem pertence ao usuário
        const message = await db.findOne('messages', { id, user_id: req.user.id });
        if (!message) {
            return res.status(404).json({ error: 'Mensagem não encontrada' });
        }

        // Atualiza com a correção humana
        const updated = await db.update('messages', id, {
            human_response,
            is_corrected: true
        });

        // Adiciona XP pela correção (+20 XP)
        const xpResult = await gamification.addXP(req.user.id, 'CORRECTION_APPLIED');

        res.json({
            message: 'Correção aplicada com sucesso! A IA vai aprender com esse exemplo.',
            data: updated,
            gamification: xpResult
        });

    } catch (error) {
        console.error('❌ Erro ao corrigir mensagem:', error.message);
        res.status(500).json({ error: 'Erro interno ao aplicar correção' });
    }
}

module.exports = { list, correct };

/**
 * webhook.controller.js - Controlador do webhook WhatsApp (Z-API)
 * 
 * Endpoint:
 * POST /api/webhook - Recebe mensagens do WhatsApp via Z-API
 * 
 * Fluxo:
 * 1. Recebe a mensagem do cliente via Z-API
 * 2. Identifica o usuário dono da instância Z-API
 * 3. Gera resposta automática usando o motor de IA
 * 4. Envia a resposta de volta via Z-API
 * 5. Salva a conversa no histórico
 */

const { db } = require('../config/database');
const aiEngine = require('../services/ai.engine');
const zapiService = require('../services/zapi.service');
const gamification = require('../services/gamification.service');

/**
 * Recebe e processa mensagens do WhatsApp
 * Este endpoint é chamado automaticamente pelo Z-API quando uma mensagem chega
 */
async function handleIncoming(req, res) {
    try {
        // O Z-API envia os dados da mensagem no body
        const {
            phone,          // Número do telefone do cliente (com DDI)
            message,        // Conteúdo da mensagem
            instanceId,     // ID da instância Z-API que recebeu
            senderName,     // Nome do remetente (quando disponível)
            isGroup,        // Se é mensagem de grupo
            messageId       // ID único da mensagem
        } = extractMessageData(req.body);

        // Ignora mensagens de grupo
        if (isGroup) {
            return res.status(200).json({ status: 'ignored', reason: 'group_message' });
        }

        // Ignora mensagens vazias
        if (!message || !phone) {
            return res.status(200).json({ status: 'ignored', reason: 'empty_message' });
        }

        console.log(`📩 Mensagem recebida de ${phone}: "${message}"`);

        // 1. Identifica o usuário dono desta instância Z-API
        const user = await findUserByInstance(instanceId);
        if (!user) {
            console.log(`⚠️  Nenhum usuário encontrado para instância ${instanceId}`);
            return res.status(200).json({ status: 'ignored', reason: 'user_not_found' });
        }

        // 2. Verifica se o plano do usuário está ativo
        if (user.plan_expires_at && new Date(user.plan_expires_at) < new Date()) {
            console.log(`⚠️  Plano expirado para usuário ${user.email}`);
            return res.status(200).json({ status: 'ignored', reason: 'plan_expired' });
        }

        // 3. Gera a resposta usando o motor de IA
        let aiResponse;
        try {
            aiResponse = await aiEngine.generateResponse(user.id, phone, message);
        } catch (aiError) {
            console.error('❌ Erro no motor de IA:', aiError.message);
            aiResponse = 'Desculpe, estou com dificuldades no momento. Um atendente humano irá te responder em breve!';
        }

        // 4. Envia a resposta via WhatsApp
        try {
            await zapiService.sendTextMessage(
                user.zapi_instance_id || process.env.ZAPI_INSTANCE_ID,
                user.zapi_token || process.env.ZAPI_TOKEN,
                phone,
                aiResponse
            );
        } catch (sendError) {
            console.error('❌ Erro ao enviar resposta WhatsApp:', sendError.message);
            // Continua para salvar no histórico mesmo que falhe o envio
        }

        // 5. Salva a conversa no histórico
        await db.insert('messages', {
            user_id: user.id,
            client_phone: phone,
            client_name: senderName || '',
            client_message: message,
            ai_response: aiResponse,
            is_corrected: false,
            metadata: { messageId, instanceId }
        });

        // 6. Adiciona XP por mensagem respondida (+5 XP)
        await gamification.addXP(user.id, 'MESSAGE_ANSWERED');

        console.log(`✅ Resposta enviada para ${phone}: "${aiResponse.substring(0, 50)}..."`);

        res.status(200).json({
            status: 'processed',
            phone,
            response: aiResponse
        });

    } catch (error) {
        console.error('❌ Erro no webhook:', error.message);
        // Sempre retorna 200 para o Z-API não reenviar a mensagem
        res.status(200).json({ status: 'error', error: error.message });
    }
}

/**
 * Extrai dados da mensagem do payload do Z-API
 * O formato pode variar, então tratamos diferentes estruturas
 */
function extractMessageData(body) {
    // Formato padrão Z-API
    if (body.phone) {
        return {
            phone: body.phone.replace(/\D/g, ''), // Remove caracteres não numéricos
            message: body.text?.message || body.message || '',
            instanceId: body.instanceId || '',
            senderName: body.senderName || body.chatName || '',
            isGroup: body.isGroup || false,
            messageId: body.messageId || body.id || ''
        };
    }

    // Formato alternativo (ReceivedCallback)
    if (body.text) {
        return {
            phone: (body.chatId || body.from || '').replace(/\D/g, ''),
            message: body.text.message || body.text || '',
            instanceId: body.instanceId || '',
            senderName: body.senderName || '',
            isGroup: body.isGroup || false,
            messageId: body.messageId || ''
        };
    }

    // Retorna vazio se formato não reconhecido
    return { phone: '', message: '', instanceId: '', senderName: '', isGroup: false, messageId: '' };
}

/**
 * Busca o usuário que possui esta instância Z-API
 */
async function findUserByInstance(instanceId) {
    if (!instanceId) {
        // Se não tem instanceId, usa o primeiro usuário ativo (modo desenvolvimento)
        const users = await db.find('users', { is_active: true }, { limit: 1 });
        return users[0] || null;
    }

    return await db.findOne('users', { zapi_instance_id: instanceId });
}

module.exports = { handleIncoming };

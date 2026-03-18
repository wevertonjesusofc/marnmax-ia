/**
 * ai.engine.js - Motor de IA (coração do ChatMarne)
 * 
 * Responsável por:
 * 1. Carregar configuração da IA do usuário
 * 2. Carregar dados de treinamento
 * 3. Carregar histórico de conversas com o cliente
 * 4. Carregar correções humanas como exemplos de aprendizado
 * 5. Montar o prompt dinâmico
 * 6. Gerar resposta via OpenAI
 */

const { db } = require('../config/database');
const { generateChatResponse } = require('./openai.service');

/**
 * Gera uma resposta automática da IA para uma mensagem de cliente
 * 
 * @param {string} userId - ID do usuário (vendedor) dono da IA
 * @param {string} clientPhone - Telefone do cliente
 * @param {string} clientMessage - Mensagem enviada pelo cliente
 * @returns {string} Resposta gerada pela IA
 */
async function generateResponse(userId, clientPhone, clientMessage) {
    // 1. Carrega a configuração da IA do usuário
    const aiConfig = await db.findOne('ai_config', { user_id: userId });

    // 2. Carrega todos os treinamentos do usuário
    const trainings = await db.find('ai_training', { user_id: userId, is_active: true });

    // 3. Carrega o histórico recente de mensagens com este cliente (últimas 10)
    const messageHistory = await db.find(
        'messages',
        { user_id: userId, client_phone: clientPhone },
        { orderBy: 'created_at', ascending: false, limit: 10 }
    );

    // 4. Carrega correções humanas como exemplos de aprendizado
    const corrections = await db.find('messages', { user_id: userId, is_corrected: true });

    // 5. Carrega produtos disponíveis para referência
    const products = await db.find('products', { user_id: userId, is_available: true });

    // 6. Monta o prompt dinâmico
    const messages = buildPrompt(aiConfig, trainings, messageHistory, corrections, products, clientMessage);

    // 7. Gera resposta via OpenAI
    const response = await generateChatResponse(messages, {
        temperature: 0.7,
        max_tokens: 500
    });

    return response;
}

/**
 * Monta o array de mensagens para a OpenAI com todo o contexto
 */
function buildPrompt(aiConfig, trainings, messageHistory, corrections, products, clientMessage) {
    const messages = [];

    // ============================================
    // SYSTEM PROMPT - Personalidade e regras da IA
    // ============================================
    const aiName = aiConfig?.ai_name || 'Assistente';
    const tone = aiConfig?.tone || 'amigável';
    const objective = aiConfig?.objective || 'vender';
    const strategy = aiConfig?.sales_strategy || '';

    let systemPrompt = `Você é ${aiName}, um assistente virtual especializado em vendas de veículos.

PERSONALIDADE E TOM:
- Seu tom de comunicação é: ${tone}
- Você deve ser profissional mas acessível
- Sempre responda em português brasileiro
- Use linguagem natural, como se fosse uma conversa no WhatsApp
- Mantenha as respostas concisas e diretas (máximo 3 parágrafos)

OBJETIVO PRINCIPAL:
- Seu objetivo é: ${objective}
${objective === 'vender' ? '- Destaque benefícios dos veículos e conduza o cliente para o fechamento' : ''}
${objective === 'agendar visita' ? '- Incentive o cliente a visitar a loja para ver o veículo pessoalmente' : ''}
${objective === 'qualificar lead' ? '- Descubra as necessidades do cliente (orçamento, preferências, urgência)' : ''}

ESTRATÉGIA DE VENDAS:
${strategy || 'Seja consultivo, entenda as necessidades do cliente antes de oferecer soluções.'}

REGRAS IMPORTANTES:
- NUNCA invente informações sobre veículos que não estão na sua base
- Se não souber algo, diga que vai verificar e retornar
- Sempre seja educado e profissional
- Não use emojis em excesso (máximo 2 por mensagem)
- Se o cliente pedir para falar com um humano, diga que irá transferir`;

    // ============================================
    // DADOS DE TREINAMENTO
    // ============================================
    if (trainings.length > 0) {
        systemPrompt += '\n\nCONHECIMENTO ADICIONAL (use como base para respostas):';
        trainings.forEach((t, i) => {
            systemPrompt += `\n--- Treinamento ${i + 1}${t.title ? ` (${t.title})` : ''} ---\n${t.content}`;
        });
    }

    // ============================================
    // CATÁLOGO DE PRODUTOS
    // ============================================
    if (products.length > 0) {
        systemPrompt += '\n\nVEÍCULOS DISPONÍVEIS:';
        products.forEach(p => {
            systemPrompt += `\n- ${p.name}`;
            if (p.brand) systemPrompt += ` | Marca: ${p.brand}`;
            if (p.year) systemPrompt += ` | Ano: ${p.year}`;
            if (p.price) systemPrompt += ` | Preço: R$ ${Number(p.price).toLocaleString('pt-BR')}`;
            if (p.mileage) systemPrompt += ` | KM: ${p.mileage.toLocaleString('pt-BR')}`;
            if (p.description) systemPrompt += `\n  ${p.description}`;
        });
    }

    // ============================================
    // APRENDIZADO POR CORREÇÕES HUMANAS
    // ============================================
    if (corrections.length > 0) {
        systemPrompt += '\n\nEXEMPLOS DE RESPOSTAS IDEAIS (aprenda com esses exemplos):';
        // Usa as últimas 5 correções como exemplos
        corrections.slice(-5).forEach((c, i) => {
            systemPrompt += `\nExemplo ${i + 1}:`;
            systemPrompt += `\n  Cliente perguntou: "${c.client_message}"`;
            systemPrompt += `\n  Resposta correta: "${c.human_response}"`;
        });
    }

    messages.push({ role: 'system', content: systemPrompt });

    // ============================================
    // HISTÓRICO DA CONVERSA (últimas mensagens com este cliente)
    // ============================================
    if (messageHistory.length > 0) {
        // Inverte para ordem cronológica (mais antiga primeiro)
        const orderedHistory = [...messageHistory].reverse();

        orderedHistory.forEach(msg => {
            // Mensagem do cliente
            messages.push({ role: 'user', content: msg.client_message });
            // Resposta da IA (ou correção humana se houver)
            const response = msg.is_corrected ? msg.human_response : msg.ai_response;
            if (response) {
                messages.push({ role: 'assistant', content: response });
            }
        });
    }

    // ============================================
    // MENSAGEM ATUAL DO CLIENTE
    // ============================================
    messages.push({ role: 'user', content: clientMessage });

    return messages;
}

module.exports = { generateResponse, buildPrompt };

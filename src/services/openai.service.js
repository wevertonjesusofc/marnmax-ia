/**
 * openai.service.js - Serviço de integração com a OpenAI
 * 
 * Encapsula chamadas à API da OpenAI para geração de respostas.
 * Usa o modelo gpt-3.5-turbo por padrão (pode ser alterado via .env).
 */

const OpenAI = require('openai');

// Inicializa o cliente OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Gera uma resposta usando o modelo de chat da OpenAI
 * 
 * @param {Array} messages - Array de mensagens no formato [{role, content}]
 * @param {object} options - Opções adicionais (model, temperature, max_tokens)
 * @returns {string} Resposta gerada pela IA
 */
async function generateChatResponse(messages, options = {}) {
    try {
        const response = await openai.chat.completions.create({
            model: options.model || 'gpt-3.5-turbo',
            messages: messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.max_tokens || 500,
            presence_penalty: 0.3,  // Incentiva a IA a falar sobre tópicos novos
            frequency_penalty: 0.3  // Reduz repetição de palavras
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('❌ Erro na OpenAI:', error.message);
        throw new Error(`Erro ao gerar resposta da IA: ${error.message}`);
    }
}

module.exports = { generateChatResponse };

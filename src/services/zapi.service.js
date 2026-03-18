/**
 * zapi.service.js - Serviço de integração com Z-API (WhatsApp)
 * 
 * Gerencia o envio de mensagens via WhatsApp usando a API do Z-API.
 * Documentação: https://developer.z-api.io/
 */

const axios = require('axios');

/**
 * Envia uma mensagem de texto via WhatsApp
 * 
 * @param {string} instanceId - ID da instância Z-API do usuário
 * @param {string} token - Token da instância Z-API
 * @param {string} phone - Número do telefone (ex: 5511999999999)
 * @param {string} message - Texto da mensagem
 * @returns {object} Resposta da API Z-API
 */
async function sendTextMessage(instanceId, token, phone, message) {
    try {
        const baseUrl = process.env.ZAPI_BASE_URL || 'https://api.z-api.io';
        const url = `${baseUrl}/instances/${instanceId}/token/${token}/send-text`;

        const response = await axios.post(url, {
            phone: phone,
            message: message
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ Mensagem enviada para ${phone}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Erro ao enviar mensagem para ${phone}:`, error.message);
        throw new Error(`Falha ao enviar mensagem WhatsApp: ${error.message}`);
    }
}

/**
 * Verifica o status da conexão com o WhatsApp
 * 
 * @param {string} instanceId - ID da instância Z-API
 * @param {string} token - Token da instância Z-API
 * @returns {object} Status da conexão
 */
async function getConnectionStatus(instanceId, token) {
    try {
        const baseUrl = process.env.ZAPI_BASE_URL || 'https://api.z-api.io';
        const url = `${baseUrl}/instances/${instanceId}/token/${token}/status`;

        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('❌ Erro ao verificar status Z-API:', error.message);
        throw new Error(`Falha ao verificar status: ${error.message}`);
    }
}

module.exports = { sendTextMessage, getConnectionStatus };

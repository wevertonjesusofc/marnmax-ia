/**
 * gamification.service.js - Serviço de gamificação da IA
 * 
 * Sistema de XP e evolução da IA baseado em uso e treinamentos.
 * Quanto mais treinada, mais "experiente" a IA fica.
 */

const { db } = require('../config/database');

// ============================================
// CONFIGURAÇÃO DE XP
// ============================================
const XP_REWARDS = {
    TRAINING_ADDED: 10,      // +10 XP por treinamento adicionado
    MESSAGE_ANSWERED: 5,     // +5 XP por mensagem respondida
    CORRECTION_APPLIED: 20,  // +20 XP por correção humana aplicada
    PRODUCT_ADDED: 5         // +5 XP por produto cadastrado
};

// ============================================
// NÍVEIS DE EVOLUÇÃO
// ============================================
const LEVELS = [
    { name: 'Iniciante', minXP: 0, emoji: '🌱' },
    { name: 'Aprendiz', minXP: 100, emoji: '📚' },
    { name: 'Intermediário', minXP: 500, emoji: '⚡' },
    { name: 'Avançado', minXP: 1500, emoji: '🔥' },
    { name: 'Expert', minXP: 5000, emoji: '🏆' },
    { name: 'Mestre', minXP: 10000, emoji: '👑' }
];

/**
 * Calcula o nível atual baseado no XP
 * 
 * @param {number} xp - Quantidade de XP
 * @returns {object} Nível atual com nome, emoji e progresso
 */
function calculateLevel(xp) {
    let currentLevel = LEVELS[0];
    let nextLevel = LEVELS[1];

    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i].minXP) {
            currentLevel = LEVELS[i];
            nextLevel = LEVELS[i + 1] || null;
            break;
        }
    }

    // Calcula progresso para o próximo nível (em %)
    let progress = 100;
    if (nextLevel) {
        const xpInLevel = xp - currentLevel.minXP;
        const xpNeeded = nextLevel.minXP - currentLevel.minXP;
        progress = Math.round((xpInLevel / xpNeeded) * 100);
    }

    return {
        level: currentLevel.name,
        emoji: currentLevel.emoji,
        xp: xp,
        progress: progress,
        nextLevel: nextLevel ? nextLevel.name : null,
        xpForNextLevel: nextLevel ? nextLevel.minXP - xp : 0
    };
}

/**
 * Adiciona XP ao usuário
 * 
 * @param {string} userId - ID do usuário
 * @param {string} action - Tipo de ação (TRAINING_ADDED, MESSAGE_ANSWERED, etc.)
 * @returns {object} Status atualizado da gamificação
 */
async function addXP(userId, action) {
    const xpAmount = XP_REWARDS[action] || 0;
    if (xpAmount === 0) return null;

    try {
        // Busca o usuário atual
        const user = await db.findOne('users', { id: userId });
        if (!user) throw new Error('Usuário não encontrado');

        // Calcula novo XP e nível
        const newXP = (user.xp || 0) + xpAmount;
        const levelInfo = calculateLevel(newXP);

        // Atualiza no banco
        await db.update('users', userId, {
            xp: newXP,
            level: levelInfo.level
        });

        console.log(`🎮 +${xpAmount} XP para usuário ${userId} (${action}) → ${levelInfo.level}`);

        return {
            xpAdded: xpAmount,
            action: action,
            ...levelInfo
        };
    } catch (error) {
        console.error('❌ Erro ao adicionar XP:', error.message);
        return null;
    }
}

/**
 * Obtém o status de gamificação do usuário
 */
async function getStatus(userId) {
    const user = await db.findOne('users', { id: userId });
    if (!user) throw new Error('Usuário não encontrado');

    const levelInfo = calculateLevel(user.xp || 0);

    // Conta estatísticas
    const trainings = await db.find('ai_training', { user_id: userId });
    const messages = await db.find('messages', { user_id: userId });
    const corrections = messages.filter(m => m.is_corrected);

    return {
        ...levelInfo,
        stats: {
            totalTrainings: trainings.length,
            totalMessages: messages.length,
            totalCorrections: corrections.length
        }
    };
}

module.exports = { addXP, getStatus, calculateLevel, XP_REWARDS, LEVELS };

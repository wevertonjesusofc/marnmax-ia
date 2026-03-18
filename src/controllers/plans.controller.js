/**
 * plans.controller.js - Controlador de planos e cupons
 * 
 * Endpoints:
 * GET  /api/plans             - Listar planos disponíveis (público)
 * POST /api/plans/apply-coupon - Validar e aplicar cupom de desconto
 */

const { db } = require('../config/database');

/**
 * Lista todos os planos disponíveis
 * Esta rota é pública (não requer autenticação)
 */
async function listPlans(req, res) {
    try {
        const plans = await db.find('plans', { is_active: true });

        res.json({
            total: plans.length,
            plans: plans.map(plan => ({
                id: plan.id,
                name: plan.name,
                price: plan.price,
                duration_days: plan.duration_days,
                features: plan.features
            }))
        });

    } catch (error) {
        console.error('❌ Erro ao listar planos:', error.message);
        res.status(500).json({ error: 'Erro interno' });
    }
}

/**
 * Valida e aplica um cupom de desconto
 * Retorna o desconto calculado para o frontend processar
 */
async function applyCoupon(req, res) {
    try {
        const { code, plan_id } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Código do cupom é obrigatório' });
        }

        // Busca o cupom
        const coupon = await db.findOne('coupons', { code: code.toUpperCase() });

        if (!coupon) {
            return res.status(404).json({ error: 'Cupom não encontrado' });
        }

        // Verifica se está ativo
        if (!coupon.is_active) {
            return res.status(400).json({ error: 'Este cupom está inativo' });
        }

        // Verifica se expirou
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Este cupom expirou' });
        }

        // Verifica se atingiu o limite de usos
        if (coupon.current_uses >= coupon.max_uses) {
            return res.status(400).json({ error: 'Este cupom atingiu o limite de usos' });
        }

        // Busca o plano (se informado) para calcular o desconto
        let originalPrice = 0;
        let discountedPrice = 0;

        if (plan_id) {
            const plan = await db.findOne('plans', { id: plan_id });
            if (plan) {
                originalPrice = plan.price;
                discountedPrice = plan.price * (1 - coupon.discount_percent / 100);
            }
        }

        // Incrementa o uso do cupom
        await db.update('coupons', coupon.id, {
            current_uses: coupon.current_uses + 1
        });

        res.json({
            message: 'Cupom válido!',
            coupon: {
                code: coupon.code,
                discount_percent: coupon.discount_percent
            },
            pricing: {
                originalPrice,
                discountedPrice: Math.max(0, discountedPrice),
                savings: originalPrice - discountedPrice
            }
        });

    } catch (error) {
        console.error('❌ Erro ao aplicar cupom:', error.message);
        res.status(500).json({ error: 'Erro interno ao validar cupom' });
    }
}

module.exports = { listPlans, applyCoupon };

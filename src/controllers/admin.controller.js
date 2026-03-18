/**
 * admin.controller.js - Controlador de administração master
 * 
 * Endpoints protegidos por middleware admin:
 * GET  /api/admin/users                  - Listar todos os usuários
 * PUT  /api/admin/users/:id/grant-access - Liberar acesso gratuito
 * POST /api/admin/coupons                - Criar cupom de desconto
 * GET  /api/admin/coupons                - Listar cupons
 * DELETE /api/admin/coupons/:id          - Deletar cupom
 * GET  /api/admin/dashboard              - Dashboard com estatísticas
 */

const { db } = require('../config/database');

/**
 * Lista todos os usuários do sistema
 */
async function listUsers(req, res) {
    try {
        const users = await db.findAll('users');

        // Remove hashes de senha dos resultados
        const safeUsers = users.map(({ password_hash, ...user }) => user);

        res.json({
            total: safeUsers.length,
            users: safeUsers
        });

    } catch (error) {
        console.error('❌ Erro ao listar usuários:', error.message);
        res.status(500).json({ error: 'Erro interno' });
    }
}

/**
 * Libera acesso gratuito para um usuário
 * Define uma nova data de expiração do plano
 */
async function grantAccess(req, res) {
    try {
        const { id } = req.params;
        const { days } = req.body; // Quantidade de dias para liberar

        const user = await db.findOne('users', { id });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Define nova data de expiração
        const newExpiration = new Date();
        newExpiration.setDate(newExpiration.getDate() + (days || 30));

        const updated = await db.update('users', id, {
            plan_expires_at: newExpiration.toISOString(),
            is_active: true
        });

        const { password_hash: _, ...safeUser } = updated;

        res.json({
            message: `Acesso liberado por ${days || 30} dias para ${user.email}`,
            user: safeUser
        });

    } catch (error) {
        console.error('❌ Erro ao liberar acesso:', error.message);
        res.status(500).json({ error: 'Erro interno' });
    }
}

/**
 * Cria um cupom de desconto
 */
async function createCoupon(req, res) {
    try {
        const { code, discount_percent, max_uses, expires_in_days } = req.body;

        // Validações
        if (!code || !discount_percent) {
            return res.status(400).json({
                error: 'Campos obrigatórios: code, discount_percent'
            });
        }

        if (discount_percent < 1 || discount_percent > 100) {
            return res.status(400).json({
                error: 'discount_percent deve estar entre 1 e 100'
            });
        }

        // Verifica se o código já existe
        const existing = await db.findOne('coupons', { code: code.toUpperCase() });
        if (existing) {
            return res.status(409).json({ error: 'Este código de cupom já existe' });
        }

        // Data de expiração
        let expires_at = null;
        if (expires_in_days) {
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + expires_in_days);
            expires_at = expDate.toISOString();
        }

        const coupon = await db.insert('coupons', {
            code: code.toUpperCase(),
            discount_percent,
            max_uses: max_uses || 1,
            current_uses: 0,
            expires_at,
            created_by: req.user.id,
            is_active: true
        });

        res.status(201).json({
            message: 'Cupom criado com sucesso!',
            coupon
        });

    } catch (error) {
        console.error('❌ Erro ao criar cupom:', error.message);
        res.status(500).json({ error: 'Erro interno ao criar cupom' });
    }
}

/**
 * Lista todos os cupons
 */
async function listCoupons(req, res) {
    try {
        const coupons = await db.findAll('coupons');
        res.json({ total: coupons.length, coupons });

    } catch (error) {
        console.error('❌ Erro ao listar cupons:', error.message);
        res.status(500).json({ error: 'Erro interno' });
    }
}

/**
 * Remove um cupom
 */
async function deleteCoupon(req, res) {
    try {
        const { id } = req.params;

        const coupon = await db.findOne('coupons', { id });
        if (!coupon) {
            return res.status(404).json({ error: 'Cupom não encontrado' });
        }

        await db.delete('coupons', id);

        res.json({ message: 'Cupom removido com sucesso' });

    } catch (error) {
        console.error('❌ Erro ao deletar cupom:', error.message);
        res.status(500).json({ error: 'Erro interno' });
    }
}

/**
 * Dashboard com estatísticas gerais do sistema
 */
async function dashboard(req, res) {
    try {
        const users = await db.findAll('users');
        const messages = await db.findAll('messages');
        const trainings = await db.findAll('ai_training');
        const products = await db.findAll('products');
        const coupons = await db.findAll('coupons');

        // Calcula planos ativos
        const activePlans = users.filter(u =>
            u.plan_expires_at && new Date(u.plan_expires_at) > new Date()
        ).length;

        res.json({
            stats: {
                totalUsers: users.length,
                activePlans,
                expiredPlans: users.length - activePlans,
                totalMessages: messages.length,
                totalTrainings: trainings.length,
                totalProducts: products.length,
                totalCoupons: coupons.length,
                corrections: messages.filter(m => m.is_corrected).length
            }
        });

    } catch (error) {
        console.error('❌ Erro no dashboard:', error.message);
        res.status(500).json({ error: 'Erro interno' });
    }
}

module.exports = { listUsers, grantAccess, createCoupon, listCoupons, deleteCoupon, dashboard };

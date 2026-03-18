/**
 * ============================================
 *  ChatMarne - Backend Server
 * ============================================
 * 
 * Plataforma de IA treinável para vendedores de carros
 * que responde automaticamente clientes via WhatsApp.
 * 
 * Stack: Node.js + Express + OpenAI + Z-API + Supabase
 * 
 * @author ChatMarne
 * @version 1.0.0
 */

// Carrega variáveis de ambiente ANTES de tudo
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// ============================================
// INICIALIZAÇÃO DO APP
// ============================================
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES GLOBAIS
// ============================================

// Segurança - headers HTTP
app.use(helmet());

// CORS - permite requisições do frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parser de JSON (body das requisições)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logs de requisições (em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// ============================================
// IMPORTAÇÃO DAS ROTAS
// ============================================
const authRoutes = require('./src/routes/auth.routes');
const aiConfigRoutes = require('./src/routes/aiConfig.routes');
const trainingRoutes = require('./src/routes/training.routes');
const messagesRoutes = require('./src/routes/messages.routes');
const productsRoutes = require('./src/routes/products.routes');
const webhookRoutes = require('./src/routes/webhook.routes');
const adminRoutes = require('./src/routes/admin.routes');
const plansRoutes = require('./src/routes/plans.routes');
const gamificationRoutes = require('./src/routes/gamification.routes');

// ============================================
// REGISTRO DAS ROTAS
// ============================================

// Rota de health check (verificação de saúde do servidor)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'ChatMarne API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: Math.round(process.uptime()) + 's'
    });
});

// Rotas da API
app.use('/api/auth', authRoutes);              // Autenticação
app.use('/api/ai-config', aiConfigRoutes);     // Configuração da IA
app.use('/api/training', trainingRoutes);       // Treinamento da IA
app.use('/api/messages', messagesRoutes);       // Histórico de mensagens
app.use('/api/products', productsRoutes);       // Produtos/veículos
app.use('/api/webhook', webhookRoutes);         // Webhook WhatsApp (Z-API)
app.use('/api/admin', adminRoutes);             // Administração master
app.use('/api/plans', plansRoutes);             // Planos de assinatura
app.use('/api/gamification', gamificationRoutes); // Gamificação

// ============================================
// ROTA DE DEBUG - Lista todas as rotas registradas
// ============================================
app.get('/api/routes', (req, res) => {
    res.json({
        total: 25,
        routes: [
            { methods: ['GET'], path: '/api/health' },
            { methods: ['GET'], path: '/api/routes' },
            // Auth
            { methods: ['POST'], path: '/api/auth/register' },
            { methods: ['POST'], path: '/api/auth/login' },
            { methods: ['GET'], path: '/api/auth/me' },
            // AI Config
            { methods: ['POST'], path: '/api/ai-config' },
            { methods: ['GET'], path: '/api/ai-config' },
            { methods: ['PUT'], path: '/api/ai-config/:id' },
            // Training
            { methods: ['POST'], path: '/api/training' },
            { methods: ['GET'], path: '/api/training' },
            { methods: ['DELETE'], path: '/api/training/:id' },
            // Messages
            { methods: ['GET'], path: '/api/messages' },
            { methods: ['PUT'], path: '/api/messages/:id/correct' },
            // Products
            { methods: ['POST'], path: '/api/products' },
            { methods: ['GET'], path: '/api/products' },
            { methods: ['PUT'], path: '/api/products/:id' },
            { methods: ['DELETE'], path: '/api/products/:id' },
            // Webhook
            { methods: ['POST'], path: '/api/webhook' },
            // Admin
            { methods: ['GET'], path: '/api/admin/users' },
            { methods: ['PUT'], path: '/api/admin/users/:id/grant-access' },
            { methods: ['POST'], path: '/api/admin/coupons' },
            { methods: ['GET'], path: '/api/admin/coupons' },
            { methods: ['DELETE'], path: '/api/admin/coupons/:id' },
            { methods: ['GET'], path: '/api/admin/dashboard' },
            // Plans
            { methods: ['GET'], path: '/api/plans' },
            { methods: ['POST'], path: '/api/plans/apply-coupon' },
            // Gamification
            { methods: ['GET'], path: '/api/gamification/status' }
        ]
    });
});

// ============================================
// TRATAMENTO DE ERROS
// ============================================

// Rota não encontrada (404)
app.use((req, res) => {
    res.status(404).json({
        error: 'Rota não encontrada',
        path: req.originalUrl,
        method: req.method,
        hint: 'Confira a documentação em GET /api/routes'
    });
});

// Erro interno do servidor (500)
app.use((err, req, res, next) => {
    console.error('❌ Erro interno:', err);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV !== 'production' ? err.message : 'Entre em contato com o suporte'
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
    console.log('');
    console.log('============================================');
    console.log('  🚗 ChatMarne API - v1.0.0');
    console.log('============================================');
    console.log(`  🌐 Servidor rodando em: http://localhost:${PORT}`);
    console.log(`  📋 Health Check:        http://localhost:${PORT}/api/health`);
    console.log(`  🗺️  Rotas disponíveis:   http://localhost:${PORT}/api/routes`);
    console.log(`  🔧 Ambiente:            ${process.env.NODE_ENV || 'development'}`);
    console.log('============================================');
    console.log('');
});

module.exports = app;

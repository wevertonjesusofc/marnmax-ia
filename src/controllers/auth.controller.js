/**
 * auth.controller.js - Controlador de autenticação
 * 
 * Endpoints:
 * POST /api/auth/register - Cadastro de novo usuário
 * POST /api/auth/login    - Login com email e senha
 * GET  /api/auth/me       - Dados do usuário autenticado
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

/**
 * Cadastro de novo usuário
 * Cria o usuário com hash da senha e plano gratuito de 7 dias
 */
async function register(req, res) {
    try {
        const { name, email, password, cpf } = req.body;

        // Validação dos campos obrigatórios
        if (!name || !email || !password || !cpf) {
            return res.status(400).json({
                error: 'Todos os campos são obrigatórios: name, email, password, cpf'
            });
        }

        // Verifica se o email já existe
        const existingUser = await db.findOne('users', { email });
        if (existingUser) {
            return res.status(409).json({
                error: 'Este email já está cadastrado'
            });
        }

        // Hash da senha (10 rounds de salt)
        const password_hash = await bcrypt.hash(password, 10);

        // Calcula a data de expiração do plano gratuito (7 dias)
        const planExpires = new Date();
        planExpires.setDate(planExpires.getDate() + 7);

        // Determina se é o admin master (baseado no .env)
        const isAdmin = email === process.env.ADMIN_EMAIL;

        // Cria o usuário no banco
        const user = await db.insert('users', {
            name,
            email,
            password_hash,
            cpf,
            role: isAdmin ? 'admin' : 'user',
            plan_expires_at: planExpires.toISOString(),
            xp: 0,
            level: 'Iniciante',
            is_active: true
        });

        // Gera o token JWT (expira em 7 dias)
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Retorna o usuário (sem o hash da senha) e o token
        const { password_hash: _, ...userWithoutPassword } = user;

        res.status(201).json({
            message: 'Usuário cadastrado com sucesso! Plano gratuito de 7 dias ativado.',
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error('❌ Erro no cadastro:', error.message);
        res.status(500).json({ error: 'Erro interno ao cadastrar usuário' });
    }
}

/**
 * Login com email e senha
 * Retorna o token JWT para autenticação nas demais rotas
 */
async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Validação
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email e senha são obrigatórios'
            });
        }

        // Busca o usuário pelo email
        const user = await db.findOne('users', { email });
        if (!user) {
            return res.status(401).json({
                error: 'Email ou senha incorretos'
            });
        }

        // Verifica a senha
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Email ou senha incorretos'
            });
        }

        // Verifica se o usuário está ativo
        if (!user.is_active) {
            return res.status(403).json({
                error: 'Conta desativada. Entre em contato com o suporte.'
            });
        }

        // Verifica se o plano expirou
        const planExpired = user.plan_expires_at && new Date(user.plan_expires_at) < new Date();

        // Gera o token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { password_hash: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login realizado com sucesso',
            user: userWithoutPassword,
            token,
            planExpired
        });

    } catch (error) {
        console.error('❌ Erro no login:', error.message);
        res.status(500).json({ error: 'Erro interno ao fazer login' });
    }
}

/**
 * Retorna os dados do usuário autenticado
 */
async function getMe(req, res) {
    try {
        const user = await db.findOne('users', { id: req.user.id });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const { password_hash: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });

    } catch (error) {
        console.error('❌ Erro ao buscar perfil:', error.message);
        res.status(500).json({ error: 'Erro interno' });
    }
}

module.exports = { register, login, getMe };

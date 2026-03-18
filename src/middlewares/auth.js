/**
 * auth.js - Middleware de autenticação JWT
 * 
 * Verifica o token JWT no header Authorization.
 * Anexa os dados do usuário em req.user para uso nas rotas protegidas.
 */

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    try {
        // Busca o token no header Authorization: Bearer <token>
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Token de autenticação não fornecido',
                code: 'NO_TOKEN'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verifica e decodifica o token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Anexa dados do usuário na requisição
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            name: decoded.name
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expirado. Faça login novamente.',
                code: 'TOKEN_EXPIRED'
            });
        }

        return res.status(401).json({
            error: 'Token inválido',
            code: 'INVALID_TOKEN'
        });
    }
}

module.exports = authMiddleware;

/**
 * admin.js - Middleware de verificação de admin
 * 
 * Deve ser usado APÓS o middleware de autenticação (auth.js).
 * Verifica se o usuário autenticado tem role === 'admin'.
 */

function adminMiddleware(req, res, next) {
    // Verifica se o middleware de auth já rodou
    if (!req.user) {
        return res.status(401).json({
            error: 'Autenticação necessária',
            code: 'NOT_AUTHENTICATED'
        });
    }

    // Verifica se é admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Acesso restrito. Apenas administradores podem acessar esta rota.',
            code: 'NOT_ADMIN'
        });
    }

    next();
}

module.exports = adminMiddleware;

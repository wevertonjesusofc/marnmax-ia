/**
 * products.controller.js - Controlador de produtos/veículos
 * 
 * Endpoints:
 * POST   /api/products     - Cadastrar produto
 * GET    /api/products      - Listar produtos
 * PUT    /api/products/:id  - Atualizar produto
 * DELETE /api/products/:id  - Remover produto
 */

const { db } = require('../config/database');
const gamification = require('../services/gamification.service');

/**
 * Cadastra um novo produto/veículo
 */
async function create(req, res) {
    try {
        const { name, description, price, category, brand, year, mileage, images } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'O campo "name" é obrigatório' });
        }

        const product = await db.insert('products', {
            user_id: req.user.id,
            name,
            description: description || '',
            price: price || 0,
            category: category || '',
            brand: brand || '',
            year: year || null,
            mileage: mileage || null,
            is_available: true,
            images: images || []
        });

        // +5 XP por produto cadastrado
        const xpResult = await gamification.addXP(req.user.id, 'PRODUCT_ADDED');

        res.status(201).json({
            message: 'Produto cadastrado com sucesso!',
            product,
            gamification: xpResult
        });

    } catch (error) {
        console.error('❌ Erro ao criar produto:', error.message);
        res.status(500).json({ error: 'Erro interno ao cadastrar produto' });
    }
}

/**
 * Lista todos os produtos do usuário
 */
async function list(req, res) {
    try {
        const { category, available } = req.query;

        const filters = { user_id: req.user.id };
        if (category) filters.category = category;
        if (available !== undefined) filters.is_available = available === 'true';

        const products = await db.find('products', filters, {
            orderBy: 'created_at',
            ascending: false
        });

        res.json({ total: products.length, products });

    } catch (error) {
        console.error('❌ Erro ao listar produtos:', error.message);
        res.status(500).json({ error: 'Erro interno' });
    }
}

/**
 * Atualiza um produto
 */
async function update(req, res) {
    try {
        const { id } = req.params;
        const { name, description, price, category, brand, year, mileage, is_available, images } = req.body;

        // Verifica se o produto pertence ao usuário
        const product = await db.findOne('products', { id, user_id: req.user.id });
        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = price;
        if (category !== undefined) updateData.category = category;
        if (brand !== undefined) updateData.brand = brand;
        if (year !== undefined) updateData.year = year;
        if (mileage !== undefined) updateData.mileage = mileage;
        if (is_available !== undefined) updateData.is_available = is_available;
        if (images !== undefined) updateData.images = images;

        const updated = await db.update('products', id, updateData);

        res.json({
            message: 'Produto atualizado com sucesso!',
            product: updated
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar produto:', error.message);
        res.status(500).json({ error: 'Erro interno ao atualizar produto' });
    }
}

/**
 * Remove um produto
 */
async function remove(req, res) {
    try {
        const { id } = req.params;

        const product = await db.findOne('products', { id, user_id: req.user.id });
        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        await db.delete('products', id);

        res.json({ message: 'Produto removido com sucesso' });

    } catch (error) {
        console.error('❌ Erro ao remover produto:', error.message);
        res.status(500).json({ error: 'Erro interno ao remover produto' });
    }
}

module.exports = { create, list, update, remove };

/**
 * database.js - Configuração do banco de dados
 * 
 * Suporta dois modos:
 * 1. Supabase: quando SUPABASE_URL e SUPABASE_KEY estão configurados
 * 2. In-Memory: quando não há Supabase configurado (ideal para dev/testes)
 * 
 * O store in-memory persiste dados apenas enquanto o servidor está rodando.
 * Para produção, configure o Supabase.
 */

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// ============================================
// SUPABASE CLIENT
// ============================================
let supabase = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  console.log('✅ Conectado ao Supabase');
} else {
  console.log('⚠️  Supabase não configurado - usando store in-memory');
}

// ============================================
// IN-MEMORY STORE (Desenvolvimento/Testes)
// ============================================
const memoryStore = {
  users: [],
  ai_config: [],
  ai_training: [],
  messages: [],
  products: [],
  plans: [
    // Planos padrão pré-cadastrados
    {
      id: uuidv4(),
      name: 'Gratuito',
      price: 0,
      duration_days: 7,
      features: ['1 IA', '100 mensagens/mês', 'Suporte básico'],
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Profissional',
      price: 97.00,
      duration_days: 30,
      features: ['1 IA', '1000 mensagens/mês', 'Treinamento ilimitado', 'Suporte prioritário'],
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Empresarial',
      price: 197.00,
      duration_days: 30,
      features: ['3 IAs', 'Mensagens ilimitadas', 'Treinamento ilimitado', 'Suporte VIP', 'API dedicada'],
      created_at: new Date().toISOString()
    }
  ],
  coupons: []
};

// ============================================
// DATABASE ABSTRACTION LAYER (db)
// Métodos genéricos para CRUD independente do backend
// ============================================
const db = {
  /**
   * Insere um registro em uma tabela
   * @param {string} table - Nome da tabela
   * @param {object} data - Dados para inserir
   * @returns {object} Registro inserido
   */
  async insert(table, data) {
    const record = {
      id: uuidv4(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data: result, error } = await supabase
        .from(table)
        .insert(record)
        .select()
        .single();
      if (error) throw new Error(`Erro ao inserir em ${table}: ${error.message}`);
      return result;
    }

    // In-memory
    if (!memoryStore[table]) memoryStore[table] = [];
    memoryStore[table].push(record);
    return record;
  },

  /**
   * Busca registros com filtros opcionais
   * @param {string} table - Nome da tabela
   * @param {object} filters - Pares chave-valor para filtrar
   * @param {object} options - { limit, orderBy, ascending }
   * @returns {Array} Registros encontrados
   */
  async find(table, filters = {}, options = {}) {
    if (supabase) {
      let query = supabase.from(table).select('*');
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? false });
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }
      const { data, error } = await query;
      if (error) throw new Error(`Erro ao buscar em ${table}: ${error.message}`);
      return data || [];
    }

    // In-memory
    let results = (memoryStore[table] || []).filter(record => {
      return Object.entries(filters).every(([key, value]) => record[key] === value);
    });

    if (options.orderBy) {
      results.sort((a, b) => {
        if (options.ascending) return a[options.orderBy] > b[options.orderBy] ? 1 : -1;
        return a[options.orderBy] < b[options.orderBy] ? 1 : -1;
      });
    }

    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  },

  /**
   * Busca um único registro
   */
  async findOne(table, filters = {}) {
    if (supabase) {
      let query = supabase.from(table).select('*');
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query.single();
      if (error && error.code !== 'PGRST116') {
        throw new Error(`Erro ao buscar em ${table}: ${error.message}`);
      }
      return data || null;
    }

    // In-memory
    const records = memoryStore[table] || [];
    return records.find(record => {
      return Object.entries(filters).every(([key, value]) => record[key] === value);
    }) || null;
  },

  /**
   * Atualiza um registro por ID
   */
  async update(table, id, data) {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data: result, error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(`Erro ao atualizar em ${table}: ${error.message}`);
      return result;
    }

    // In-memory
    const records = memoryStore[table] || [];
    const index = records.findIndex(r => r.id === id);
    if (index === -1) throw new Error(`Registro não encontrado em ${table}`);
    records[index] = { ...records[index], ...updateData };
    return records[index];
  },

  /**
   * Remove um registro por ID
   */
  async delete(table, id) {
    if (supabase) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw new Error(`Erro ao deletar em ${table}: ${error.message}`);
      return true;
    }

    // In-memory
    const records = memoryStore[table] || [];
    const index = records.findIndex(r => r.id === id);
    if (index === -1) throw new Error(`Registro não encontrado em ${table}`);
    records.splice(index, 1);
    return true;
  },

  /**
   * Retorna todos os registros de uma tabela
   */
  async findAll(table) {
    return this.find(table);
  }
};

module.exports = { db, supabase, memoryStore };

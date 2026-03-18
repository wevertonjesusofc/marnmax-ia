/**
 * schemas.js - Definição das tabelas do banco de dados
 * 
 * Execute esses SQLs no Supabase SQL Editor para criar as tabelas.
 * No modo in-memory, as tabelas são criadas automaticamente.
 */

const schemas = {
    // ============================================
    // TABELA: users
    // Armazena dados dos usuários da plataforma
    // ============================================
    users: `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      cpf VARCHAR(14) UNIQUE NOT NULL,
      role VARCHAR(20) DEFAULT 'user',
      plan_id UUID REFERENCES plans(id),
      plan_expires_at TIMESTAMP WITH TIME ZONE,
      zapi_instance_id VARCHAR(255),
      zapi_token VARCHAR(255),
      xp INTEGER DEFAULT 0,
      level VARCHAR(50) DEFAULT 'Iniciante',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

    // ============================================
    // TABELA: ai_config
    // Configuração da IA de cada usuário
    // ============================================
    ai_config: `
    CREATE TABLE IF NOT EXISTS ai_config (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      ai_name VARCHAR(255) DEFAULT 'Assistente',
      tone VARCHAR(50) DEFAULT 'amigável',
      objective VARCHAR(50) DEFAULT 'vender',
      sales_strategy TEXT,
      welcome_message TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

    // ============================================
    // TABELA: ai_training
    // Dados de treinamento da IA
    // ============================================
    ai_training: `
    CREATE TABLE IF NOT EXISTS ai_training (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL DEFAULT 'text',
      title VARCHAR(255),
      content TEXT NOT NULL,
      source VARCHAR(50) DEFAULT 'manual',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

    // ============================================
    // TABELA: messages
    // Histórico de mensagens entre clientes e IA
    // ============================================
    messages: `
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      client_phone VARCHAR(20) NOT NULL,
      client_name VARCHAR(255),
      client_message TEXT NOT NULL,
      ai_response TEXT,
      human_response TEXT,
      is_corrected BOOLEAN DEFAULT false,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

    // ============================================
    // TABELA: products
    // Produtos/veículos cadastrados pelo vendedor
    // ============================================
    products: `
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(12,2),
      category VARCHAR(100),
      brand VARCHAR(100),
      year INTEGER,
      mileage INTEGER,
      is_available BOOLEAN DEFAULT true,
      images TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

    // ============================================
    // TABELA: plans
    // Planos de assinatura disponíveis
    // ============================================
    plans: `
    CREATE TABLE IF NOT EXISTS plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      duration_days INTEGER NOT NULL DEFAULT 30,
      features JSONB,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

    // ============================================
    // TABELA: coupons
    // Cupons de desconto
    // ============================================
    coupons: `
    CREATE TABLE IF NOT EXISTS coupons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) UNIQUE NOT NULL,
      discount_percent INTEGER NOT NULL,
      max_uses INTEGER DEFAULT 1,
      current_uses INTEGER DEFAULT 0,
      expires_at TIMESTAMP WITH TIME ZONE,
      created_by UUID REFERENCES users(id),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `
};

/**
 * Retorna todo o SQL para criação do banco
 */
function getAllSchemasSQL() {
    // plans deve ser criado antes de users (referência)
    const order = ['plans', 'coupons', 'users', 'ai_config', 'ai_training', 'messages', 'products'];
    return order.map(table => schemas[table]).join('\n');
}

module.exports = { schemas, getAllSchemasSQL };

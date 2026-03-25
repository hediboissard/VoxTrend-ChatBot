const pool = require('./pool')

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      api_key UUID UNIQUE DEFAULT gen_random_uuid(),
      website_url VARCHAR(255),
      widget_color VARCHAR(7) DEFAULT '#7C3AED',
      widget_logo_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `)
  console.log('✅ Table clients créée')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'agent',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `)
  console.log('✅ Table users créée')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
      visitor_id VARCHAR(255) NOT NULL,
      visitor_name VARCHAR(255),
      status VARCHAR(20) DEFAULT 'open',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `)
  console.log('✅ Table conversations créée')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
      sender_role VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `)
  console.log('✅ Table messages créée')

  await pool.close?.()
  process.exit(0)
}

migrate().catch((err) => {
  console.error('❌ Erreur migration :', err)
  process.exit(1)
})
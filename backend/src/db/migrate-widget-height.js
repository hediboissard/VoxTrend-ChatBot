const pool = require('./pool')

async function migrate() {
  await pool.query(`
    ALTER TABLE clients
      ADD COLUMN IF NOT EXISTS widget_height INTEGER DEFAULT 600;
  `)
  console.log('✅ Colonne widget_height ajoutée')
  process.exit(0)
}

migrate().catch(err => {
  console.error('❌ Erreur migration:', err)
  process.exit(1)
})

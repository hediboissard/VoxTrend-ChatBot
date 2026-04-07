const pool = require('./pool')

async function migrate() {
  await pool.query(`
    ALTER TABLE clients
      ADD COLUMN IF NOT EXISTS widget_text_color VARCHAR(7) DEFAULT '#ffffff';
  `)
  console.log('✅ Colonne widget_text_color ajoutée')
  process.exit(0)
}

migrate().catch(err => {
  console.error('❌ Erreur migration:', err)
  process.exit(1)
})

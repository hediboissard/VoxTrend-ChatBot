const pool = require('./pool')

async function migrate() {
  // Ajouter une séquence auto-incrémentée
  await pool.query(`
    ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS ticket_number SERIAL;
  `)
  console.log('✅ Colonne ticket_number ajoutée')

  process.exit(0)
}

migrate().catch(err => {
  console.error('❌ Erreur :', err)
  process.exit(1)
})
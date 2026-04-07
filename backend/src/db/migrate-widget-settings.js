const pool = require('./pool')

async function migrate() {
  await pool.query(`
    ALTER TABLE clients
      ADD COLUMN IF NOT EXISTS widget_greeting VARCHAR(255) DEFAULT 'Bonjour 👋',
      ADD COLUMN IF NOT EXISTS widget_subtitle VARCHAR(255) DEFAULT 'Une question ? Nous répondons en quelques minutes.',
      ADD COLUMN IF NOT EXISTS widget_faq JSONB DEFAULT '["Quels sont vos délais de livraison ?","Comment suivre ma commande ?","Quelle est votre politique de retour ?"]'::jsonb;
  `)
  console.log('✅ Colonnes widget_greeting, widget_subtitle, widget_faq ajoutées')
  process.exit(0)
}

migrate().catch(err => {
  console.error('❌ Erreur migration:', err)
  process.exit(1)
})

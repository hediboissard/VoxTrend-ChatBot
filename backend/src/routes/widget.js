const express = require('express')
const router = express.Router()
const pool = require('../db/pool')

// GET /api/widget/config?apiKey=xxx
// Appelée par le widget au chargement pour récupérer les couleurs/logo
router.get('/config', async (req, res) => {
  const { apiKey } = req.query

  if (!apiKey) {
    return res.status(400).json({ error: 'apiKey manquante' })
  }

  try {
    const result = await pool.query(
      'SELECT id, name, widget_color, widget_logo_url FROM clients WHERE api_key = $1',
      [apiKey]
    )

    const client = result.rows[0]

    if (!client) {
      return res.status(404).json({ error: 'Client introuvable' })
    }

    res.json({
      clientId: client.id,
      clientName: client.name,
      primaryColor: client.widget_color,
      logoUrl: client.widget_logo_url,
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
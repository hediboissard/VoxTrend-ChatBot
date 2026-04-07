const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const authMiddleware = require('../middleware/auth')

// GET /api/widget/config?apiKey=xxx
router.get('/config', async (req, res) => {
  const { apiKey } = req.query

  if (!apiKey) {
    return res.status(400).json({ error: 'apiKey manquante' })
  }

  try {
    const result = await pool.query(
      'SELECT id, name, widget_color, widget_text_color, widget_logo_url, widget_greeting, widget_subtitle, widget_faq, widget_height FROM clients WHERE api_key = $1',
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
      textColor: client.widget_text_color || '#ffffff',
      logoUrl: client.widget_logo_url,
      greeting: client.widget_greeting || 'Bonjour 👋',
      subtitle: client.widget_subtitle || 'Une question ? Nous répondons en quelques minutes.',
      faq: client.widget_faq || [],
      height: client.widget_height || 600,
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/widget/settings
router.get('/settings', authMiddleware, async (req, res) => {
  const { clientId } = req.user

  try {
    const result = await pool.query(
      'SELECT widget_color, widget_text_color, widget_greeting, widget_subtitle, widget_faq, widget_height FROM clients WHERE id = $1',
      [clientId]
    )

    const client = result.rows[0]
    if (!client) return res.status(404).json({ error: 'Client introuvable' })

    res.json({
      primaryColor: client.widget_color || '#7C3AED',
      textColor: client.widget_text_color || '#ffffff',
      greeting: client.widget_greeting || 'Bonjour 👋',
      subtitle: client.widget_subtitle || 'Une question ? Nous répondons en quelques minutes.',
      faq: client.widget_faq || [],
      height: client.widget_height || 600,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/widget/settings
router.put('/settings', authMiddleware, async (req, res) => {
  const { clientId } = req.user
  const { primaryColor, textColor, greeting, subtitle, faq, height } = req.body

  try {
    await pool.query(
      `UPDATE clients SET
        widget_color      = COALESCE($1, widget_color),
        widget_text_color = COALESCE($2, widget_text_color),
        widget_greeting   = COALESCE($3, widget_greeting),
        widget_subtitle   = COALESCE($4, widget_subtitle),
        widget_faq        = COALESCE($5, widget_faq),
        widget_height     = COALESCE($6, widget_height)
      WHERE id = $7`,
      [
        primaryColor || null,
        textColor || null,
        greeting || null,
        subtitle || null,
        faq ? JSON.stringify(faq) : null,
        height ? parseInt(height) : null,
        clientId,
      ]
    )

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router

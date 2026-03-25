const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const pool = require('../db/pool')

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' })
  }

  try {
    // Chercher l'agent par son email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    const user = result.rows[0]

    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects' })
    }

    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Identifiants incorrects' })
    }

    // Générer le JWT
    const token = jwt.sign(
      {
        userId: user.id,
        clientId: user.client_id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.json({ token, role: user.role })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
const jwt = require('jsonwebtoken')

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    return res.status(401).json({ error: 'Token manquant' })
  }

  // Le header doit être "Bearer <token>"
  const token = authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Format de token invalide' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // { userId, clientId, email, role }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}
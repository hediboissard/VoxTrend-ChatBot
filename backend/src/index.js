require('dotenv').config()
const express = require('express')
const http = require('http')
const cors = require('cors')
const { Server } = require('socket.io')
const pool = require('./db/pool')
const path = require('path')
const fs = require('fs')

const authRoutes = require('./routes/auth')
const conversationsRoutes = require('./routes/conversations')
const widgetRoutes = require('./routes/widget')
const uploadRoutes = require('./routes/upload')


const app = express()

// Créer le serveur HTTP à partir d'Express
const server = http.createServer(app)

// Attacher Socket.io au serveur HTTP
const io = new Server(server, {
  cors: {
    origin: '*', // En prod tu mettras les vrais domaines
    methods: ['GET', 'POST']
  }
})

app.use(cors())
app.use(express.json())

app.use('/widget', express.static(path.join(__dirname, '../widget')))

app.use('/api/auth', authRoutes)
app.use('/api/conversations', conversationsRoutes)
app.use('/api/widget', widgetRoutes)


app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connectée' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

const uploadsDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/api/upload', require('./routes/upload'))

// Charger la logique Socket.io
require('./socket')(io)

// Utiliser server.listen et non app.listen
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`)
})
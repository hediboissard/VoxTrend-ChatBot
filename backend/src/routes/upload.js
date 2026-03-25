const express = require('express')
const multer = require('multer')
const path = require('path')
const router = express.Router()

// Dossier de stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
    const ext = path.extname(file.originalname)
    cb(null, `${unique}${ext}`)
  },
})

// Filtrer les types autorisés
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|heic|bmp|pdf|doc|docx|xls|xlsx|txt|svg)$/i
  const ext = path.extname(file.originalname)
  
  if (allowedExtensions.test(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Type de fichier non autorisé'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
})

// POST /api/upload
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier reçu' })
  }

  const fileUrl = `/uploads/${req.file.filename}`

  res.json({
    url: fileUrl,
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size,
  })
})

module.exports = router
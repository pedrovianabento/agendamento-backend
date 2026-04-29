import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Pasta de uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `modelo-${Date.now()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas'));
  }
});

// GET all modelos
router.get('/', async (req, res) => {
  try {
    const modelos = await prisma.modelo.findMany({ orderBy: { criadoEm: 'desc' } });
    res.json(modelos);
  } catch (e) {
    res.json([]);
  }
});

// POST upload image
router.post('/upload', upload.single('imagem'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const descricao = req.body.descricao || '';
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/uploads/${req.file.filename}`;

    const modelo = await prisma.modelo.create({
      data: { url, descricao }
    });

    res.status(201).json(modelo);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao fazer upload' });
  }
});

// PUT update modelos (replace all - for URL-based)
router.put('/', async (req, res) => {
  try {
    const { modelos, senha } = req.body;
    
    const config = await prisma.config.findUnique({ where: { id: 1 } });
    if (!config || senha !== config.senhaAdmin) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    await prisma.modelo.deleteMany();
    for (const m of modelos) {
      await prisma.modelo.create({
        data: { url: m.url, descricao: m.descricao || '' }
      });
    }

    const updated = await prisma.modelo.findMany({ orderBy: { criadoEm: 'desc' } });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao salvar modelos' });
  }
});

// DELETE single modelo
router.delete('/:id', async (req, res) => {
  try {
    const { senha } = req.body;
    const config = await prisma.config.findUnique({ where: { id: 1 } });
    if (!config || senha !== config.senhaAdmin) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    const modelo = await prisma.modelo.findUnique({ where: { id: parseInt(req.params.id) } });
    if (modelo) {
      // Delete file if it's a local upload
      if (modelo.url.includes('/uploads/')) {
        const filename = modelo.url.split('/uploads/').pop();
        const filepath = path.join(uploadDir, filename || '');
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      }
      await prisma.modelo.delete({ where: { id: parseInt(req.params.id) } });
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao deletar modelo' });
  }
});

export default router;

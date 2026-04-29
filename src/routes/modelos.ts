import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all modelos
router.get('/', async (req, res) => {
  try {
    const modelos = await prisma.modelo.findMany({ orderBy: { criadoEm: 'desc' } });
    res.json(modelos);
  } catch (e) {
    res.json([]);
  }
});

// PUT update modelos (replace all)
router.put('/', async (req, res) => {
  try {
    const { modelos, senha } = req.body;
    
    // Verify admin password
    const config = await prisma.config.findUnique({ where: { id: 1 } });
    if (!config || senha !== config.senhaAdmin) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Replace all modelos
    await prisma.modelo.deleteMany();
    for (const m of modelos) {
      await prisma.modelo.create({
        data: {
          url: m.url,
          descricao: m.descricao || ''
        }
      });
    }

    const updated = await prisma.modelo.findMany({ orderBy: { criadoEm: 'desc' } });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao salvar modelos' });
  }
});

export default router;

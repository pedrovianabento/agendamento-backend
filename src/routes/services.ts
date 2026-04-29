import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all services
router.get('/', async (req, res) => {
  try {
    const services = await prisma.servico.findMany({ orderBy: { ordem: 'asc' } });
    res.json(services);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar serviços' });
  }
});

export default router;

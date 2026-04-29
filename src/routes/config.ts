import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET config
router.get('/', async (req, res) => {
  try {
    let config = await prisma.config.findUnique({ where: { id: 1 } });
    if (!config) {
      config = await prisma.config.create({ data: { id: 1 } });
    }
    let servicos = await prisma.servico.findMany({ orderBy: { ordem: 'asc' } });
    
    // Se não tem serviços, cria os padrão
    if (servicos.length === 0) {
      const defaults = [
        { nome: "Corte Masculino", preco: 45, duracao: "30 min", ordem: 0 },
        { nome: "Barba", preco: 35, duracao: "30 min", ordem: 1 },
        { nome: "Corte + Barba", preco: 70, duracao: "60 min", ordem: 2 },
        { nome: "Corte Infantil", preco: 35, duracao: "30 min", ordem: 3 },
        { nome: "Sobrancelha", preco: 15, duracao: "15 min", ordem: 4 },
        { nome: "Hidratação Capilar", preco: 50, duracao: "40 min", ordem: 5 },
      ];
      for (const s of defaults) {
        await prisma.servico.create({ data: s });
      }
      servicos = await prisma.servico.findMany({ orderBy: { ordem: 'asc' } });
    }
    
    res.json({ ...config, servicos });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// PUT config (auth required)
router.put('/', async (req, res) => {
  try {
    const { senha, ...data } = req.body;
    
    // Verify admin password
    const config = await prisma.config.findUnique({ where: { id: 1 } });
    if (!config || senha !== config.senhaAdmin) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Update config
    const { servicos, ...configData } = data;
    const updated = await prisma.config.update({
      where: { id: 1 },
      data: configData
    });

    // Update services if provided
    if (servicos && Array.isArray(servicos)) {
      await prisma.servico.deleteMany();
      for (let i = 0; i < servicos.length; i++) {
        await prisma.servico.create({
          data: {
            nome: servicos[i].nome,
            preco: servicos[i].preco,
            duracao: servicos[i].duracao,
            ordem: i
          }
        });
      }
    }

    const newServicos = await prisma.servico.findMany({ orderBy: { ordem: 'asc' } });
    res.json({ ...updated, servicos: newServicos });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

// POST verify password
router.post('/login', async (req, res) => {
  try {
    const { senha } = req.body;
    const config = await prisma.config.findUnique({ where: { id: 1 } });
    if (!config || senha !== config.senhaAdmin) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;

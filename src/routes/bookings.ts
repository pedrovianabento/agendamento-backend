import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await prisma.agendamento.findMany({
      orderBy: [{ data: 'asc' }, { horario: 'asc' }]
    });
    res.json(bookings);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

// GET bookings by date
router.get('/date/:date', async (req, res) => {
  try {
    const bookings = await prisma.agendamento.findMany({
      where: { data: req.params.date },
      orderBy: { horario: 'asc' }
    });
    res.json(bookings);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

// POST create booking
router.post('/', async (req, res) => {
  try {
    const { servico, preco, data, dataBR, horario, nomeCliente, telefoneCliente } = req.body;
    
    // Check if slot is already taken
    const existing = await prisma.agendamento.findFirst({
      where: { data, horario }
    });
    if (existing) {
      return res.status(409).json({ error: 'Horário já reservado' });
    }

    const booking = await prisma.agendamento.create({
      data: { servico, preco, data, dataBR, horario, nomeCliente, telefoneCliente }
    });
    res.status(201).json(booking);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

// DELETE booking (auth required via query param)
router.delete('/:id', async (req, res) => {
  try {
    const { senha } = req.body;
    const config = await prisma.config.findUnique({ where: { id: 1 } });
    if (!config || senha !== config.senhaAdmin) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    await prisma.agendamento.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao deletar agendamento' });
  }
});

export default router;

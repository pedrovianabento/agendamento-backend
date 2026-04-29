import express from 'express';
import cors from 'cors';
import configRoutes from './routes/config';
import bookingRoutes from './routes/bookings';
import serviceRoutes from './routes/services';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    'https://agendamento-online-rouge.vercel.app',
    'https://agendamento-online-rouge.vercel.app/',
    process.env.FRONTEND_URL || '*'
  ],
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Agendamento Online API' });
});

app.use('/api/config', configRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

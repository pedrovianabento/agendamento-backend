import express from 'express';
import cors from 'cors';
import path from 'path';
import configRoutes from './routes/config';
import bookingRoutes from './routes/bookings';
import serviceRoutes from './routes/services';
import modeloRoutes from './routes/modelos';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS - libera acesso do frontend
app.use(cors());

// Fallback CORS headers para garantir
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Servir imagens uploaded
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Agendamento Online API' });
});

app.use('/api/config', configRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/modelos', modeloRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Keep-alive: pinga a si mesmo a cada 14 min para não dormir
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      fetch(`https://agendamento-backend-api-gjcn.onrender.com/`)
        .then(() => console.log('Keep-alive ping'))
        .catch(() => {});
    }, 14 * 60 * 1000);
  }
});

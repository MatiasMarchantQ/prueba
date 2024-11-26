import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Importaciones de rutas
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import regionRoutes from './routes/regionRoutes.js';
import communeRoutes from './routes/communeRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import saleschannelRoutes from './routes/saleschannelRoutes.js';
import saleStatusRoutes from './routes/saleStatusRoutes.js';
import promotionRoutes from './routes/promotionRoutes.js';
import dashboardRoutes from './controllers/dashboardController.js';
import contractRoutes from './routes/contractRoutes.js';

import sequelize from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://ventas.canalisp.cl' 
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '/uploads')))

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/communes', communeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/channels', saleschannelRoutes);
app.use('/api/sale-statuses', saleStatusRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/contracts', contractRoutes);

// Servir archivos estáticos desde la carpeta 'frontend/build'
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Manejar la ruta raíz y cualquier otra ruta no encontrada para el frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Middleware para manejar rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador de errores global
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: error.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack,
  });
});

//Localhost
const PORT = process.env.PORT || 3003;

// Produccion
//const PORT = process.env.PORT || 3002;

// Iniciar el servidor
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
    
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
  }
};

startServer();

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Aplicación specific logging, throwing an error, or other logic here
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Aplicación specific logging, throwing an error, or other logic here
});
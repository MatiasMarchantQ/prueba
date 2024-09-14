import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import regionRoutes from './routes/regionRoutes.js';
import communeRoutes from './routes/communeRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import sequelize from './config/db.js';

const app = express();

app.use(express.json());
app.use(cors());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', salesRoutes);
app.use('/api', companyRoutes);
app.use('/api', regionRoutes);
app.use('/api', communeRoutes);
app.use('/api', roleRoutes);

sequelize.sync()
  .then(() => console.log('Base de datos sincronizada'))
  .catch(err => console.error('Error en la sincronización con la Base de datos:', err));

app.listen(3001, () => {
  console.log('Servidor corriendo en el puerto 3001');
});
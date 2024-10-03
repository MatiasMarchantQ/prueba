import express from 'express';
import cors from 'cors';
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
import sequelize from './config/db.js';

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

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

app.use('/uploads', express.static('uploads'));

app.listen(3002, () => {
  console.log('Servidor corriendo en el puerto 3001');
});

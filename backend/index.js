const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const sequelize = require('./config/db');

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Sync database
sequelize.sync()
  .then(() => console.log('Base de datos sincronizada'))
  .catch(err => console.error('Error en la sincronización con la Base de datos:', err));

app.listen(3000, () => {
  console.log('Servidor corriendo en el puerto 3000');
});

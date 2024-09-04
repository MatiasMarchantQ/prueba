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
  .then(() => console.log('Database synced'))
  .catch(err => console.error('Database sync failed:', err));

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

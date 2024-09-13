import { Sequelize } from 'sequelize';
import { db } from '../config/config.js';

const sequelize = new Sequelize(db.name, db.user, db.password, {
  host: db.host,
  dialect: 'mysql',
});

export default sequelize;
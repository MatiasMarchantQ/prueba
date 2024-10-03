import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Region = sequelize.define('Region', {
  region_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  region_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  region_code: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  modified_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'User',
      key: 'user_id',
    },
    onUpdate: 'CASCADE',
  },
}, {
  tableName: 'regions',
  timestamps: false,
});

export default Region;
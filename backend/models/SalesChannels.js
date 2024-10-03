import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const SalesChannel = sequelize.define('SalesChannel', {
  sales_channel_id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  channel_name: {
    type: DataTypes.STRING(100)
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
  modified_by_user_id: {
    type: DataTypes.INTEGER(11),
    allowNull: true,
    references: {
      model: 'User',
      key: 'user_id',
    },
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
}, {
  tableName: 'saleschannels',
  timestamps: false,
});

export default SalesChannel;
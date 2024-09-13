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
  description: {
    type: DataTypes.TEXT
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
  modified_by_user_id: {
    type: DataTypes.INTEGER(11),
    allowNull: true,
  },
}, {
  tableName: 'SalesChannels',
  timestamps: true,
});

export default SalesChannel;
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const SaleStatus = sequelize.define('SaleStatus', {
  sale_status_id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  status_name: {
    type: DataTypes.STRING(50)
  },
  description: {
    type: DataTypes.TEXT
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    onUpdate: sequelize.literal('CURRENT_TIMESTAMP')
  },
  modified_by_user_id: {
    type: DataTypes.INTEGER(11),
    allowNull: true
  }
}, {
  tableName: 'SaleStatuses',
  timestamps: true,
});

export default SaleStatus;
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const SaleStatusReason = sequelize.define('SaleStatusReason', {
  sale_status_reason_id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  reason_name: {
    type: DataTypes.STRING(50)
  },
  sale_status_id: {
    type: DataTypes.INTEGER(11),
    references: {
      model: 'SaleStatus',
      key: 'sale_status_id',
    },
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
  }
}, {
  tableName: 'salestatusreasons',
  timestamps: false,
});

export default SaleStatusReason;
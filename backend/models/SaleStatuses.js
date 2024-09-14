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
  tableName: 'salestatuses',
  timestamps: false,
});

export default SaleStatus;
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const SaleHistory = sequelize.define('SaleHistory', {
  history_id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  sale_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Sales',
      key: 'sale_id',
    },
  },
  previous_status_id: {
    type: DataTypes.INTEGER(11)
  },
  new_status_id: {
    type: DataTypes.INTEGER(11)
  },
  reason: {
    type: DataTypes.TEXT
  },
  modified_by_user_id: {
    type: DataTypes.INTEGER(11),
    allowNull: true,
    references: {
      model: 'User',
      key: 'user_id',
    },
  },
  modification_date: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  }
}, {
  tableName: 'salehistories',
  timestamps: false,
});

export default SaleHistory;
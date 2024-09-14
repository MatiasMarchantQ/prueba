import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Promotion = sequelize.define('Promotion', {
  promotion_id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  promotion: {
    type: DataTypes.TEXT
  },
  installation_amount_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'InstallationAmount',
      key: 'installation_amount_id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  modified_by_user_id: {
    type: DataTypes.INTEGER(11),
    references: {
      model: 'User',
      key: 'user_id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
  modified_by_user_id: {
    type: DataTypes.INTEGER(11)
  },
}, {
  tableName: 'promotions',
  timestamps: false,
});

export default Promotion;
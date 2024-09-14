import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const InstallationAmount = sequelize.define('InstallationAmount', {
  installation_amount_id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  amount: {
    type: DataTypes.STRING,
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
    type: DataTypes.TINYINT,
    references: {
      model: 'User',
      key: 'user_id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  is_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
  },
}, {
  tableName: 'installationamounts',
  timestamps: false,
});

export default InstallationAmount;
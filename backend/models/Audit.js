import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Audit = sequelize.define('Audit', {
  audit_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  table_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  affected_table_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  change_details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "User",
      key: 'user_id',
    },
  },
  change_date: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  user_role: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
}, {
  tableName: 'audit',
  timestamps: false,
});

export default Audit;
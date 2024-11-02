// models/ContractTypes.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Contract = sequelize.define('Contract', {
  contract_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  contract_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
    tableName: 'contract',
    timestamps: false 
});

export default Contract;
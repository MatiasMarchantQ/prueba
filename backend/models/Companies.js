import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Company = sequelize.define('Company', {
  company_id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  company_name: {
    type: DataTypes.STRING(255),
    index: true
  }
}, {
  tableName: 'companies',
  timestamps: false,
});



export default Company;
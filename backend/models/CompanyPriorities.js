import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CompanyPriority = sequelize.define('CompanyPriority', {
  company_priority_id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.INTEGER(11),
    references: {
      model: 'Company',
      key: 'company_id'
    },
    onUpdate: 'CASCADE'
  },
  priority_level: {
    type: DataTypes.INTEGER(11)
  }
}, {
  tableName: 'companypriorities',
  timestamps: false,
});


export default CompanyPriority;
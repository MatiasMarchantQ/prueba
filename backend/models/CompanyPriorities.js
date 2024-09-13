import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Priority = sequelize.define('Priority', {
  priority_id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.INTEGER(11),
    references: {
      model: 'Company',
      key: 'company_id'
    }
  },
  priority_level: {
    type: DataTypes.INTEGER(11)
  }
});

export default Priority;
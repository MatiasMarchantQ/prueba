const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SaleSynchronization = sequelize.define('SaleSynchronization', {
  synchronization_id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  sale_id: {
    type: DataTypes.INTEGER(11)
  },
  synchronization_date: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
  synchronized_status: {
    type: DataTypes.STRING(50)
  },
  comments: {
    type: DataTypes.TEXT
  }
});

module.exports = SaleSynchronization;
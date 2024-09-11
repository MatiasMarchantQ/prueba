const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Promotion = sequelize.define('Promotion', {
  promotion_id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  description: {
    type: DataTypes.TEXT
  },
  commune_id: {
    type: DataTypes.INTEGER(11)
  },
  installation_amount: {
    type: DataTypes.DECIMAL(10, 2)
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    onUpdate: sequelize.literal('CURRENT_TIMESTAMP')
  },
  modified_by_user_id: {
    type: DataTypes.INTEGER(11)
  }
});

module.exports = Promotion;
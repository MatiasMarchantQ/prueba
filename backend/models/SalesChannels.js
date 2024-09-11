const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SalesChannel = sequelize.define('SalesChannel', {
  sales_channel_id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  channel_name: {
    type: DataTypes.STRING(100)
  },
  description: {
    type: DataTypes.TEXT
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

module.exports = SalesChannel;
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./Users');

const Region = sequelize.define('Region', {
  region_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  region_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  region_code: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  modified_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'user_id',
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  },
}, {
  tableName: 'Regions',
  timestamps: false,
});

Region.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifier' });

module.exports = Region;

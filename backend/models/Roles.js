const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./Users');

const Role = sequelize.define('Role', {
  role_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  role_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
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
  tableName: 'Roles',
  timestamps: true,
});

Role.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifier' });

module.exports = Role;

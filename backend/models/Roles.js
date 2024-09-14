import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

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
      model: 'User',
      key: 'user_id',
    },
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  update_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
}, {
  tableName: 'roles',
  timestamps: false,
});

export default Role;

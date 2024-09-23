import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  second_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  second_last_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rut: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sales_channel_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'SalesChannel',
      key: 'sales_channel_id',
    },
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Company',
      key: 'company_id',
    },
  },
  region_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Region',
      key: 'region_id',
    },
  },
  commune_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Commune',
      key: 'commune_id',
    },
  },
  street: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  number: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  department_office_floor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Role',
      key: 'role_id',
    }
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
  },
  must_change_password: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
  modified_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'User',
      key: 'user_id',
    },
  }
}, {
  tableName: 'users',
  timestamps: false,
});

export default User;

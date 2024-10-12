import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Commune = sequelize.define('Commune', {
  commune_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  commune_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  region_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "Region",
      key: 'region_id',
    },
    onUpdate: 'CASCADE',
  },
  modified_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "User",
      key: 'user_id',
    },
    onUpdate: 'CASCADE',
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  },
}, {
  tableName: 'communes',
  timestamps: false,
});


export default Commune;
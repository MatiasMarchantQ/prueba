import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Region from './Regions.js';
import User from './Users.js';

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
  commune_code: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  region_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Region,
      key: 'region_id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
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
  tableName: 'Communes',
  timestamps: false,
});

Commune.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });
Commune.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifier' });

export default Commune;
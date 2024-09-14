import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const PromotionCommune = sequelize.define('PromotionCommune', {
  id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  promotion_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    references: {
       model: 'Promotion',
       key: 'promotion_id'
    },
  },
  commune_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    references: {
        model: 'Commune',
        key: 'commune_id'
     },
  }
}, {
  tableName: 'promotion_commune',  // Define el nombre de la tabla si es necesario
  timestamps: false,
});

export default PromotionCommune;

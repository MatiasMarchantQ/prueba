import sequelize from '../config/db.js'; 
import User from './Users.js';  // Asegúrate de que el nombre coincide con tu archivo de modelo
import Role from './Roles.js';

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    dialect: 'mysql',
  }
);

User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifiedBy' });

// Exporta los modelos y la conexión
export { User, Role };
export default sequelize;
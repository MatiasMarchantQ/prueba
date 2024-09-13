import sequelize from '../config/db.js'; 
import User from './Users.js';  // Asegúrate de que el nombre coincide con tu archivo de modelo
import Role from './Roles.js';
import Region from './Regions.js';
import Commune from './Communes.js';
import Company from './Companies.js';
import SalesChannel from './SalesChannels.js';
import Audit from './Audit.js';


const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    dialect: 'mysql',
  }
);

User.hasMany(Audit, { foreignKey: 'user_id', as: 'audits' });
Audit.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifiedBy' });
User.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });
User.belongsTo(Commune, { foreignKey: 'commune_id', as: 'commune' });
User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
User.belongsTo(SalesChannel, { foreignKey: 'sales_channel_id', as: 'salesChannel' });

SalesChannel.hasMany(Sales, { foreignKey: 'sales_channel_id', as: 'sales' });
Sales.belongsTo(SalesChannel, { foreignKey: 'sales_channel_id', as: 'salesChannel' });

Region.hasMany(Sales, { foreignKey: 'region_id', as: 'sales' });
Sales.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });

Commune.hasMany(Sales, { foreignKey: 'commune_id', as: 'sales' });
Sales.belongsTo(Commune, { foreignKey: 'commune_id', as: 'commune' });

Promotion.hasMany(Sales, { foreignKey: 'promotion_id', as: 'sales' });
Sales.belongsTo(Promotion, { foreignKey: 'promotion_id', as: 'promotion' });

InstallationAmount.hasMany(Sales, { foreignKey: 'installation_amount_id', as: 'sales' });
Sales.belongsTo(InstallationAmount, { foreignKey: 'installation_amount_id', as: 'installationAmount' });

SaleStatus.hasMany(Sales, { foreignKey: 'sale_status_id', as: 'sales' });
Sales.belongsTo(SaleStatus, { foreignKey: 'sale_status_id', as: 'saleStatus' });

Executive.hasMany(Sales, { foreignKey: 'executive_id', as: 'sales' });
Sales.belongsTo(Executive, { foreignKey: 'executive_id', as: 'executive' });

Validator.hasMany(Sales, { foreignKey: 'validator_id', as: 'sales' });
Sales.belongsTo(Validator, { foreignKey: 'validator_id', as: 'validator' });

Dispatcher.hasMany(Sales, { foreignKey: 'dispatcher_id', as: 'sales' });
Sales.belongsTo(Dispatcher, { foreignKey: 'dispatcher_id', as: 'dispatcher' });

Company.hasMany(Sales, { foreignKey: 'company_id', as: 'sales' });
Sales.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

CompanyPriority.hasMany(Sales, { foreignKey: 'company_priority_id', as: 'sales' });
Sales.belongsTo(CompanyPriority, { foreignKey: 'company_priority_id', as: 'companyPriority' });

export { User, Role, Region, Commune, Company, SalesChannel, Audit };
export default sequelize;
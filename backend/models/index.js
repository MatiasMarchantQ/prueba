import { Sequelize } from 'sequelize';
import config from '../config/config.js'; // Asegúrate de importar correctamente la configuración
import User from './Users.js';
import Role from './Roles.js';
import SalesChannel from './SalesChannels.js';
import Company from './Companies.js';
import Region from './Regions.js';
import Commune from './Communes.js';
import Sales from './Sales.js';
import SaleHistory from './SaleStatusHistories.js';
import CompanyPriority from './CompanyPriorities.js';
import Audit from './Audit.js';
import SaleStatus from './SaleStatuses.js';
import InstallationAmount from './InstallationAmounts.js';
import Promotion from './Promotions.js';
import PromotionCommune from './PromotionsCommunes.js';

// Instancia única de Sequelize
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
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifiedByUser' });

User.belongsTo(SalesChannel, { foreignKey: 'sales_channel_id', as: 'salesChannel' });
User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
User.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });
User.belongsTo(Commune, { foreignKey: 'commune_id', as: 'commune' });

Audit.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

SaleHistory.belongsTo(Sales, { foreignKey: 'sale_id', as: 'sale' });
SaleHistory.belongsTo(SaleStatus, { foreignKey: 'previous_status_id', as: 'previousStatus' });
SaleHistory.belongsTo(SaleStatus, { foreignKey: 'new_status_id', as: 'newStatus' });
SaleHistory.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifiedByUser' });
SaleStatus.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifiedByUser' });
SalesChannel.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifiedByUser' });
Sales.belongsTo(SalesChannel, { foreignKey: 'sales_channel_id', as: 'salesChannel' });
Sales.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });
Sales.belongsTo(Commune, { foreignKey: 'commune_id', as: 'commune' });
Sales.belongsTo(Promotion, { foreignKey: 'promotion_id', as: 'promotion' });
Sales.belongsTo(InstallationAmount, { foreignKey: 'installation_amount_id', as: 'installationAmount' });
Sales.belongsTo(SaleStatus, { foreignKey: 'sale_status_id', as: 'saleStatus' });
Sales.belongsTo(User, { foreignKey: 'executive_id', as: 'executive' });
Sales.belongsTo(User, { foreignKey: 'validator_id', as: 'validator' });
Sales.belongsTo(User, { foreignKey: 'dispatcher_id', as: 'dispatcher' });
Sales.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifiedByUser' });
Sales.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Sales.belongsTo(CompanyPriority, { foreignKey: 'company_priority_id', as: 'companypriority' });

Role.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifiedByUser' });

Region.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifier' });

Commune.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });
Commune.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifier' });

Promotion.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifier' });
Promotion.belongsTo(InstallationAmount, { foreignKey: 'installation_amount_id', as: 'installationAmount' });

InstallationAmount.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifier' });

CompanyPriority.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

PromotionCommune.belongsTo(Promotion, { foreignKey: 'promotion_id' });
PromotionCommune.belongsTo(Commune, { foreignKey: 'commune_id' });


export { User, Role, SalesChannel, Company, Region, Commune, Sales, SaleHistory, CompanyPriority, Audit, SaleStatus, InstallationAmount, Promotion, PromotionCommune };
export default sequelize;

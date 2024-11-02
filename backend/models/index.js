import { Sequelize } from 'sequelize';
import config from '../config/config.js';
import User from './Users.js';
import Role from './Roles.js';
import SalesChannel from './SalesChannels.js';
import Company from './Companies.js';
import Region from './Regions.js';
import Commune from './Communes.js';
import Sales from './Sales.js';
import SaleHistory from './SaleHistories.js';
import SaleStatus from './SaleStatuses.js';
import InstallationAmount from './InstallationAmounts.js';
import Promotion from './Promotions.js';
import PromotionCommune from './PromotionsCommunes.js';
import SaleStatusReason from './SaleStatusReason.js';
import Contract from './Contract.js';

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
User.hasMany(Sales, { foreignKey: 'executive_id' });
SaleHistory.belongsTo(Sales, { foreignKey: 'sale_id', as: 'sale' });
SaleHistory.belongsTo(SaleStatus, { foreignKey: 'previous_status_id', as: 'previousStatus' });
SaleHistory.belongsTo(SaleStatus, { foreignKey: 'new_status_id', as: 'newStatus' });
SaleHistory.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifiedByUser' });
SaleHistory.belongsTo(SaleStatusReason, { foreignKey: 'sale_status_reason_id', as: 'reason' });
SaleHistory.belongsTo(User, { as: 'priorityModifiedByUser', foreignKey: 'priority_modified_by_user_id' });

SaleStatus.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifiedByUser' });
SalesChannel.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifiedByUser' });
Sales.belongsTo(SalesChannel, { foreignKey: 'sales_channel_id', as: 'salesChannel' });
Sales.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });
Sales.belongsTo(Commune, { foreignKey: 'commune_id', as: 'commune' });
Sales.belongsTo(Promotion, { foreignKey: 'promotion_id', as: 'promotion' });
Sales.belongsTo(InstallationAmount, { foreignKey: 'installation_amount_id', as: 'installationAmount' });
Sales.belongsTo(User, { foreignKey: 'executive_id', as: 'executive' });
Sales.belongsTo(User, { foreignKey: 'validator_id', as: 'validator' });
Sales.belongsTo(User, { foreignKey: 'dispatcher_id', as: 'dispatcher' });
Sales.belongsTo(User, { foreignKey: 'superadmin_id', as: 'superadmin' });
Sales.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });


Sales.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifiedByUser' });
Sales.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });


Sales.belongsTo(SaleStatus, { foreignKey: 'sale_status_id', as: 'saleStatus' });
SaleStatusReason.hasMany(Sales, { foreignKey: 'sale_status_id', as: 'sale' });
Sales.hasMany(SaleHistory, { as: 'saleStatuses', foreignKey: 'sale_id' });

SaleStatusReason.belongsTo(SaleStatus, { foreignKey: 'sale_status_id', as: 'saleStatusParent' });
Sales.belongsTo(SaleStatusReason, { foreignKey: 'sale_status_reason_id', as: 'reason' });
SaleStatus.hasMany(SaleStatusReason, { foreignKey: 'sale_status_id', as: 'saleStatusReasons' });
Role.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifiedByUser' });

Region.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifier' });

Commune.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifierCommune' });
Region.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifierRegion' });

Region.hasMany(Commune, { foreignKey: 'region_id', as: 'communes' });

Commune.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });
Commune.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifierUser' });
Promotion.hasMany(Sales, {foreignKey: 'promotion_id', as: 'sales'});
Promotion.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifierPromotion' });
InstallationAmount.belongsTo(Promotion, {
  foreignKey: 'installation_amount_id',
  onDelete: 'CASCADE',
});
Promotion.hasMany(InstallationAmount, {
  foreignKey: 'installation_amount_id',
});
InstallationAmount.belongsTo(User, { foreignKey: 'modified_by_user_id', as: 'modifier' });
PromotionCommune.belongsTo(Promotion, { foreignKey: 'promotion_id' });
PromotionCommune.belongsTo(Commune, { foreignKey: 'commune_id' });

Promotion.hasMany(PromotionCommune, {
  foreignKey: 'promotion_id',
  onDelete: 'CASCADE',
});

PromotionCommune.belongsTo(Promotion, {
  foreignKey: 'promotion_id',
  onDelete: 'CASCADE',
});

Commune.hasMany(PromotionCommune, { foreignKey: 'commune_id', as: 'promotionCommunes' });
PromotionCommune.belongsTo(Commune, { foreignKey: 'commune_id', as: 'commune' });

User.belongsTo(Contract, {
  foreignKey: 'contract_id',
  as: 'contract'
});

Contract.hasMany(User, {
  foreignKey: 'contract_id'
});

export { User, Role, SalesChannel, Company, Region, Commune, Sales, SaleHistory, SaleStatus, InstallationAmount, Promotion, PromotionCommune, SaleStatusReason, Contract };
export default sequelize;

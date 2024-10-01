import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import SaleHistory from './SaleHistories.js';

const Sales = sequelize.define('Sales', {
  sale_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  service_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  sales_channel_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    references: {
      model: 'SalesChannel',
      key: 'sales_channel_id',
    }
  },
  client_first_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  client_last_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  client_rut: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
  },
  client_email: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: true,
  },
  client_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  client_secondary_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  region_id: {
    type: DataTypes.INTEGER(11),
    references: {
      model: 'Region',
      key: 'region_id',
    },
  },
  commune_id: {
    type: DataTypes.INTEGER(11),
    references: {
      model: 'Commune',
      key: 'commune_id',
    },
  },
  street: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  number: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  department_office_floor: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  geo_reference: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  promotion_id: {
    type: DataTypes.INTEGER(11),
    references: {
      model: 'Promotion',
      key: 'promotion_id',
    },
  },
  installation_amount_id: {
    type: DataTypes.INTEGER(11),
    references: {
      model: 'InstallationAmount',
      key: 'installation_amount_id',
    }
  },
  additional_comments: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  id_card_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  simple_power_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  house_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  other_images: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  is_priority: {
    type: DataTypes.INTEGER(1),
    allowNull: false,
    defaultValue: 0,
  },
  priority_modified_by_user_id: {
    type: DataTypes.INTEGER(11),
    allowNull: true,
    references: {
      model: 'User',
      key: 'user_id',
    },
  },
  sale_status_id: {
    type: DataTypes.INTEGER(11),
    references: {
      model: 'SaleStatus',
      key: 'sale_status_id',
    },
  },
  sale_status_reason_id: {
    type: DataTypes.INTEGER(11),
    allowNull: true,
    references: {
      model: 'SaleStatusReason',
      key: 'sale_status_reason_id',
    },
  },
  superadmin_id: {
    type: DataTypes.INTEGER(11),
    references: {
      model: 'User',
      key: 'user_id',
    },
  },
  admin_id: {
    type: DataTypes.INTEGER(11),
    references: {
      model: 'User',
      key: 'user_id',
    },
  },
  executive_id: {
    type: DataTypes.INTEGER(11),
    references: {
      model: 'User',
      key: 'user_id',
    },
  },
  validator_id: {
    type: DataTypes.INTEGER(11),
    references: {
      model: 'User',
      key: 'user_id',
    },
  },
  dispatcher_id: {
    type: DataTypes.INTEGER(11),
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
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
  modified_by_user_id: {
    type: DataTypes.INTEGER(11),
    allowNull: true,
    references: {
      model: 'User',
      key: 'user_id',
    },
  },
  company_id: {
    type: DataTypes.INTEGER(11),
    references: {
      model: 'Company',
      key: 'company_id',
    },
  },
  company_priority_id: {
    type: DataTypes.INTEGER(11),
    references: {
      model: 'CompanyPriority',
      key: 'company_priority_id',
    },
  },
}, {
  hooks: {
    afterCreate: async (sale, options) => {
      await SaleHistory.create({
        sale_id: sale.sale_id,
        new_status_id: sale.sale_status_id,
        sale_status_reason_id: sale.sale_status_reason_id,
        modified_by_user_id: sale.modified_by_user_id,
        modification_date: new Date(),
      });
  
      // Verifica si el estado es 'Ingresado' (sale_status_id = 1)
      if (sale.sale_status_id === 1) {
        await SaleHistory.create({
          sale_id: sale.sale_id,
          date_type: 'Ingresado',
          date: new Date(),
        });
      }
    },
  
    afterUpdate: async (sale, options) => {
      const lastHistory = await SaleHistory.findOne({
        where: { sale_id: sale.sale_id },
        order: [['modification_date', 'DESC']],
      });
  
      // Check if is_priority was updated
      const priorityChanged = sale.changed('is_priority');
      const statusChanged = sale.changed('sale_status_id');
  
      if (priorityChanged && !statusChanged) {
        // Case 1: Priority changed, but sale status didn't
        await SaleHistory.create({
          sale_id: sale.sale_id,
          previous_status_id: lastHistory ? lastHistory.new_status_id : null,
          new_status_id: sale.sale_status_id, // replicate current status
          sale_status_reason_id: sale.sale_status_reason_id,
          modified_by_user_id: sale.modified_by_user_id,
          modification_date: new Date(),
          priority_modified_by_user_id: sale.priority_modified_by_user_id,
        });
      }
  
      if (statusChanged && priorityChanged) {
        // Case 2: Both sale_status_id and is_priority updated
        await SaleHistory.create({
          sale_id: sale.sale_id,
          previous_status_id: lastHistory ? lastHistory.new_status_id : null,
          new_status_id: sale.sale_status_id,
          sale_status_reason_id: sale.sale_status_reason_id,
          modified_by_user_id: sale.modified_by_user_id,
          modification_date: new Date(),
          priority_modified_by_user_id: sale.priority_modified_by_user_id, // Capture priority change as well
        });
      }
  
      if (statusChanged && !priorityChanged) {
        // Case 3: Only sale_status_id updated
        await SaleHistory.create({
          sale_id: sale.sale_id,
          previous_status_id: lastHistory ? lastHistory.new_status_id : null,
          new_status_id: sale.sale_status_id,
          sale_status_reason_id: sale.sale_status_reason_id,
          modified_by_user_id: sale.modified_by_user_id,
          modification_date: new Date(),
        });
      }
  
      // (Validado, Anulado)
      if (sale.sale_status_id === 2) {
        await SaleHistory.create({
          sale_id: sale.sale_id,
          date_type: 'Validado',
          date: new Date(),
        });

      } else if (sale.sale_status_id === 6) {
        await SaleHistory.create({
          sale_id: sale.sale_id,
          date_type: 'Activo',
          date: new Date(),
        });
      
      } else if (sale.sale_status_id === 7) {
        await SaleHistory.create({
          sale_id: sale.sale_id,
          date_type: 'Anulado',
          date: new Date(),
        });
      }
      // Register priority change event if applicable
      if (sale.is_priority === 1) {
        await SaleHistory.create({
          sale_id: sale.sale_id,
          date_type: 'Prioridad',
          date: new Date(),
          priority_modified_by_user_id: sale.priority_modified_by_user_id,
        });
      }
    },
  },
  tableName: 'sales',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_service_id',
      fields: ['service_id'],
    },
    {
      name: 'idx_client_rut',
      fields: ['client_rut'],
    },
    {
      name: 'idx_client_first_name',
      fields: ['client_first_name'],
    },
    {
      name: 'idx_client_last_name',
      fields: ['client_last_name'],
    },
    {
      name: 'idx_client_phone',
      fields: ['client_phone'],
    },
    {
      name: 'idx_client_email',
      fields: ['client_email'],
    },
    {
      name: 'idx_street',
      fields: ['street'],
    },
  ],
});

export default Sales;
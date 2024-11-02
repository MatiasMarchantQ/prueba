import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import SaleHistory from './SaleHistories.js';
import { now } from 'sequelize/lib/utils';


// Definir la función getLocalDateTime
const getLocalDateTime = () => {
  const now = new Date();
  return now.toLocaleString('sv-SE'); // Formato 'YYYY-MM-DD HH:mm:ss'
};

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
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: () => getLocalDateTime()
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
}, {
  hooks: {
    afterCreate: async (sale, options) => {
      await SaleHistory.create({
        sale_id: sale.sale_id,
        new_status_id: sale.sale_status_id,
        sale_status_reason_id: sale.sale_status_reason_id,
        modified_by_user_id: sale.modified_by_user_id,
        modification_date: sale.created_at,
        date_type: sale.sale_status_id === 1 ? 'Ingresado' : null,
        date: sale.created_at.split(' ')[0], 
        additional_comments: sale.additional_comments || null
      });
    }
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
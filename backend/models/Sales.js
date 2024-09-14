import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

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
  entry_date: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
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
    type: DataTypes.STRING(20)
  },
  client_secondary_phone: {
    type: DataTypes.STRING(20)
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
    type: DataTypes.STRING(255)
  },
  number: {
    type: DataTypes.STRING(10)
  },
  department_office_floor: {
    type: DataTypes.STRING(50)
  },
  geo_reference: {
    type: DataTypes.STRING(255)
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
    type: DataTypes.TEXT
  },
  id_card_image: {
    type: DataTypes.STRING(255)
  },
  simple_power_image: {
    type: DataTypes.STRING(255)
  },
  house_image: {
    type: DataTypes.STRING(255)
  },
  sale_status_id: {
    type: DataTypes.INTEGER(11),
    references: {
      model: 'SaleStatus',
      key: 'sale_status_id',
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
  tableName: 'sales',
  timestamps: false,
});

export default Sales;
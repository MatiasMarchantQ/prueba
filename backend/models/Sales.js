import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Sales = sequelize.define('Sales', {
  sale_id: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true
  },
  service_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      notEmpty: {
        msg: 'Service ID is required'
      }
    }
  },
  entry_date: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
  sales_channel_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Sales channel ID is required'
      }
    }
  },
  client_first_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Client first name is required'
      }
    }
  },
  client_last_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Client last name is required'
      }
    }
  },
  client_rut: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Client RUT is required'
      }
    }
  },
  client_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      notEmpty: {
        msg: 'Client email is required'
      }
    }
  },
  client_phone: {
    type: DataTypes.STRING(20)
  },
  client_secondary_phone: {
    type: DataTypes.STRING(20)
  },
  region_id: {
    type: DataTypes.INTEGER(11)
  },
  commune_id: {
    type: DataTypes.INTEGER(11)
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
    type: DataTypes.INTEGER(11)
  },
  installation_amount_id: {
    type: DataTypes.INTEGER(11)
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
    type: DataTypes.INTEGER(11)
  },
  executive_id: {
    type: DataTypes.INTEGER(11)
  },
  validator_id: {
    type: DataTypes.INTEGER(11)
  },
  dispatcher_id: {
    type: DataTypes.INTEGER(11)
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
  modified_by_user_id: {
    type: DataTypes.INTEGER(11),
    allowNull: true,
  },
  company_id: {
    type: DataTypes.INTEGER(11)
  },
  company_priority_id: {
    type: DataTypes.INTEGER(11)
  },
}, {
  tableName: 'Sales',
  timestamps: true,
});

export default Sales;
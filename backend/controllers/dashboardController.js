import Sales from '../models/Sales.js';
import SaleHistory from '../models/SaleHistories.js';
import Region from '../models/Regions.js';
import Commune from '../models/Communes.js';
import User from '../models/Users.js';
import Role from '../models/Roles.js';
import SalesChannel from '../models/SalesChannels.js';
import InstallationAmount from '../models/InstallationAmounts.js';
import Promotion from '../models/Promotions.js';
import PromotionCommune from '../models/PromotionsCommunes.js';
import Company from '../models/Companies.js';
import CompanyPriority from '../models/CompanyPriorities.js';
import SaleStatus from '../models/SaleStatuses.js';
import SaleStatusReason from '../models/SaleStatusReason.js';
import path from 'path';
import fs from 'fs';
import { fetchRegionById } from '../services/dataServices.js';
import { Op, Sequelize } from 'sequelize';

const getDashboardStats = async (req, res) => {
  try {
    const sales = await Sales.findAll({
      include: [
        {
          model: Region,
          as: 'region',
          attributes: ['region_name']
        },
        {
          model: Commune,
          as: 'commune',
          attributes: ['commune_name']
        },
        {
          model: SalesChannel,
          as: 'salesChannel',
          attributes: ['channel_name']
        },
        {
          model: SaleStatus,
          as: 'saleStatus',
          attributes: ['status_name']
        },
        {
          model: SaleStatusReason,
          as: 'reason',
          attributes: ['reason_name']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['company_name']
        }
      ]
    });

    const statistics = {};

    // Total de ventas
    statistics.totalSales = sales.length;

    // Ventas por región
    const ventasPorRegion = {};
    sales.forEach((venta) => {
      const region = venta.region.region_name;
      if (!ventasPorRegion[region]) {
        ventasPorRegion[region] = 0;
      }
      ventasPorRegion[region]++;
    });
    statistics.ventasPorRegion = ventasPorRegion;

    // Ventas por comuna
    const ventasPorComuna = {};
    sales.forEach((venta) => {
      const comuna = venta.commune.commune_name;
      if (!ventasPorComuna[comuna]) {
        ventasPorComuna[comuna] = 0;
      }
      ventasPorComuna[comuna]++;
    });
    statistics.ventasPorComuna = ventasPorComuna;

    // Ventas por canal de ventas
    const ventasPorCanal = {};
    sales.forEach((venta) => {
      const canal = venta.salesChannel.channel_name;
      if (!ventasPorCanal[canal]) {
        ventasPorCanal[canal] = 0;
      }
      ventasPorCanal[canal]++;
    });
    statistics.ventasPorCanal = ventasPorCanal;

    // Ventas por estado
    const ventasPorEstado = {};
    sales.forEach((venta) => {
      const estado = venta.saleStatus.status_name;
      if (!ventasPorEstado[estado]) {
        ventasPorEstado[estado] = 0;
      }
      ventasPorEstado[estado]++;
    });
    statistics.ventasPorEstado = ventasPorEstado;

    // Ventas por razón
    const ventasPorRazon = {};
    sales.forEach((venta) => {
      const razon = venta.reason?.reason_name;
      if (razon !== undefined && razon !== null) {
        if (!ventasPorRazon[razon]) {
          ventasPorRazon[razon] = 0;
        }
        ventasPorRazon[razon]++;
      }
    });
    statistics.ventasPorRazon = ventasPorRazon;

    // Ventas por empresa
    const ventasPorEmpresa = {};
    sales.forEach((venta) => {
      const empresa = venta.company.company_name;
      if (!ventasPorEmpresa[empresa]) {
        ventasPorEmpresa[empresa] = 0;
      }
      ventasPorEmpresa[empresa]++;
    });
    statistics.ventasPorEmpresa = ventasPorEmpresa;

    res.json(statistics);

  } catch (error) {
    console.error('Error obteniendo estadisticas', error);
    res.status(500).json({ message: 'Error obteniendo estadisticas', error: error.message });
  };
};

export default getDashboardStats;
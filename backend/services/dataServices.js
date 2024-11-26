// services/dataService.js
import { 
  User, 
  Role, 
  SalesChannel, 
  Company, 
  Region, 
  Commune, 
  Sales, 
  SaleHistory, 
  SaleStatus, 
  InstallationAmount, 
  Promotion 
} from '../models/index.js';

export const fetchRegionById = async (id) => {
  try {
    return await Region.findByPk(id);
  } catch (error) {
    console.error('Error fetching region by id:', error);
    throw new Error('Error fetching region by id');
  }
}

export const fetchPromotionCommunes = async () => {
  try {
    return await PromotionCommune.findAll({
      include: [
        {
          model: Promotion,
          as: 'promotion',
        },
        {
          model: Commune,
          as: 'commune',
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching promotion communes:', error);
    throw new Error('Error fetching promotion communes');
  }
};

export const fetchUsersWithRoles = async () => {
  try {
    return await User.findAll({
      include: [{
        model: Role,
        as: 'role',
      }],
    });
  } catch (error) {
    console.error('Error fetching users with roles:', error);
    throw new Error('Error fetching users');
  }
};

export const fetchSalesChannels = async () => {
  try {
    return await SalesChannel.findAll();
  } catch (error) {
    console.error('Error fetching sales channels:', error);
    throw new Error('Error fetching sales channels');
  }
};

export const fetchCompanies = async () => {
  try {
    return await Company.findAll();
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw new Error('Error fetching companies');
  }
};

export const fetchRegions = async () => {
  try {
    return await Region.findAll();
  } catch (error) {
    console.error('Error fetching regions:', error);
    throw new Error('Error fetching regions');
  }
};

export const fetchCommunes = async () => {
  try {
    return await Commune.findAll();
  } catch (error) {
    console.error('Error fetching communes:', error);
    throw new Error('Error fetching communes');
  }
};

export const fetchSales = async () => {
  try {
    return await Sales.findAll();
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw new Error('Error fetching sales');
  }
};

export const fetchSaleHistories = async () => {
  try {
    return await SaleHistory.findAll();
  } catch (error) {
    console.error('Error fetching sale histories:', error);
    throw new Error('Error fetching sale histories');
  }
};

export const fetchSaleStatuses = async () => {
  try {
    return await SaleStatus.findAll();
  } catch (error) {
    console.error('Error fetching sale statuses:', error);
    throw new Error('Error fetching sale statuses');
  }
};

export const fetchInstallationAmounts = async () => {
  try {
    return await InstallationAmount.findAll();
  } catch (error) {
    console.error('Error fetching installation amounts:', error);
    throw new Error('Error fetching installation amounts');
  }
};

export const fetchPromotions = async () => {
  try {
    return await Promotion.findAll();
  } catch (error) {
    console.error('Error fetching promotions:', error);
    throw new Error('Error fetching promotions');
  }
};

export const fetchSalesWithUsers = async () => {
  try {
    return await Sales.findAll({
      include: [
        {
          model: User,
          as: 'executive',
        },
        {
          model: User,
          as: 'validator',
        },
        {
          model: User,
          as: 'dispatcher',
        },
        {
          model: User,
          as: 'modifiedByUser',
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching sales with users:', error);
    throw new Error('Error fetching sales');
  }
};

export const fetchPromotionsWithUsers = async () => {
  try {
    return await Promotion.findAll({
      include: [
        {
          model: User,
          as: 'modifiedByUser',
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching promotions with users:', error);
    throw new Error('Error fetching promotions');
  }
};

export const fetchPromotionsWithInstallationAmounts = async () => {
  try {
    return await Promotion.findAll({
      include: [
        {
          model: InstallationAmount,
          as: 'installationAmount',
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching promotions with installation amounts:', error);
    throw new Error('Error fetching promotions');
  }
};

export const fetchAllData = async () => {
  try {
    const usersWithRoles = await fetchUsersWithRoles();
    const salesChannels = await fetchSalesChannels();
    const companies = await fetchCompanies();
    const regions = await fetchRegions();
    const communes = await fetchCommunes();
    const sales = await fetchSales();
    const saleHistories = await fetchSaleHistories();
    const priorities = await fetchPriorities();
    const saleStatuses = await fetchSaleStatuses();
    const installationAmounts = await fetchInstallationAmounts();
    const promotions = await fetchPromotions();
    return { 
      usersWithRoles, 
      salesChannels, 
      companies, 
      regions, 
      communes, 
      sales, 
      saleHistories, 
      priorities,
      saleStatuses, 
      installationAmounts, 
      promotions 
    };
  } catch (error) {
    console.error('Error fetching all data:', error);
    throw new Error('Error fetching all data');
  }
};

export default {
  fetchRegionById,
};
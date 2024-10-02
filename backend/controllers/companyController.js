// controllers/companyController.js
import  Company  from '../models/Companies.js';

export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll();
    res.status(200).json(companies);
  } catch (error) {
    console.error('Error al obtener las empresas:', error);
    res.status(500).json({ message: 'Error al obtener las empresas', error: error.message });
  }
};

export const createCompany = async (req, res) => {
  try {
    const companyName = req.body.companyName;

    if (!companyName) {
      return res.status(400).json({ message: 'El nombre de la empresa es requerido' });
    }

    const company = await Company.create({ company_name: companyName });
    res.status(201).json({ message: 'Empresa creada con éxito', company });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear la empresa', error: error.message });
  }
};

export const updateCompanyName = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const companyName = req.body.companyName;

    if (!companyId || !companyName) {
      return res.status(400).json({ message: 'Ambos el ID de la empresa y el nombre de la empresa son requeridos' });
    }

    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    await company.update({ company_name: companyName });
    res.status(200).json({ message: 'Nombre de la empresa actualizado con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el nombre de la empresa', error: error.message });
  }
};

export const toggleCompanyStatus = async (req, res) => {
  try {
    const companyId = req.params.companyId;

    if (!companyId) {
      return res.status(400).json({ message: 'El ID de la empresa es requerido' });
    }

    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    const newStatus = company.is_active ? 0 : 1;
    await company.update({ is_active: newStatus });

    res.status(200).json({ message: `Empresa ${newStatus === 1 ? 'habilitada' : 'deshabilitada'} con éxito` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al cambiar el estado de la empresa', error: error.message });
  }
};

export const swapPriorityLevels = async (req, res) => {
  try {
    const companyId1 = req.body.companyId1;
    const companyId2 = req.body.companyId2;

    if (!companyId1 || !companyId2) {
      return res.status(400).json({ message: 'Ambos IDs de las empresas son requeridos' });
    }

    const company1 = await Company.findByPk(companyId1);
    const company2 = await Company.findByPk(companyId2);

    if (!company1 || !company2) {
      return res.status(404).json({ message: 'Una o ambas empresas no encontradas' });
    }

    const priorityLevel1 = company1.priority_level;
    const priorityLevel2 = company2.priority_level;

    // Actualizar el nivel de prioridad de la empresa 2 con un valor temporal
    await company2.update({ priority_level: null });

    // Actualizar el nivel de prioridad de la empresa 1 con el valor de la empresa 2
    await company1.update({ priority_level: priorityLevel2 });

    // Actualizar el nivel de prioridad de la empresa 2 con el valor de la empresa 1
    await company2.update({ priority_level: priorityLevel1 });

    res.status(200).json({ message: 'Niveles de prioridad intercambiados con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al intercambiar los niveles de prioridad', error: error.message });
  }
};

export default {
    getCompanies,
  };
import Contract from '../models/Contract.js';

export const getAllContracts = async (req, res) => {
    try {
      const contracts = await Contract.findAll({
        attributes: ['contract_id', 'contract_name'],
        where: {
          status: 1
        }
      });
      
      res.status(200).json(contracts);
    } catch (error) {
      console.error('Error al obtener contratos:', error);
      res.status(500).json({ message: 'Error al obtener los contratos' });
    }
  };
  
  export default {
    getAllContracts,
  };
import  Region  from '../models/Regions.js';

export const getRegions = async (req, res) => {
  try {
    const regions = await Region.findAll();
    res.status(200).json(regions);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener regiones', error: error.message });
  }
};

export default {
    getRegions,
  };
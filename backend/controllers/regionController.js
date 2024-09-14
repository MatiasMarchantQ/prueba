// controllers/regionController.js
import  Region  from '../models/Regions.js';

export const getRegions = async (req, res) => {
  try {
    const regions = await Region.findAll();
    res.status(200).json(regions);
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ message: 'Error fetching regions', error: error.message });
  }
};

export default {
    getRegions,
  };
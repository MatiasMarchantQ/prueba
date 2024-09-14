// controllers/communeController.js
import  Commune  from '../models/Communes.js';

export const getCommunesByRegion = async (req, res) => {
  const { regionId } = req.params;

  try {
    const communes = await Commune.findAll({
      where: {
        region_id: regionId
      }
    });
    
    if (!communes.length) {
      return res.status(404).json({ message: 'No communes found for the selected region' });
    }
    
    res.status(200).json(communes);
  } catch (error) {
    console.error('Error fetching communes:', error);
    res.status(500).json({ message: 'Error fetching communes', error: error.message });
  }
};


export default {
    getCommunesByRegion,
  };

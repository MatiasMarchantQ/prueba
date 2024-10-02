// controllers/communeController.js
import  Commune  from '../models/Communes.js';
import  Region  from '../models/Regions.js';
import { Op } from 'sequelize';

export const getCommunesByRegion = async (req, res) => {
  const { regionId } = req.params;

  try {
    const communes = await Commune.findAll({
      where: {
        region_id: regionId,
        is_active: 1 // Solo obtener comunas con is_active === 1
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

export const addCommuneToRegion = async (req, res) => {
  const { regionId } = req.params;
  const { commune_name } = req.body;

  if (!commune_name) {
    return res.status(400).json({ message: 'Commune name is required' });
  }

  try {
    const region = await Region.findByPk(regionId);
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    // Verificar si ya existe una comuna asociada a la región seleccionada
    const existingCommune = await Commune.findOne({ where: { region_id: regionId, commune_name } });
    if (existingCommune) {
      return res.status(400).json({ message: 'Commune already exists for this region' });
    }

    const commune = await Commune.create({ commune_name, region_id: regionId });
    res.status(201).json({ message: 'Commune added successfully', commune });
  } catch (error) {
    console.error('Error adding commune to region:', error);
    res.status(500).json({ message: 'Error adding commune to region', error: error.message });
  }
};

export const updateCommune = async (req, res) => {
  const { communeId } = req.params;
  const { commune_name } = req.body;

  try {
    const commune = await Commune.findByPk(communeId);
    if (!commune) {
      return res.status(404).json({ message: 'Commune not found' });
    }

    await commune.update({ commune_name });

    res.status(200).json({ message: 'Commune updated successfully' });
  } catch (error) {
    console.error('Error updating commune:', error);
    res.status(500).json({ message: 'Error updating commune', error: error.message });
  }
};

export const toggleCommuneStatus = async (req, res) => {
  const { communeId } = req.params;
  const { isActive } = req.body;

  try {
    const commune = await Commune.findByPk(communeId);
    if (!commune) {
      return res.status(404).json({ message: 'Commune not found' });
    }

    await commune.update({ is_active: isActive });
    res.status(200).json({ message: `Commune ${isActive ? 'enabled' : 'disabled'} successfully` });
  } catch (error) {
    console.error('Error toggling commune status:', error);
    res.status(500).json({ message: 'Error toggling commune status', error: error.message });
  }
};
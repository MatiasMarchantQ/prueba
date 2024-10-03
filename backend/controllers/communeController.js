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
      return res.status(404).json({ message: 'No se encontraron comunas para la región seleccionada' });
    }
    
    res.status(200).json(communes);
  } catch (error) {
    console.error('Error al obtener las comunas:', error);
    res.status(500).json({ message: 'Error al obtener las comunas', error: error.message });
  }
};

export const getAllCommunesByRegion = async (req, res) => {
  const { regionId } = req.params;

  try {
    const communes = await Commune.findAll({
      where: {
        region_id: regionId
      }
    });
    
    if (!communes.length) {
      return res.status(404).json({ message: 'No se encontraron comunas para la región seleccionada' });
    }
    
    res.status(200).json(communes);
  } catch (error) {
    console.error('Error al obtener las comunas:', error);
    res.status(500).json({ message: 'Error al obtener las comunas', error: error.message });
  }
};

export const addCommuneToRegion = async (req, res) => {
  const { regionId } = req.params;
  const { commune_name } = req.body;

  if (!commune_name) {
    return res.status(400).json({ message: 'El nombre de la comuna es requerido' });
  }

  try {
    const region = await Region.findByPk(regionId);
    if (!region) {
      return res.status(404).json({ message: 'Región no encontrada' });
    }

    // Verificar si ya existe una comuna asociada a la región seleccionada
    const existingCommune = await Commune.findOne({ where: { region_id: regionId, commune_name } });
    if (existingCommune) {
      return res.status(400).json({ message: 'La comuna ya existe para esta región' });
    }

    const commune = await Commune.create({ commune_name, region_id: regionId });
    res.status(201).json({ message: 'Comuna agregada con éxito', commune });
  } catch (error) {
    console.error('Error al agregar la comuna a la región:', error);
    res.status(500).json({ message: 'Error al agregar la comuna a la región', error: error.message });
  }
};

export const updateCommune = async (req, res) => {
  const { communeId } = req.params;
  const { commune_name } = req.body;

  try {
    const commune = await Commune.findByPk(communeId);
    if (!commune) {
      return res.status(404).json({ message: 'Comuna no encontrada' });
    }

    await commune.update({ commune_name });

    res.status(200).json({ message: 'Comuna actualizada con éxito' });
  } catch (error) {
    console.error('Error al actualizar la comuna:', error);
    res.status(500).json({ message: 'Error al actualizar la comuna', error: error.message });
  }
};

export const toggleCommuneStatus = async (req, res) => {
  const { communeId } = req.params;
  const { isActive } = req.body;

  try {
    const commune = await Commune.findByPk(communeId);
    if (!commune) {
      return res.status(404).json({ message: 'Comuna no encontrada' });
    }

    await commune.update({ is_active: isActive });
    if (isActive === "1") {
      res.status(200).json({ message: 'Comuna habilitada con éxito' });
    } else {
      res.status(200).json({ message: 'Comuna deshabilitada con éxito' });
    }
   } catch (error) {
    console.error('Error al cambiar el estado de la comuna:', error);
    res.status(500).json({ message: 'Error al cambiar el estado de la comuna', error: error.message });
  }
};
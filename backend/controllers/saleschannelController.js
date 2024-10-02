import SalesChannel from '../models/SalesChannels.js';

export const getSalesChannels = async (req, res) => {
  try {
    const salesChannels = await SalesChannel.findAll();
    res.status(200).json(salesChannels);
  } catch (error) {
    console.error('Error al obtener los canales de venta:', error);
    res.status(500).json({ message: 'Error al obtener los canales de venta', error: error.message });
  }
};

export const createSalesChannel = async (req, res) => {
  try {
    const salesChannelName = req.body.salesChannelName;

    if (!salesChannelName) {
      return res.status(400).json({ message: 'El nombre del canal de venta es requerido' });
    }

    const salesChannel = await SalesChannel.create({ sales_channel_name: salesChannelName });
    res.status(201).json({ message: 'Canal de venta creado con éxito', salesChannel });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el canal de venta', error: error.message });
  }
};

export const updateSalesChannel = async (req, res) => {
  try {
    const salesChannelId = req.params.salesChannelId;
    const salesChannelName = req.body.salesChannelName;

    if (!salesChannelId || !salesChannelName) {
      return res.status(400).json({ message: 'Ambos el ID del canal de venta y el nombre del canal de venta son requeridos' });
    }

    const salesChannel = await SalesChannel.findByPk(salesChannelId);
    if (!salesChannel) {
      return res.status(404).json({ message: 'Canal de venta no encontrado' });
    }

    await salesChannel.update({ sales_channel_name: salesChannelName });
    res.status(200).json({ message: 'Nombre del canal de venta actualizado con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el nombre del canal de venta' });
  }
};

export const toggleSalesChannelStatus = async (req, res) => {
  try {
    const salesChannelId = req.params.salesChannelId;

    if (!salesChannelId) {
      return res.status(400).json({ message: 'El ID del canal de venta es requerido' });
    }

    const salesChannel = await SalesChannel.findByPk(salesChannelId);
    if (!salesChannel) {
      return res.status(404).json({ message: 'Canal de venta no encontrado' });
    }

    const newStatus = salesChannel.is_active ? 0 : 1;
    await salesChannel.update({ is_active: newStatus });

    res.status(200).json({ message: `Canal de venta ${newStatus === 1 ? 'habilitado' : 'deshabilitado'} con éxito` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al cambiar el estado del canal de venta', error: error.message });
  }
};

export default {
  getSalesChannels,
  createSalesChannel,
  updateSalesChannel,
  toggleSalesChannelStatus,
};
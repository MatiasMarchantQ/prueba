import SalesChannel from '../models/SalesChannels.js';

export const getSalesChannels = async (req, res) => {
  try {
    const salesChannels = await SalesChannel.findAll();
    res.status(200).json(salesChannels);
  } catch (error) {
    console.error('Error fetching sales channels:', error);
    res.status(500).json({ message: 'Error fetching sales channels', error: error.message });
  }
};

export default {
  getSalesChannels,
};
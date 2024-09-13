import Sales from '../models/Sales.js';

export const createSale = async (req, res) => {
  try {
    const {
      service_id,
      entry_date,
      sales_channel_id,
      client_first_name,
      client_last_name,
      client_rut,
      client_email,
      client_phone,
      client_secondary_phone,
      region_id,
      commune_id,
      street,
      number,
      department_office_floor,
      geo_reference,
      promotion_id,
      installation_amount_id,
      additional_comments,
      id_card_image,
      simple_power_image,
      house_image,
      sale_status_id,
      executive_id,
      validator_id,
      dispatcher_id,
      company_id,
      company_priority_id,
    } = req.body;

    const formattedEntryDate = moment(entry_date).format('DD-MM-YYYY HH:mm:ss');
    const cleanClientFirstName = client_first_name.replace(/[^a-zA-Z ]/g, '');
    const cleanClientLastName = client_last_name.replace(/[^a-zA-Z ]/g, '');
    const cleanClientRut = client_rut.replace(/[^0-9-]/g, '');
    const cleanStreet = street.replace(/[^a-zA-Z0-9 #\/]/g, '');
    const cleanNumber = number.replace(/[^0-9]/g, '');

    const saleData = {
      service_id,
      entry_date: formattedEntryDate,
      sales_channel_id,
      client_first_name: cleanClientFirstName,
      client_last_name: cleanClientLastName,
      client_rut: cleanClientRut,
      client_email,
      client_phone,
      client_secondary_phone,
      region_id,
      commune_id,
      street: cleanStreet,
      number: cleanNumber,
      department_office_floor,
      geo_reference,
      promotion_id,
      installation_amount_id,
      additional_comments,
      id_card_image,
      simple_power_image,
      house_image,
      sale_status_id,
      executive_id,
      validator_id,
      dispatcher_id,
      company_id,
      company_priority_id,
    };

    const sale = await Sales.create(saleData);
    res.status(201).json(sale);
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ message: 'Error creating sale', error: error.message });
  }
};

export const getSales = async (req, res) => {
  try {
    const sales = await Sales.findAll();
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching sales' });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const id = req.params.id;
    const sale = await Sales.findByPk(id);
    if (!sale) {
      res.status(404).json({ message: 'Sale not found' });
    } else {
      res.json(sale);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching sale' });
  }
};

export const updateSale = async (req, res) => {
  try {
    const id = req.params.id;
    const sale = await Sales.findByPk(id);
    if (!sale) {
      res.status(404).json({ message: 'Sale not found' });
    } else {
      await sale.update(req.body);
      res.json(sale);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating sale' });
  }
};

export const deleteSale = async (req, res) => {
  try {
    const id = req.params.id;
    const sale = await Sales.findByPk(id);
    if (!sale) {
      res.status(404).json({ message: 'Sale not found' });
    } else {
      await sale.destroy();
      res.json({ message: 'Sale deleted successfully' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting sale' });
  }
};

export default {
  createSale,
  getSales,
  getSaleById,
  updateSale, 
  deleteSale,
};
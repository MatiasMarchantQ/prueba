const { Sales } = require('../models/Sales');

class SalesController {
  async createSale(req, res) {
    try {
      const sale = await Sales.create(req.body);
      res.status(201).json(sale);
    } catch (error) {
      console.error('Error details:', error); // Esto mostrará el error completo en la consola
      res.status(500).json({ 
        message: 'Error creating sale', 
        error: error.message // Enviar mensaje de error específico al cliente
      });
    }
  }
  

  async getSales(req, res) {
    try {
      const sales = await Sales.findAll();
      res.json(sales);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching sales' });
    }
  }

  async getSaleById(req, res) {
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
  }

  async updateSale(req, res) {
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
  }

  async deleteSale(req, res) {
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
  }
}

const salesController = new SalesController();

module.exports = salesController;
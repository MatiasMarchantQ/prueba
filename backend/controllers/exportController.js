import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { createObjectCsvWriter } from 'csv-writer';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import fs from 'fs';
import { getSalesData } from './salesController.js'; // Asegúrate de tener esta función

const exportSales = async (req, res, format) => {
  try {
    // Fetch sales data using a modified function that returns data
    const salesData = await getSalesData(req);

    // Check if salesData and salesData.sales exist and are not empty
    if (!salesData || !salesData.sales || salesData.sales.length === 0) {
      return res.status(404).json({ message: 'No se encontraron ventas para exportar' });
    }

    // Depending on the requested format (excel, pdf, etc.)
    switch (format) {
      case 'excel':
        await exportToExcel(res, salesData.sales);
        break;
      case 'pdf':
        await exportToPDF(res, salesData.sales);
        break;
      case 'csv':
        await exportToCSV(res, salesData.sales);
        break;
      case 'word':
        await exportToWord(res, salesData.sales);
        break;
      default:
        return res.status(400).json({ message: 'Formato no soportado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Error en la exportación: ${error.message}` });
  }
};

const exportToExcel = async (res, salesData) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Ventas');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'sale_id', width: 10 },
    { header: 'Cliente', key: 'client_name', width: 30 },
    { header: 'Correo', key: 'client_email', width: 30 },
    { header: 'Teléfono', key: 'client_phone', width: 15 },
    { header: 'Fecha de Creación', key: 'created_at', width: 20 },
    { header: 'Promoción', key: 'promotion_id', width: 15 },
    { header: 'Monto de Instalación', key: 'installation_amount_id', width: 20 },
    { header: 'Comentarios Adicionales', key: 'additional_comments', width: 30 },
  ];

  // Add sales data to the worksheet
  salesData.forEach((sale) => {
    worksheet.addRow({
      sale_id: sale.sale_id,
      client_name: `${sale.client_first_name} ${sale.client_last_name}`,
      client_email: sale.client_email,
      client_phone: sale.client_phone,
      created_at: sale.created_at, // Ensure this field exists
      promotion_id: sale.promotion_id,
      installation_amount_id: sale.installation_amount_id,
      additional_comments: sale.additional_comments,
    });
  });

  // Set response headers for Excel file
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=ventas.xlsx');

  // Write the workbook to the response
  await workbook.xlsx.write(res);
  res.end(); // End the response
};


const exportToPDF = async (res, salesData) => {
  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=ventas.pdf');

  doc.pipe(res);

  doc.fontSize(16).text('Reporte de Ventas', { align: 'center' });
  doc.moveDown();

  salesData.forEach((sale) => {
    doc.fontSize(12).text(`ID: ${sale.sale_id}`);
    doc.fontSize(12).text(`Cliente: ${sale.client_first_name} ${sale.client_last_name}`);
    doc.moveDown();
  });

  doc.end();
};

const exportToCSV = async (res, salesData) => {
  const csvWriter = createObjectCsvWriter({
    path: 'ventas.csv',
    header: [
      { id: 'sale_id', title: 'ID' },
      { id: 'client_name', title: 'Cliente' },
    ],
  });

  const records = salesData.map((sale) => ({
    sale_id: sale.sale_id,
    client_name: `${sale.client_first_name} ${sale.client_last_name}`,
  }));

  await csvWriter.writeRecords(records);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=ventas.csv');
  fs.createReadStream('ventas.csv').pipe(res);
};

const exportToWord = async (res, salesData) => {
  const doc = new Document();

  doc.addSection({
    properties: {},
    children: [
      new Paragraph({
        children: [
          new TextRun('Reporte de Ventas'),
        ],
      }),
      ...salesData.map((sale) => 
        new Paragraph({
          children: [
            new TextRun(`ID: ${sale.sale_id}`),
            new TextRun(`Cliente: ${sale.client_first_name} ${sale.client_last_name}`),
          ],
        })
      ),
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', 'attachment; filename=ventas.docx');
  res.send(buffer);
};

export { exportSales };

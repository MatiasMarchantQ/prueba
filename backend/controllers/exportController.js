import ExcelJS from 'exceljs';
import * as fs from 'fs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as docx from 'docx';

export const exportSales = async (sales, format, filters ,res) => {
  switch (format) {
    case 'excel':
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Ventas');
      // Agregar título de las columnas
      worksheet.addRow([
        'ID',
        'Servicio',
        'Nombre del cliente',
        'Apellido del cliente',
        'RUT del cliente',
        'Correo electrónico del cliente',
        'Teléfono del cliente',
        'Teléfono secundario del cliente',
        'Región',
        'Comuna',
        'Calle',
        'Número',
        'Piso',
        'Referencia geográfica',
        'Promoción',
        'Monto de instalación',
        'Comentarios adicionales',
        'Prioridad',
        'Estado de venta',
        'Motivo de estado de venta',
        'Fecha de creación'
      ]);

      // Establecer el ancho de las columnas
      worksheet.columns = [
        { header: 'ID', key: 'sale_id', width: 10 },
        { header: 'Servicio', key: 'service_id', width: 15 },
        { header: 'Nombre del cliente', key: 'client_first_name', width: 20 },
        { header: 'Apellido del cliente', key: 'client_last_name', width: 20 },
        { header: 'RUT del cliente', key: 'client_rut', width: 15 },
        { header: 'Correo electrónico del cliente', key: 'client_email', width: 25 },
        { header: 'Teléfono del cliente', key: 'client_phone', width: 15 },
        { header: 'Teléfono secundario del cliente', key: 'client_secondary_phone', width: 15 },
        { header: 'Región', key: 'region', width: 15 },
        { header: 'Comuna', key: 'commune', width: 15 },
        { header: 'Calle', key: 'street', width: 20 },
        { header: 'Número', key: 'number', width: 10 },
        { header: 'Piso', key: 'department_office_floor', width: 10 },
        { header: 'Referencia geográfica', key: 'geo_reference', width: 20 },
        { header: 'Promoción', key: 'promotion', width: 15 },
        { header: 'Monto de instalación', key: 'installationAmount', width: 15 },
        { header: 'Comentarios adicionales', key: 'additional_comments', width: 25 },
        { header: 'Prioridad', key: 'is_priority', width: 10 },
        { header: 'Estado de venta', key: 'saleStatus', width: 15 },
        { header: 'Motivo de estado de venta', key: 'reason', width: 20 },
        { header: 'Fecha de creación', key: 'created_at', width: 15 }
      ];

      // Agregar datos a la hoja de cálculo
      sales.forEach((sale) => {
        worksheet.addRow([
          sale.sale_id,
          sale.service_id,
          sale.client_first_name,
          sale.client_last_name,
          sale.client_rut,
          sale.client_email,
          sale.client_phone,
          sale.client_secondary_phone,
          sale.region,
          sale.commune,
          sale.street,
          sale.number,
          sale.department_office_floor,
          sale.geo_reference,
          sale.promotion,
          sale.installationAmount,
          sale.additional_comments,
          sale.is_priority,
          sale.saleStatus,
          sale.reason,
          sale.created_at
        ]);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      console.log('Enviando archivo Excel...');
      res.set("Content-Disposition", `attachment; filename="ventas.xlsx"`);
      res.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.send(buffer);
      break;
      case 'pdf':
        const pdf = new jsPDF();
        pdf.setFont("helvetica");
        pdf.setFontSize(12);
      
        pdf.text('Reporte de Ventas', 14, 15);
        pdf.setFontSize(10);
      
        const tableColumn = [
          "ID", "Servicio", "Nombre", "RUT", "Email", "Teléfono", "Región", 
          "Comuna", "Calle", "Número", "Estado", "Fecha"
        ];
        const tableRows = [];
      
        sales.forEach((sale) => {
          const saleData = [
            sale.sale_id,
            sale.service_id,
            `${sale.client_first_name} ${sale.client_last_name}`,
            sale.client_rut,
            sale.client_email,
            sale.client_phone,
            sale.region,
            sale.commune,
            sale.street,
            sale.number,
            sale.saleStatus,
            sale.created_at
          ];
          tableRows.push(saleData);
        });
      
        pdf.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 20,
          styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
          columnStyles: { 
            0: { cellWidth: 10 },
            2: { cellWidth: 30 },
            4: { cellWidth: 40 }
          }
        });
      
        const pdfBuffer = pdf.output('arraybuffer');
        console.log('Enviando archivo PDF...');
        res.set("Content-Disposition", `attachment; filename="ventas.pdf"`);
        res.set("Content-Type", "application/pdf");
        res.send(Buffer.from(pdfBuffer));
        break;
      case 'word':
  const sections = [];
  sales.forEach((sale) => {
    sections.push({
      properties: {},
      children: [
        new docx.Paragraph(`ID: ${sale.sale_id}`),
        new docx.Paragraph(`Servicio: ${sale.service_id}`),
        new docx.Paragraph(`Nombre del cliente: ${sale.client_first_name} ${sale.client_last_name}`),
        new docx.Paragraph(`RUT del cliente: ${sale.client_rut}`),
        new docx.Paragraph(`Correo electrónico del cliente: ${sale.client_email}`),
        new docx.Paragraph(`Teléfono del cliente: ${sale.client_phone}`),
        new docx.Paragraph(`Teléfono secundario del cliente: ${sale.client_secondary_phone}`),
        new docx.Paragraph(`Región: ${sale.region}`),
        new docx.Paragraph(`Comuna: ${sale.commune}`),
        new docx.Paragraph(`Calle: ${sale.street}`),
        new docx.Paragraph(`Número: ${sale.number}`),
        new docx.Paragraph(`Piso: ${sale.department_office_floor}`),
        new docx.Paragraph(`Referencia geográfica: ${sale.geo_reference}`),
        new docx.Paragraph(`Promoción: ${sale.promotion}`),
        new docx.Paragraph(`Monto de instalación: ${sale.installationAmount}`),
        new docx.Paragraph(`Comentarios adicionales: ${sale.additional_comments}`),
        new docx.Paragraph(`Prioridad: ${sale.is_priority}`),
        new docx.Paragraph(`Estado de venta: ${sale.saleStatus}`),
        new docx.Paragraph(`Motivo de estado de venta: ${sale.reason}`),
        new docx.Paragraph(`Fecha de creación: ${sale.created_at}`),
      ],
    });
  });

  const doc = new docx.Document({
    sections: sections,
    creator: 'Ingbell SpA',
  });

  const wordBuffer = await docx.Packer.toBuffer(doc);
  console.log('Enviando archivo Word...');
  res.set("Content-Disposition", `attachment; filename="ventas.docx"`);
  res.set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.send(wordBuffer);
  break;
    case 'csv':
      const csv = [];
      sales.forEach((sale) => {
        csv.push([
          sale.sale_id,
          sale.service_id,
          sale.client_first_name,
          sale.client_last_name,
          sale.client_rut,
          sale.client_email,
          sale.client_phone,
          sale.client_secondary_phone,
          sale.region,
          sale.commune,
          sale.street,
          sale.number,
          sale.department_office_floor,
          sale.geo_reference,
          sale.promotion,
          sale.installationAmount,
          sale.additional_comments,
          sale.is_priority,
          sale.saleStatus,
          sale.reason,
          sale.created_at
        ]);
      });
      const csvBuffer = await csvToBuffer(csv);
      console.log('Enviando archivo CSV...');
      res.set("Content-Disposition", `attachment; filename="ventas.csv"`);
      res.set("Content-Type", "text/csv");
      res.send(csvBuffer);
      break;
    default:
      console.error('Formato de exportación no válido');
      return;
  }
};

const csvToBuffer = async (csv) => {
  const csvString = csv.map((row) => row.join(',')).join('\n');
  const buffer = Buffer.from(csvString, 'utf8');
  return buffer;
};
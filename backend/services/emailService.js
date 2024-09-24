import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import SalesChannel from '../models/SalesChannels.js';
import Commune from '../models/Communes.js';
import Promotion from '../models/Promotions.js';
import InstallationAmount from '../models/InstallationAmounts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración del transportador de nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Función para enviar la notificación por correo con imágenes adjuntas
export const sendEmailNotification = async (sale, currentUser, reqBody, files) => {
  const salesChannel = await SalesChannel.findOne({ where: { sales_channel_id: 1 } });
  const commune = await Commune.findOne({ where: { commune_id: sale.commune_id } });
  const promotion = await Promotion.findOne({ where: { promotion_id: sale.promotion_id } });
  const installationAmount = await InstallationAmount.findOne({ where: { installation_amount_id: promotion.installation_amount_id } });

  const executiveName = currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Ejecutivo no asignado';
  const subject = `${reqBody.client_last_name}, ${reqBody.client_first_name} - ${executiveName} - ${commune ? commune.commune_name : 'Comuna no disponible'} - ${salesChannel ? salesChannel.channel_name : 'Canal no disponible'}`;
  const formattedDate = new Date(sale.created_at).toLocaleString('es-CL', { timeZone: 'America/Santiago' });

  const message = `
    <p>Estimado/a,</p>
    <p>Se ha registrado una nueva venta en el sistema.</p>
    <p><strong>Detalles de la Venta:</strong></p>
    <ul>
      <li><strong>Fecha:</strong> ${formattedDate}</li>
      <li><strong>Nombre del Cliente:</strong> ${reqBody.client_first_name} ${reqBody.client_last_name}</li>
      <li><strong>RUT del Cliente:</strong> ${reqBody.client_rut}</li>
      <li><strong>Teléfono del Cliente:</strong> ${reqBody.client_phone}</li>
      <li><strong>Email del Cliente:</strong> ${reqBody.client_email}</li>
      <li><strong>Dirección:</strong> ${reqBody.street ? `${reqBody.street} ${reqBody.number}` : 'No proporcionada'}</li>
      <li><strong>Comuna:</strong> ${commune ? commune.commune_name : 'No disponible'}</li>
      <li><strong>Monto de instalación:</strong> ${installationAmount ? installationAmount.amount : 'No disponible'}</li>
      <li><strong>Promoción:</strong> ${promotion ? promotion.promotion : 'Promoción no disponible'}</li>
      <li><strong>Referencia Geográfica:</strong> ${reqBody.geo_reference}</li>
      <li><strong>Nombre del Ejecutivo:</strong> ${executiveName}</li>
    </ul>
    <p>Por favor, revise el Canal Ventas ISP.</p>
    <p>Saludos cordiales,</p>
    <p>El equipo de ventas</p>
  `;

  // Adjuntar las imágenes de la cédula
  const attachments = files.map(file => ({
    filename: file.filename,
    path: file.path
  }));

  // Enviar el correo electrónico
  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: 'internetsolicitudes@gmail.com',
    subject,
    html: message,
    attachments
  }, (error, info) => {
    if (error) {
      console.error(error);
    } else {
      console.log(`Correo electrónico enviado: ${info.response}`);
    }
  });
};
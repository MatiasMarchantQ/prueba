import nodemailer from 'nodemailer';
import SalesChannel from '../models/SalesChannels.js';
import Commune from '../models/Communes.js';
import Promotion from '../models/Promotions.js';
import InstallationAmount from '../models/InstallationAmounts.js';
import Region from '../models/Regions.js'; // Importar el modelo de Region
import SaleStatusReason from '../models/SaleStatusReason.js';
import Contract from '../models/Contract.js';

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
export const sendEmailNotification = async (sale, currentUser, reqBody) => {
  const salesChannel = await SalesChannel.findOne({ where: { sales_channel_id: 1 } });
  const commune = await Commune.findOne({ where: { commune_id: sale.commune_id } });
  const promotion = await Promotion.findOne({ where: { promotion_id: sale.promotion_id } });
  const installationAmount = await InstallationAmount.findOne({ where: { installation_amount_id: promotion.installation_amount_id } });
  const contract = currentUser ? await Contract.findOne({ where: { contract_id: currentUser.contract_id } }) : null;

  // Obtener la región asociada a la comuna
  const region = commune ? await Region.findOne({ where: { region_id: commune.region_id } }) : null;
  const executiveName = currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Ejecutivo no asignado';
  const subject = `${reqBody.client_first_name} ${reqBody.client_last_name} - ${executiveName} - ${commune ? commune.commune_name : 'Comuna no disponible'} - ${salesChannel ? salesChannel.channel_name : 'Canal no disponible'}`;
  const formattedDate = new Date(sale.created_at).toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
});

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
      <li><strong>Región:</strong> ${region ? region.region_name : 'No disponible'}</li>
      <li><strong>Comuna:</strong> ${commune ? commune.commune_name : 'No disponible'}</li>
      <li><strong>Monto de instalación:</strong> ${installationAmount ? installationAmount.amount : 'No disponible'}</li>
      <li><strong>Promoción:</strong> ${promotion ? promotion.promotion : 'Promoción no disponible'}</li>
      <li><strong>Referencia Geográfica:</strong> ${reqBody.geo_reference ? reqBody.geo_reference : 'No proporcionada'}</li>
      <li><strong>Nombre del Ejecutivo:</strong> ${executiveName}</li>
      <li><strong>Tipo de Contrato:</strong> ${contract ? contract.contract_name : 'No disponible'}</li>
      </ul>
    <p>Por favor, revise el Canal Ventas ISP.</p>
    <p>Saludos cordiales,</p>
    <p>El equipo de ventas</p>
  `;

  // Enviar el correo electrónico
  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: 'internetsolicitudes@gmail.com',
    subject,
    html: message
  }, (error, info) => {
    if (error) {
      console.error(error);
    } else {
      console.log(`Correo electrónico enviado: ${info.response}`);
    }
  });
};

// Nueva función para enviar la notificación por correo cuando el servicio está activo
export const sendActiveSaleEmailNotification = async (sale, currentUser , reqBody) => {
  const salesChannel = await SalesChannel.findOne({ where: { sales_channel_id: 1 } });
  const commune = await Commune.findOne({ where: { commune_id: sale.commune_id } });
  const promotion = await Promotion.findOne({ where: { promotion_id: sale.promotion_id } });
  const installationAmount = await InstallationAmount.findOne({ where: { installation_amount_id: promotion.installation_amount_id } });
  const contract = currentUser ? await Contract.findOne({ where: { contract_id: currentUser.contract_id } }) : null;

  // Obtener la región asociada a la comuna
  const region = commune ? await Region.findOne({ where: { region_id: commune.region_id } }) : null;
  const executiveName = currentUser  ? `${currentUser .first_name} ${currentUser .last_name}` : 'Ejecutivo no asignado';
  const subject = `${reqBody.client_first_name} ${reqBody.client_last_name} - ${executiveName} - ${commune ? commune.commune_name : 'Comuna no disponible'} - ${salesChannel ? salesChannel.channel_name : 'Canal no disponible'}`;
  const formattedDate = new Date(sale.created_at).toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
  });

  const message = `
    <p>Estimado/a,</p>
    <p>El servicio ha quedado activo y se ha instalado correctamente.</p>
    <p><strong>Detalles de la Venta:</strong></p>
    <ul>
      <li><strong>Fecha:</strong> ${formattedDate}</li>
      <li><strong>Nombre del Cliente:</strong> ${reqBody.client_first_name} ${reqBody.client_last_name}</li>
      <li><strong>RUT del Cliente:</strong> ${reqBody.client_rut}</li>
      <li><strong>Teléfono del Cliente:</strong> ${reqBody.client_phone}</li>
      <li><strong>Email del Cliente:</strong> ${reqBody.client_email}</li>
      <li><strong>Dirección:</strong> ${reqBody.street ? `${reqBody.street} ${reqBody.number}` : 'No proporcionada'}</li>
      <li><strong>Región:</strong> ${region ? region.region_name : 'No disponible'}</li>
      <li><strong>Comuna:</strong> ${commune ? commune.commune_name : 'No disponible'}</li>
      <li><strong>Monto de instalación:</strong> ${installationAmount ? installationAmount.amount : 'No disponible'}</li>
      <li><strong>Promoción:</strong> ${promotion ? promotion.promotion : 'Promoción no disponible'}</li>
      <li><strong>Referencia Geográfica:</strong> ${reqBody.geo_reference ? reqBody.geo_reference : 'No proporcionada'}</li>
      <li><strong>Nombre del Ejecutivo:</strong> ${executiveName}</li>
      <li><strong>Tipo de Contrato:</strong> ${contract ? contract.contract_name : 'No disponible'}</li>
    </ul>
    <p>Saludos cordiales,</p>
    <p>El equipo de ventas</p>
  `;

  // Enviar el correo electrónico
  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: currentUser.email,
    subject,
    html: message
  }, (error, info) => {
    if (error) {
      console.error(error);
    } else {
      console.log(`Correo electrónico enviado: ${info.response}`);
    }
  });
};

// Nueva función para enviar la notificación por correo cuando se requiere corrección
export const sendCorrectionRequiredEmailNotification = async (sale, currentUser, reqBody) => {
  const salesChannel = await SalesChannel.findOne({ where: { sales_channel_id: 1 } });
  const commune = await Commune.findOne({ where: { commune_id: sale.commune_id } });
  const promotion = await Promotion.findOne({ where: { promotion_id: sale.promotion_id } });
  const installationAmount = await InstallationAmount.findOne({ where: { installation_amount_id: promotion.installation_amount_id } });
  const statusReason = await SaleStatusReason.findOne({ where: { sale_status_reason_id: sale.sale_status_reason_id } });
  const contract = currentUser ? await Contract.findOne({ where: { contract_id: currentUser.contract_id } }) : null;

  // Obtener la región asociada a la comuna
  const region = commune ? await Region.findOne({ where: { region_id: commune.region_id } }) : null;
  const executiveName = currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Ejecutivo no asignado';
  const subject = `Corrección Requerida - ${reqBody.client_first_name} ${reqBody.client_last_name} - ${executiveName} - ${commune ? commune.commune_name : 'Comuna no disponible'} - ${salesChannel ? salesChannel.channel_name : 'Canal no disponible'}`;
  const formattedDate = new Date(sale.created_at).toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const message = `
    <p>Estimado/a,</p>
    <p>Se requiere una corrección en la venta. Por favor, revise los detalles a continuación y realice las correcciones necesarias.</p>
    ${statusReason ? `<p><strong>Motivo de la corrección:</strong> ${statusReason.reason_name}</p>` : ''}
    ${sale.additional_comments ? `<p><strong>Comentarios adicionales:</strong> ${sale.additional_comments}</p>` : ''}
    <p><strong>Detalles de la Venta:</strong></p>
    <ul>
      <li><strong>Fecha:</strong> ${formattedDate}</li>
      <li><strong>Nombre del Cliente:</strong> ${reqBody.client_first_name} ${reqBody.client_last_name}</li>
      <li><strong>RUT del Cliente:</strong> ${reqBody.client_rut}</li>
      <li><strong>Teléfono del Cliente:</strong> ${reqBody.client_phone}</li>
      <li><strong>Email del Cliente:</strong> ${reqBody.client_email}</li>
      <li><strong>Dirección:</strong> ${reqBody.street ? `${reqBody.street} ${reqBody.number}` : 'No proporcionada'}</li>
      <li><strong>Región:</strong> ${region ? region.region_name : 'No disponible'}</li>
      <li><strong>Comuna:</strong> ${commune ? commune.commune_name : 'No disponible'}</li>
      <li><strong>Monto de instalación:</strong> ${installationAmount ? installationAmount.amount : 'No disponible'}</li>
      <li><strong>Promoción:</strong> ${promotion ? promotion.promotion : 'Promoción no disponible'}</li>
      <li><strong>Referencia Geográfica:</strong> ${reqBody.geo_reference ? reqBody.geo_reference : 'No proporcionada'}</li>
      <li><strong>Nombre del Ejecutivo:</strong> ${executiveName}</li>
      <li><strong>Tipo de Contrato:</strong> ${contract ? contract.contract_name : 'No disponible'}</li>
    </ul>
    <p><strong>Por favor, realice las correcciones necesarias lo antes posible.</strong></p>
    <p>Saludos cordiales,</p>
    <p>El equipo de ventas</p>
  `;

  // Enviar el correo electrónico
  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: currentUser.email,
    subject,
    html: message
  }, (error, info) => {
    if (error) {
      console.error(error);
    } else {
      console.log(`Correo electrónico enviado: ${info.response}`);
    }
  });
};
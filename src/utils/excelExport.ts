import * as XLSX from 'xlsx';
import { CustomerLead, Order } from '../types';
import { formatDate } from './formatters';

/**
 * Downloads an Excel file in the user's browser
 */
function triggerDownload(workbook: XLSX.WorkBook, filename: string) {
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads Excel Report for Orders & Shipping details
 */
export function exportOrdersToExcel(orders: Order[], filenamePrefix = 'Reporte_Pedidos_Lunary_Pets'): void {
  const rows = orders.map((ord, index) => {
    const productsList = ord.items
      .map((it) => `${it.productName} (Cant: ${it.quantity} - Total: $${it.total.toLocaleString('es-CO')})`)
      .join(' | ');

    return {
      'Nº Item': index + 1,
      'Código de Pedido': `#${ord.orderNumber}`,
      'Fecha y Hora': formatDate(ord.createdAt),
      'Nombre del Cliente': ord.customerName,
      'Teléfono / WhatsApp': ord.customerPhone,
      'Dirección de Envío': ord.customerAddress,
      'Ciudad de Envío': ord.customerCity || 'Bogotá',
      'Notas / Instrucciones': ord.customerNotes || 'Sin notas especiales',
      'Productos Solicitados': productsList,
      'Subtotal (COP)': ord.subtotal,
      'Costo de Envío (COP)': ord.deliveryFee,
      'Total Pagado / A Cobrar (COP)': ord.total,
      'Método de Pago': ord.paymentMethod.toUpperCase(),
      'Referencia / Comprobante de Pago': ord.paymentReference || ord.wompiTransactionId || 'N/A',
      'Estado del Pedido':
        ord.status === 'pagado'
          ? 'PAGADO'
          : ord.status === 'en_camino'
          ? 'EN CAMINO'
          : ord.status === 'entregado'
          ? 'ENTREGADO'
          : ord.status === 'cancelado'
          ? 'CANCELADO'
          : 'PENDIENTE',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set nice column widths
  worksheet['!cols'] = [
    { wch: 8 },  // Nº Item
    { wch: 18 }, // Código Pedido
    { wch: 22 }, // Fecha
    { wch: 26 }, // Cliente
    { wch: 18 }, // Teléfono
    { wch: 32 }, // Dirección
    { wch: 16 }, // Ciudad
    { wch: 25 }, // Notas
    { wch: 45 }, // Productos
    { wch: 16 }, // Subtotal
    { wch: 18 }, // Envío
    { wch: 20 }, // Total
    { wch: 16 }, // Método
    { wch: 25 }, // Referencia
    { wch: 16 }, // Estado
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedidos_y_Envios');

  const today = new Date().toISOString().slice(0, 10);
  triggerDownload(workbook, `${filenamePrefix}_${today}.xlsx`);
}

/**
 * Generates and downloads Excel Report for Customer Leads & Messages
 */
export function exportLeadsToExcel(leads: CustomerLead[], filenamePrefix = 'Base_Datos_Clientes_Lunary_Pets'): void {
  const rows = leads.map((lead, index) => ({
    'Nº': index + 1,
    'Fecha de Registro': formatDate(lead.createdAt),
    'Nombre del Cliente': lead.name,
    'Teléfono / WhatsApp': lead.phone,
    'Mascota': lead.petName || 'Perro / Gato',
    'Mensaje / Consulta del Cliente': lead.message,
    'Estado':
      lead.status === 'convertido'
        ? 'COMPRA REALIZADA'
        : lead.status === 'contactado'
        ? 'CONTACTADO'
        : lead.status === 'archivado'
        ? 'ARCHIVADO'
        : 'NUEVO MENSAJE',
    'Origen': lead.source || 'Formulario de Contacto Web',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 6 },  // Nº
    { wch: 22 }, // Fecha
    { wch: 26 }, // Nombre
    { wch: 18 }, // Teléfono
    { wch: 20 }, // Mascota
    { wch: 45 }, // Mensaje
    { wch: 18 }, // Estado
    { wch: 25 }, // Origen
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes_y_Mensajes');

  const today = new Date().toISOString().slice(0, 10);
  triggerDownload(workbook, `${filenamePrefix}_${today}.xlsx`);
}

/**
 * Full Complete Daily Business Report (Multi-Tab Excel Workbook)
 */
export function exportFullDailyReportExcel(orders: Order[], leads: CustomerLead[]): void {
  const todayStr = new Date().toISOString().slice(0, 10);
  
  // Filter today's items or all if none today
  const todayOrders = orders.filter((o) => o.createdAt && o.createdAt.startsWith(todayStr));
  const todayLeads = leads.filter((l) => l.createdAt && l.createdAt.startsWith(todayStr));

  const totalSalesAll = orders.reduce((acc, o) => acc + o.total, 0);
  const totalSalesToday = todayOrders.reduce((acc, o) => acc + o.total, 0);

  // Sheet 1: Summary Dashboard
  const summaryData = [
    { 'MÉTRICA': 'Fecha del Reporte Generado', 'VALOR': new Date().toLocaleString('es-CO') },
    { 'MÉTRICA': 'Total Pedidos Hoy', 'VALOR': todayOrders.length },
    { 'MÉTRICA': 'Ventas Totales Hoy (COP)', 'VALOR': `$${totalSalesToday.toLocaleString('es-CO')}` },
    { 'MÉTRICA': 'Nuevos Clientes / Mensajes Hoy', 'VALOR': todayLeads.length },
    { 'MÉTRICA': '-------------------------', 'VALOR': '-------------------------' },
    { 'MÉTRICA': 'Histórico Total Pedidos Registrados', 'VALOR': orders.length },
    { 'MÉTRICA': 'Histórico Total Ventas Acumuladas (COP)', 'VALOR': `$${totalSalesAll.toLocaleString('es-CO')}` },
    { 'MÉTRICA': 'Histórico Total Contactos / Clientes', 'VALOR': leads.length },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 35 }, { wch: 30 }];

  // Sheet 2: All Orders
  const ordersRows = orders.map((ord, index) => ({
    'Nº Item': index + 1,
    'Código de Pedido': `#${ord.orderNumber}`,
    'Fecha y Hora': formatDate(ord.createdAt),
    'Nombre del Cliente': ord.customerName,
    'Teléfono / WhatsApp': ord.customerPhone,
    'Dirección de Envío': ord.customerAddress,
    'Ciudad': ord.customerCity || 'Bogotá',
    'Notas de Envío': ord.customerNotes || 'Sin notas',
    'Productos Comprados': ord.items.map((i) => `${i.productName} (x${i.quantity})`).join(', '),
    'Subtotal (COP)': ord.subtotal,
    'Domicilio (COP)': ord.deliveryFee,
    'Total Pedido (COP)': ord.total,
    'Método de Pago': ord.paymentMethod.toUpperCase(),
    'Referencia / ID Pago': ord.paymentReference || ord.wompiTransactionId || 'N/A',
    'Estado': ord.status.toUpperCase(),
  }));
  const ordersSheet = XLSX.utils.json_to_sheet(ordersRows.length > 0 ? ordersRows : [{ 'Mensaje': 'No hay pedidos aún' }]);
  ordersSheet['!cols'] = [
    { wch: 8 }, { wch: 18 }, { wch: 22 }, { wch: 25 }, { wch: 18 }, { wch: 30 }, { wch: 16 }, { wch: 22 }, { wch: 45 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 16 }, { wch: 20 }, { wch: 15 }
  ];

  // Sheet 3: All Customer Leads & Messages
  const leadsRows = leads.map((lead, index) => ({
    'Nº': index + 1,
    'Fecha': formatDate(lead.createdAt),
    'Cliente': lead.name,
    'Teléfono / WhatsApp': lead.phone,
    'Mascota': lead.petName || 'Perro / Gato',
    'Mensaje Recibido': lead.message,
    'Estado': lead.status.toUpperCase(),
  }));
  const leadsSheet = XLSX.utils.json_to_sheet(leadsRows.length > 0 ? leadsRows : [{ 'Mensaje': 'No hay mensajes aún' }]);
  leadsSheet['!cols'] = [
    { wch: 6 }, { wch: 22 }, { wch: 25 }, { wch: 18 }, { wch: 20 }, { wch: 45 }, { wch: 16 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen_General');
  XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Pedidos_y_Envios');
  XLSX.utils.book_append_sheet(workbook, leadsSheet, 'Base_Datos_Clientes');

  triggerDownload(workbook, `Reporte_Diario_Completo_Lunary_Pets_${todayStr}.xlsx`);
}

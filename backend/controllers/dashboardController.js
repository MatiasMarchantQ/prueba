import Sales from '../models/Sales.js';
import SaleHistory from '../models/SaleHistories.js';
import Region from '../models/Regions.js';
import Commune from '../models/Communes.js';
import User from '../models/Users.js';
import Role from '../models/Roles.js';
import SalesChannel from '../models/SalesChannels.js';
import InstallationAmount from '../models/InstallationAmounts.js';
import Promotion from '../models/Promotions.js';
import PromotionCommune from '../models/PromotionsCommunes.js';
import Company from '../models/Companies.js';
import CompanyPriority from '../models/CompanyPriorities.js';
import SaleStatus from '../models/SaleStatuses.js';
import SaleStatusReason from '../models/SaleStatusReason.js';
import path from 'path';
import fs from 'fs';
import { fetchRegionById } from '../services/dataServices.js';
import { Op, Sequelize } from 'sequelize';

const getDashboardStats = async (req, res) => {
  try {
    const hoy = new Date();
    const docesMesesAtras = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
    const nombresMeses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

       // Mapeo de IDs a nombres de estado
  const statusIdToName = {
    1: "Ingresada",
    2: "Nueva",
    3: "En revisión",
    4: "Corrección requerida",
    5: "Pendiente",
    6: "Activo",
    7: "Anulado"
  };

    const sales = await Sales.findAll({
      include: [
        {
          model: Region,
          as: 'region',
          attributes: ['region_name']
        },
        {
          model: Commune,
          as: 'commune',
          attributes: ['commune_name']
        },
        {
          model: SalesChannel,
          as: 'salesChannel',
          attributes: ['channel_name']
        },
        {
          model: SaleStatus,
          as: 'saleStatus',
          attributes: ['sale_status_id', 'status_name']
        },
        {
          model: SaleStatusReason,
          as: 'reason',
          attributes: ['reason_name']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['company_name']
        },
        {
          model: Promotion,
          as: 'promotion',
          attributes: ['promotion']
        },
        {
          model: InstallationAmount,
          as: 'installationAmount',
          attributes: ['amount']
        },
        {
          model: User,
          as: 'executive',
          attributes: ['first_name', 'last_name']
        },
        {
          model: SaleHistory,
          as: 'saleStatuses',
          attributes: ['sale_id', 'new_status_id', 'modification_date']
        },
      ]
    });

    const statistics = {};

    // Al inicio de la función, después de obtener las ventas
    const fechaActual = new Date();
    const añoActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth();

    // Filtrar ventas del año actual, excluyendo las anuladas
    const ventasAñoActual = sales.filter(venta => {
        const fechaVenta = new Date(venta.created_at);
        return fechaVenta.getFullYear() === añoActual && venta.sale_status_id !== 7;
    });

    //1 Total de ventas del año actual (excluyendo anuladas)
    statistics.totalSales = ventasAñoActual.length;

    // Contador de ventas del mes actual (excluyendo anuladas)
    statistics.ventasDelMesActual = sales.filter(venta => {
        const fechaVenta = new Date(venta.created_at);
        return fechaVenta.getMonth() === mesActual && 
              fechaVenta.getFullYear() === añoActual && 
              venta.sale_status_id !== 7;
    }).length;

    // Obtener el nombre del mes actual en español
    const nombreMesActual = new Intl.DateTimeFormat('es', { month: 'long' }).format(fechaActual);

    // Formar el mensaje con el contador y el año
    statistics.mensajeVentasMes = `+${statistics.ventasDelMesActual} en ${nombreMesActual} ${añoActual}`; 

    // Contador de ventas del mes actual
    statistics.ventasDelMesActual = sales.filter(venta => {
        const fechaVenta = new Date(venta.created_at);
        return fechaVenta.getMonth() === mesActual && fechaVenta.getFullYear() === añoActual;
    }).length;


    // Formar el mensaje con el contador y el año
    const nombreMes = new Intl.DateTimeFormat('es', { month: 'long' }).format(fechaActual);
    statistics.mensajeVentasMes = `+${statistics.ventasDelMesActual} en ${nombreMes} ${añoActual}`;
    
    
    //2 Ventas por región (solo activas y del año actual)
  const ventasPorRegion = {};

  sales.forEach((venta) => {
    const fechaVenta = new Date(venta.created_at);
    const añoVenta = fechaVenta.getFullYear();
    
    if (añoVenta === añoActual) {
      const region = venta.region.region_name;
      if (!ventasPorRegion[region]) {
        ventasPorRegion[region] = { ingresadas: 0, activas: 0 };
      }
      
      if (venta.saleStatus.sale_status_id === 1) {
        ventasPorRegion[region].ingresadas++;
      } else if (venta.saleStatus.sale_status_id === 6) {
        ventasPorRegion[region].activas++;
      }
    }
  });

  // Si no hay ventas, asegurarse de que ventasPorRegion no esté vacío
  if (Object.keys(ventasPorRegion).length === 0) {
    ventasPorRegion["Sin ventas"] = { ingresadas: 0, activas: 0 };
  }

  // Calcular el total para cada región
  Object.keys(ventasPorRegion).forEach(region => {
    ventasPorRegion[region].total = 
      ventasPorRegion[region].ingresadas + ventasPorRegion[region].activas;
  });

  statistics.ventasPorRegion = ventasPorRegion;
    


    // Ventas por comuna y mes
    const ventasPorComunaYMes = {};

    sales.forEach((venta) => {
      const fechaVenta = new Date(venta.created_at);
      if (fechaVenta >= docesMesesAtras) {
        const comuna = venta.commune.commune_name;
        const mesVenta = `${nombresMeses[fechaVenta.getMonth()]} ${fechaVenta.getFullYear()}`;
        
        if (!ventasPorComunaYMes[comuna]) {
          ventasPorComunaYMes[comuna] = {};
        }
        if (!ventasPorComunaYMes[comuna][mesVenta]) {
          ventasPorComunaYMes[comuna][mesVenta] = 0;
        }
        ventasPorComunaYMes[comuna][mesVenta]++;
      }
    });

    // Asegurarse de que todos los meses estén representados para cada comuna
    Object.keys(ventasPorComunaYMes).forEach(comuna => {
      for (let i = 0; i < 12; i++) {
        const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const mesKey = `${nombresMeses[fecha.getMonth()]} ${fecha.getFullYear()}`;
        if (!ventasPorComunaYMes[comuna][mesKey]) {
          ventasPorComunaYMes[comuna][mesKey] = 0;
        }
      }
    });

    // Opcional: Filtrar para mostrar solo las N comunas con más ventas totales
    const topNComunas = 10; // Ajusta este número según necesites
    const comunasConMasVentas = Object.entries(ventasPorComunaYMes)
      .map(([comuna, ventas]) => ({
        comuna,
        totalVentas: Object.values(ventas).reduce((sum, count) => sum + count, 0)
      }))
      .sort((a, b) => b.totalVentas - a.totalVentas)
      .slice(0, topNComunas)
      .map(({comuna}) => comuna);

    const ventasFiltradas = {};
    comunasConMasVentas.forEach(comuna => {
      ventasFiltradas[comuna] = ventasPorComunaYMes[comuna];
    });

    statistics.ventasPorComunaYMes = ventasFiltradas;


  // Ventas por canal de ventas de los últimos 12 meses
  const ventasPorCanal = {};
  const hace12Meses = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 11, 1);

  sales.forEach((venta) => {
    const fechaVenta = new Date(venta.created_at);
    
    // Verificar si la venta está dentro de los últimos 12 meses
    if (fechaVenta >= hace12Meses && fechaVenta <= fechaActual) {
      const canal = venta.salesChannel.channel_name;
      if (!ventasPorCanal[canal]) {
        ventasPorCanal[canal] = 0;
      }
      ventasPorCanal[canal]++;
    }
  });

  statistics.ventasPorCanal = ventasPorCanal;

 // Ventas por estado de los últimos 12 meses
const ventasPorEstado = {};
const ventasPorEstadoPorMes = {};

sales.forEach((venta) => {
  const fechaVenta = new Date(venta.created_at);
  
  // Verificar si la venta está dentro de los últimos 12 meses
  if (fechaVenta >= hace12Meses && fechaVenta <= fechaActual) {
    const estadoId = venta.sale_status_id;
    const mesVenta = `${fechaVenta.getFullYear()}-${(fechaVenta.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (estadoId && statusIdToName[estadoId]) {
      const estadoNombre = statusIdToName[estadoId];
      
      // Actualizar ventasPorEstado
      if (!ventasPorEstado[estadoNombre]) {
        ventasPorEstado[estadoNombre] = 0;
      }
      ventasPorEstado[estadoNombre]++;
      
      // Actualizar ventasPorEstadoPorMes
      if (!ventasPorEstadoPorMes[mesVenta]) {
        ventasPorEstadoPorMes[mesVenta] = {};
      }
      if (!ventasPorEstadoPorMes[mesVenta][estadoNombre]) {
        ventasPorEstadoPorMes[mesVenta][estadoNombre] = 0;
      }
      ventasPorEstadoPorMes[mesVenta][estadoNombre]++;
    } else {
      // Manejar ventas sin estado
      if (!ventasPorEstado['Sin Estado']) {
        ventasPorEstado['Sin Estado'] = 0;
      }
      ventasPorEstado['Sin Estado']++;
      
      if (!ventasPorEstadoPorMes[mesVenta]) {
        ventasPorEstadoPorMes[mesVenta] = {};
      }
      if (!ventasPorEstadoPorMes[mesVenta]['Sin Estado']) {
        ventasPorEstadoPorMes[mesVenta]['Sin Estado'] = 0;
      }
      ventasPorEstadoPorMes[mesVenta]['Sin Estado']++;
    }
  }
});

// Asegurarse de que todos los meses y estados estén representados en ventasPorEstadoPorMes
for (let i = 0; i < 12; i++) {
  const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
  const mesKey = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
  
  if (!ventasPorEstadoPorMes[mesKey]) {
    ventasPorEstadoPorMes[mesKey] = {};
  }
  
  Object.values(statusIdToName).forEach(estado => {
    if (!ventasPorEstadoPorMes[mesKey][estado]) {
      ventasPorEstadoPorMes[mesKey][estado] = 0;
    }
  });
}

// Función auxiliar para obtener el nombre del mes
function obtenerNombreMes(mesNumerico) {
  const [año, mes] = mesNumerico.split('-');
  return `${nombresMeses[parseInt(mes) - 1]} ${año}`;
}

// Ordenar los meses de más reciente a más antiguo y los estados
const ventasPorEstadoPorMesOrdenado = Object.entries(ventasPorEstadoPorMes)
  .sort((a, b) => {
    const [añoA, mesA] = a[0].split('-'); // Invertir el orden de los meses
    const [añoB, mesB] = b[0].split('-');
    return new Date(añoB, mesB - 1) - new Date(añoA, mesA - 1); // Invertir el orden de los meses
  })
  .reduce((acc, [mes, estados]) => {
    const nombreMes = obtenerNombreMes(mes);
    acc[nombreMes] = Object.entries(estados)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .reduce((acc, [estado, cantidad]) => {
        acc[estado] = cantidad;
        return acc;
      }, {});
    return acc;
  }, {});

  // Agregar las estadísticas al objeto statistics
  statistics.ventasPorEstado = ventasPorEstado;
  statistics.ventasPorEstadoPorMes = ventasPorEstadoPorMesOrdenado;



    // Ventas por empresa
    const ventasPorEmpresaMes = {};

    // Función para obtener el nombre del mes en español
    function getNombreMes(fecha) {
        return nombresMeses[fecha.getMonth()];
    }

    // Función para formatear la fecha como "NombreMes Año"
    function formatearFecha(fecha) {
        return `${getNombreMes(fecha)} ${fecha.getFullYear()}`;
    }

    sales.forEach((venta) => {
      const empresa = venta.company.company_name;
      const fecha = new Date(venta.created_at);
      
      // Solo procesar ventas de los últimos 12 meses
      if (fecha >= docesMesesAtras && fecha <= hoy) {
          const mesClave = formatearFecha(fecha);
          const estadoId = venta.sale_status_id;
          const estadoNombre = statusIdToName[estadoId] || 'Otro';

          if (!ventasPorEmpresaMes[empresa]) {
              ventasPorEmpresaMes[empresa] = {};
          }
          if (!ventasPorEmpresaMes[empresa][mesClave]) {
              ventasPorEmpresaMes[empresa][mesClave] = { total: 0 };
              // Inicializar contadores para todos los estados posibles
              Object.values(statusIdToName).forEach(estado => {
                  ventasPorEmpresaMes[empresa][mesClave][estado] = 0;
              });
          }

          // Incrementar el total de ventas
          ventasPorEmpresaMes[empresa][mesClave].total++;

          // Incrementar el contador para el estado específico
          ventasPorEmpresaMes[empresa][mesClave][estadoNombre]++;
      }
    });

    // Generar array de los últimos 12 meses
    const ultimos12Meses = [];
    for (let i = 0; i < 12; i++) {
        const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        ultimos12Meses.unshift(formatearFecha(fecha));
    }

    // Crear el objeto final ordenado
    const ventasPorEmpresaMesOrdenado = {};
    Object.keys(ventasPorEmpresaMes).sort().forEach(empresa => {
        ventasPorEmpresaMesOrdenado[empresa] = {};
        ultimos12Meses.forEach(mes => {
            ventasPorEmpresaMesOrdenado[empresa][mes] = 
                ventasPorEmpresaMes[empresa][mes] || { total: 0, ...Object.values(statusIdToName).reduce((acc, estado) => ({...acc, [estado]: 0}), {}) };
        });
    });

    statistics.ventasPorEmpresaMes = ventasPorEmpresaMesOrdenado;

// Ventas por promoción

// Función para obtener la clave del mes (Nombre Mes Año)
const obtenerClaveMes = (fecha) => {
  return `${nombresMeses[fecha.getMonth()]} ${fecha.getFullYear()}`;
};
const ventasPorPromocion = {};

sales.forEach((venta) => {
  const fechaVenta = new Date(venta.created_at);
  
  // Solo procesar ventas de los últimos 12 meses
  if (fechaVenta >= docesMesesAtras && fechaVenta <= hoy) {
    const promocion = venta.promotion.promotion;
    const claveMes = obtenerClaveMes(fechaVenta);
    const estado = venta.sale_status_id;

    if (!ventasPorPromocion[promocion]) {
      ventasPorPromocion[promocion] = {};
      ultimos12Meses.forEach(mes => {
        ventasPorPromocion[promocion][mes] = {
          ingresados: 0,
          activos: 0,
          anulados: 0,
          total: 0
        };
      });
    }

    ventasPorPromocion[promocion][claveMes].total++;

    if (estado === 1) { // Ingresado
      ventasPorPromocion[promocion][claveMes].ingresados++;
    } else if (estado === 6) { // Activo
      ventasPorPromocion[promocion][claveMes].activos++;
    } else if (estado === 7) { // Anulado
      ventasPorPromocion[promocion][claveMes].anulados++;
    }
  }
});

// Asegurarse de que todas las promociones tengan todos los meses
Object.keys(ventasPorPromocion).forEach(promocion => {
  ultimos12Meses.forEach(mes => {
    if (!ventasPorPromocion[promocion][mes]) {
      ventasPorPromocion[promocion][mes] = {
        ingresados: 0,
        activos: 0,
        anulados: 0,
        total: 0
      };
    }
  });
});

// Ordenar los meses de más reciente a más antiguo
const ventasPorPromocionOrdenado = {};
Object.keys(ventasPorPromocion).forEach(promocion => {
  ventasPorPromocionOrdenado[promocion] = Object.fromEntries(
    Object.entries(ventasPorPromocion[promocion]).sort((a, b) => {
      const fechaA = new Date(a[0].split(' ')[1], nombresMeses.indexOf(a[0].split(' ')[0]));
      const fechaB = new Date(b[0].split(' ')[1], nombresMeses.indexOf(b[0].split(' ')[0]));
      return fechaB - fechaA;
    })
  );
});

statistics.ventasPorPromocion = ventasPorPromocionOrdenado;

  // Ventas por ejecutivo
  const ventasPorEjecutivo = {};
  sales.forEach((venta) => {
      const nombreEjecutivo = venta.executive ? `${venta.executive.first_name} ${venta.executive.last_name}` : 'Ejecutivo desconocido';
    if (!ventasPorEjecutivo[nombreEjecutivo]) {
      ventasPorEjecutivo[nombreEjecutivo] = { ventas: 0 };
    }
    ventasPorEjecutivo[nombreEjecutivo].ventas++;
  });
  statistics.ventasPorEjecutivo = ventasPorEjecutivo;

  // Top ejecutivos
  const topEjecutivos = Object.entries(ventasPorEjecutivo)
    .sort((a, b) => b[1].ventas - a[1].ventas)
    .slice(0, 5);
  statistics.topEjecutivos = topEjecutivos;

  // Ventas por mes
const ventasPorMes = {};

sales.forEach((venta) => {
  const fechaVenta = new Date(venta.created_at);
  if (fechaVenta >= docesMesesAtras) {
    const mesVenta = `${nombresMeses[fechaVenta.getMonth()]} ${fechaVenta.getFullYear()}`;
    const estadoId = venta.sale_status_id;
    const estadoNombre = statusIdToName[estadoId] || 'Otro';

    if (!ventasPorMes[mesVenta]) {
      ventasPorMes[mesVenta] = {
        total: 0,
        ...Object.values(statusIdToName).reduce((acc, estado) => ({...acc, [estado]: 0}), {})
      };
    }
    
    ventasPorMes[mesVenta].total++;
    ventasPorMes[mesVenta][estadoNombre]++;
  }
});

// Asegurarse de que todos los meses estén representados, incluso si no hay ventas
for (let i = 0; i < 12; i++) {
  const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
  const mesKey = `${nombresMeses[fecha.getMonth()]} ${fecha.getFullYear()}`;
  if (!ventasPorMes[mesKey]) {
    ventasPorMes[mesKey] = {
      total: 0,
      ...Object.values(statusIdToName).reduce((acc, estado) => ({...acc, [estado]: 0}), {})
    };
  }
}

// Ordenar los meses de más reciente a más antiguo
const ventasPorMesOrdenado = Object.fromEntries(
  Object.entries(ventasPorMes).sort((a, b) => {
    const fechaA = new Date(a[0].split(' ')[1], nombresMeses.indexOf(a[0].split(' ')[0]));
    const fechaB = new Date(b[0].split(' ')[1], nombresMeses.indexOf(b[0].split(' ')[0]));
    return fechaB - fechaA; // Cambiado el orden de comparación
  })
);

statistics.ventasPorMes = ventasPorMesOrdenado;

    // Calcular el promedio para cada mes
const tiemposDeCierrePorMes = sales.reduce((acumulador, venta) => {
  const fechaCreacion = new Date(venta.created_at);
  
  // Solo procesar ventas de los últimos 12 meses
  if (fechaCreacion < docesMesesAtras || fechaCreacion > fechaActual) {
    return acumulador;
  }

  const mesAñoCreacion = `${fechaCreacion.getFullYear()}-${(fechaCreacion.getMonth() + 1).toString().padStart(2, '0')}`;
  
  if (!acumulador[mesAñoCreacion]) {
    acumulador[mesAñoCreacion] = {
      tiempos: [],
      ventasCerradas: 0,
      ventasIngresadas: 0,
      ventasTotales: 0
    };
  }

  // Incrementar el total de ventas para este mes
  acumulador[mesAñoCreacion].ventasTotales++;

  if (!Array.isArray(venta.saleStatuses) || venta.saleStatuses.length < 2) {
    return acumulador;
  }

  // Verificar si la venta comenzó con estado 1
  const primerEstado = venta.saleStatuses[0];
  if (primerEstado && primerEstado.new_status_id === 1) {
    acumulador[mesAñoCreacion].ventasIngresadas++;

    // Buscar el primer estado 6 (si existe)
    const primerEstado6 = venta.saleStatuses.find(status => status.new_status_id === 6);
    
    if (primerEstado6) {
      const fechaInicio = new Date(primerEstado.modification_date);
      const fechaCierre = new Date(primerEstado6.modification_date);
      if (fechaCierre <= fechaActual) {
        const tiempoCierreHoras = (fechaCierre - fechaInicio) / (1000 * 60 * 60); // Convertir a horas
        
        if (!isNaN(tiempoCierreHoras) && tiempoCierreHoras >= 0) {
          acumulador[mesAñoCreacion].tiempos.push(tiempoCierreHoras);
          acumulador[mesAñoCreacion].ventasCerradas++;
        } else {
          console.log(`Tiempo de cierre inválido para la venta ID: ${venta.sale_id}`);
        }
      }
    }
  }
  
  return acumulador;
}, {});

const promediosTiemposCierrePorMes = Object.entries(tiemposDeCierrePorMes).map(([mes, datos]) => {
  const [año, mesNumero] = mes.split('-');
  const mesNombre = `${nombresMeses[parseInt(mesNumero) - 1]} ${año}`;
  const { tiempos, ventasCerradas, ventasIngresadas, ventasTotales } = datos;
  let promedio = null;
  let unidad = 'horas';

  // Filtrar los tiempos nulos o indefinidos
  const tiemposValidos = tiempos.filter(tiempo => tiempo != null && !isNaN(tiempo));

  if (tiemposValidos.length > 0) {
    const sumaTotal = tiemposValidos.reduce((sum, tiempo) => sum + tiempo, 0);
    promedio = sumaTotal / tiemposValidos.length;
    
    if (promedio >= 24) {
      promedio /= 24;
      unidad = 'días';
    }
    promedio = Number(promedio.toFixed(2));
  } else {
    console.log(` No se pudo calcular el promedio para ${mes}. Tiempos válidos: ${tiemposValidos.length}`);
  }

  return {
    mes: mesNombre,
    promedio,
    unidad,
    ventasCerradas,
    ventasIngresadas,
    ventasTotales
  };
});

// Ordenar los meses de más reciente a más antiguo
promediosTiemposCierrePorMes.sort((a, b) => {
  const fechaA = new Date(a.mes.split(' ')[1], nombresMeses.indexOf(a.mes.split(' ')[0]));
  const fechaB = new Date(b.mes.split(' ')[1], nombresMeses.indexOf(b.mes.split(' ')[0]));
  return fechaB - fechaA;
});

statistics.tiemposDeCierrePorMes = promediosTiemposCierrePorMes;

   //Ventas por mes por horas
const obtenerClaveMesDesdeFecha = (fecha) => {
  const mes = fecha.getMonth();
  const año = fecha.getFullYear();
  return `${nombresMeses[mes]} ${año}`;
};

const ventasPorHoraMes = {};
ultimos12Meses.forEach(mes => {
  ventasPorHoraMes[mes] = Array(24).fill(0);
});

sales.forEach((venta) => {
  const fechaVenta = new Date(venta.created_at);
  
  // Solo procesar ventas de los últimos 12 meses
  if (fechaVenta >= docesMesesAtras && fechaVenta <= hoy) {
    const claveMes = obtenerClaveMes(fechaVenta);
    const horaVenta = fechaVenta.getHours();
    
    ventasPorHoraMes[claveMes][horaVenta]++;
  }
});

// Filtrar meses que no tienen ventas y agregar las horas
const ventasPorHoraMesFiltrado = {};
Object.entries(ventasPorHoraMes).forEach(([claveMes, ventas]) => {
  const fecha = new Date(claveMes);
  const mesNombre = obtenerClaveMesDesdeFecha(fecha);
  if (ventas.some(hora => hora > 0)) {
    ventasPorHoraMesFiltrado[mesNombre] = ventas.map((cantidad, index) => ({
      hora: `${index.toString().padStart(2, '0')}:00`,
      cantidad
    }));
  }
});

// Ordenar los meses de más reciente a más antiguo
const ventasPorHoraMesOrdenado = Object.fromEntries(
  Object.entries(ventasPorHoraMesFiltrado).sort((a, b) => {
    const fechaA = new Date(a[0].split(' ')[1], nombresMeses.indexOf(a[0].split(' ')[0]));
    const fechaB = new Date(b[0].split(' ')[1], nombresMeses.indexOf(b[0].split(' ')[0]));
    return fechaB - fechaA;
  })
);

// Calcular el total de ventas por hora para todos los meses
const ventasPorHoraTotal = Array(24).fill(0).map((_, index) => ({
  hora: `${index.toString().padStart(2, '0')}:00`,
  cantidad: 0
}));

Object.values(ventasPorHoraMesOrdenado).forEach(mes => {
  mes.forEach((venta, hora) => {
    ventasPorHoraTotal[hora].cantidad += venta.cantidad;
  });
});

statistics.ventasPorHoraMes = ventasPorHoraMesOrdenado;
statistics.ventasPorHoraTotal = ventasPorHoraTotal;

    res.json(statistics);

  } catch (error) {
  console.error('Error obteniendo estadisticas', error);
  res.status(500).json({ message: 'Error obteniendo estadisticas', error: error.message });
  };
};

export default getDashboardStats;
// DashboardStats.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faMapMarkerAlt, faCheckCircle, faBriefcase, faCalendarAlt, faClock, faDollarSign } from '@fortawesome/free-solid-svg-icons';

const jornadas = [
  { nombre: "Madrugada", horas: [0, 1, 2, 3, 4, 5] },
  { nombre: "Mañana", horas: [6, 7, 8, 9, 10, 11] },
  { nombre: "Tarde", horas: [12, 13, 14, 15, 16, 17] },
  { nombre: "Noche", horas: [18, 19, 20, 21, 22, 23] }
];

const DashboardStats = ({ stats, showMore, setShowMore, showAllCards, setShowAllCards }) => {
  if (!stats) return <div>Cargando...</div>;

  return (
    <>
      <h2 style={{color: '#99235C', textAlign: 'center'}}>Dashboard de Ventas</h2>
      <div className='stats-grid'>  
        <div className='card'>
          <FontAwesomeIcon icon={faShoppingCart} size="2x" className='icon'/>
          <div>
            <h3>Total Ventas</h3>
            <h4 className="total-sales">{stats.totalSales} ventas</h4>
            <p className="ventas-mes-mensaje">{stats.mensajeVentasMes}</p>
          </div>
        </div>

        <div className='card'>
          <FontAwesomeIcon icon={faMapMarkerAlt} size="2x" className='icon'/>
          <div>
            <h3>Ventas por Región</h3>
            <div className={`region-grid ${showMore ? 'show-more' : ''}`}>
              {Object.entries(stats.ventasPorRegion)
                .sort(([,a], [,b]) => b.total - a.total)
                .slice(0, showMore ? undefined : 1)
                .map(([region, data], index) => (
                  <div key={region} className={`region-item ${index < 3 ? `top-${index + 1}` : ''}`}>
                    <h4>{region}</h4>
                    <div className="region-info">
                      <span className="total">Total: {data.total}</span>
                    </div>
                    <div className="region-details">
                      <span className="ingresadas">Ingresadas: {data.ingresadas}</span><br/>
                      <span className="activas">Activas: {data.activas}</span>
                    </div>
                  </div>
                ))}
            </div>
            {Object.entries(stats.ventasPorRegion).length > 1 && (
              <button onClick={() => setShowMore(!showMore)} className="ver-mas-btn">
                {showMore ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </div>
        </div>

        <div className='card'>
          <FontAwesomeIcon icon={faCheckCircle} size="2x" className='icon'/>
          <div>
            <h3>Ventas por Estado</h3>
            {Object.entries(stats.ventasPorEstado).filter(([estado, cantidad]) => cantidad > 0).map(([estado, cantidad]) => (
              <p key={estado}>
                <span className={estado.toLowerCase().replace(/\s+/g, '-')}>{estado}</span>: {cantidad}
              </p>
            ))}
            {showMore && (
              <div className={`estado-grid ${showMore ? 'show-more' : ''}`}>
                <h4>Ventas por Estado por Mes</h4>
                {Object.entries(stats.ventasPorEstadoPorMes).filter(([mes, estados]) => Object.values(estados).some(cantidad => cantidad > 0)).map(([mes, estados]) => (
                  <div key={mes}>
                    <h5>{mes}</h5>
                    {Object.entries(estados).filter(([estado, cantidad]) => cantidad > 0).map(([estado, cantidad]) => (
                      <p key={estado}>
                        <span className={estado.toLowerCase().replace(/\s+/g, '-')}>{estado}</span>: {cantidad}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {stats.ventasPorEstadoPorMes && Object.keys(stats.ventasPorEstadoPorMes).length > 0 && (
              <button onClick={() => setShowMore(!showMore)} className="ver-mas-btn">
                {showMore ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </div>
        </div>

        <div className={`card ${showMore ? 'show-more' : ''}`}>
          <FontAwesomeIcon icon={faBriefcase} size="2x" className='icon'/>
          <div>
            <h3>Ventas por Empresa</h3>
            <div className="empresa-grid" style={{ maxHeight: '200px', overflowY: showMore ? 'auto' : 'hidden' }}>
              {Object.entries(stats.ventasPorEmpresaMes).map(([empresa, datos]) => (
                <div key={empresa} className="empresa-item">
                  <h4>{empresa}</h4>
                  {Object.entries(datos)
                    .filter(([mes, valores]) => valores.total > 0)
                    .map(([mes, valores]) => (
                      <div key={mes} className="mes-data">
                        <div className="mes-info">
                          <span className="mes-titulo">{mes.slice(0, 3)} '{mes.slice(-2)}: </span>
                        </div>
                        <div className="detalles-info">
                          <span className="ingresadas">Ingresadas: {valores.Ingresada}</span><br/>
                          <span className="nuevas">Nuevas: {valores.Nueva}</span><br/>
                          <span className="enRevision">En revisión: {valores.EnRevisión}</span><br/>
                          <span className="correccionRequerida">Corrección requerida: {valores.CorrecciónRequerida}</span><br/>
                          <span className="pendiente">Pendiente: {valores.Pendiente}</span><br/>
                          <span className="activas">Activos: {valores.Activo}</span><br/>
                          <span className="anuladas">Anuladas: {valores.Anulado}</span>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
            {Object.keys(stats.ventasPorEmpresaMes).length > 1 && (
              <button onClick={() => setShowMore(!showMore)} className="ver-mas-btn">
                {showMore ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </div>
        </div>

        {showAllCards && (
          <>
            <div className='card'>
              <FontAwesomeIcon icon={faCalendarAlt} size="2x" className='icon'/>
              <div>
                <h3>Ventas ingresadas por Mes</h3>
                <div className={`meses-container ${showMore ? 'show-more' : ''}`}>
                  {Object.entries(stats.ventasPorMes)
                    .filter(([_, cantidad]) => cantidad.total > 0)
                    . map(([mesAno, cantidad]) => {
                      const [mes, ano] = mesAno.split(' ');
                      const mesAbreviado = mes.slice(0, 3);
                      const anoAbreviado = ano.slice(2);
                      return (
                        <div key={mesAno} className="mes-item">
                          <h4>{`${mesAbreviado} '${anoAbreviado}`}</h4>
                          <div className="mes-info">
                            <span className="total">Total: {cantidad.total}</span>
                          </div>
                          <div className="mes-details">
                            <span className="ingresadas">Ingresadas: {cantidad.Ingresada}</span><br/>
                            <span className="nuevas">Nuevas: {cantidad.Nueva}</span><br/>
                            <span className="enRevision">En revisión: {cantidad['En revisión']}</span><br/>
                            <span className="correccionRequerida">Corrección requerida: {cantidad['Corrección requerida']}</span><br/>
                            <span className="pendiente">Pendiente: {cantidad.Pendiente}</span><br/>
                            <span className="activas">Activos: {cantidad.Activo}</span><br/>
                            <span className="anuladas">Anuladas: {cantidad.Anulado}</span>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
                {Object.keys(stats.ventasPorMes).length > 1 && (
                  <button onClick={() => setShowMore(!showMore)} className="ver-mas-btn">
                    {showMore ? 'Ver menos' : 'Ver más'}
                  </button>
                )}
              </div>
            </div>

            <div className='card'>
              <FontAwesomeIcon icon={faClock} size="2x" className='icon'/>
              <div>
                <h3>Tiempo Promedio de Cierre</h3>
                <div className={`tiempo-container ${showMore ? 'show-more' : ''}`}>
                  {stats.tiemposDeCierrePorMes.slice(0, showMore ? stats.tiemposDeCierrePorMes.length : 1).map((dato) => (
                    <div key={dato.mes} className="dato">
                      <h4>{dato.mes}</h4>
                      <h2 className="promedio">{dato.promedio !== null ? `${dato.promedio} ${dato.unidad}` : 'N/A'}</h2>
                      <div className="detalles">
                        <span>Ingresadas: {dato.ventasIngresadas} ventas</span><br/>
                        <span>Cerradas: {dato.ventasCerradas} ventas</span>
                      </div>
                    </div>
                  ))}
                </div>
                {stats.tiemposDeCierrePorMes.length > 1 && (
                  <button onClick={() => setShowMore(!showMore)} className="ver-mas-btn">
                    {showMore ? 'Ver menos' : 'Ver más'}
                  </button>
                )}
              </div>
            </div>

            <div className='card'>
              <FontAwesomeIcon icon={faDollarSign} size="2x" className='icon'/>
              <div>
                <h3>Ventas por Promoción</h3>
                <div className={`promociones-container ${showMore ? 'show-more' : ''}`}>
                  {Object.entries(stats.ventasPorPromocion)
                    .filter(([_, datos]) => Object.values(datos).some(estadisticas => estadisticas.total > 0))
                    .slice(0, showMore ? Object.entries(stats.ventasPorPromocion).length : 1)
                    .map(([promocion, datos]) => (
                    <div key={promocion} className="promocion-item">
                      <h4>{promocion}</h4>
                      <div className="detalles">
                        {Object.entries(datos)
                          .filter(([_, estadisticas]) => estadisticas.total > 0)
                          .slice(0, showMore ? Object.entries(datos).length : 1)
                          .map(([mes, estadisticas]) => (
                            <div key={mes} className="mes-estadisticas">
                              <br/>
                              <span style={{ display: 'block', marginTop: 0 }}>{mes}</span>
                              <span>Total: {estadisticas.total}</span><br/>
                              <span>Activos: {estadisticas.activos}</span><br/>
                              <span>Ingresados: {estadisticas.ingresados}</span><br/>
                              <span>Anulados: {estadisticas.anulados}</span><br/>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
                {(Object.entries(stats.ventasPorPromocion)
                  .filter(([_, datos]) => Object.values(datos).some(estadisticas => estadisticas.total > 0))
                  .length > 1 ||
                Object.values(stats.ventasPorPromocion).some(datos => 
                  Object.values(datos).filter(estadisticas => estadisticas.total > 0).length > 1
                )) && (
                  <button onClick={() => setShowMore(!showMore)} className="ver-mas-btn">
                    {showMore ? 'Ver menos' : 'Ver más'}
                  </button>
                )}
              </div>
            </div>
          
            <div className='card ventas-por-jornada'>
              <FontAwesomeIcon icon={faClock} size="2x" className='icon'/>
              <h3>Ventas ingresadas por Hora</h3>
              <div className={`jornadas-container ${showMore ? 'show-more' : ''}`}>
                <div className="mes-jornada">
                  <h4>Total</h4>
                  {jornadas.map((jornada) => (
                    <div key={jornada.nombre} className="jornada">
                      <div className="horas-container">
                        {jornada.horas.map((hora) => {
                          const horaData = stats.ventasPorHoraTotal.find(h => h.hora.startsWith(hora.toString().padStart(2, '0')));
                          return (
                            <span key={hora} className="hora-item">
                              <span className="hora">{hora.toString().padStart(2, '0')}:00</span>
                              <span className="ventas">{horaData ? horaData.cantidad : 0}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {showMore && (
                  <div className="meses-scroll">
                    {Object.entries(stats.ventasPorHoraMes).map(([mes, horas]) => (
                      <div key={mes} className="mes-jornada">
                        <h4>{mes}</h4>
                        {jornadas.map((jornada) => (
                          <div key={`${mes}-${jornada.nombre}`} className="jornada">
                            <div className="horas-container">
                              {jornada.horas.map((hora) => {
                                const horaData = horas.find(h => h.hora.startsWith(hora.toString().padStart(2, '0')));
                                return (
                                  <span key={`${mes}-${hora}`} className="hora-item">
                                    <span className="hora">{hora.toString().padStart(2, '0')}:00: </span>
                                    <span className="ventas">{horaData ? horaData.cantidad : 0}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setShowMore(!showMore)} className="ver-mas-btn">
                {showMore ? 'Ver menos' : 'Ver más'}
              </button>
            </div>
          </>
        )}
      </div>
      <button onClick={() => setShowAllCards(!showAllCards)} className="ver-mas-btn">
        {showAllCards ? 'Ver menos' : 'Más estadísticas'}
      </button>
    </>
  );
};

export default DashboardStats;
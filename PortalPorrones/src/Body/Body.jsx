import './Body.css'

function Body() {
  return (
    <main className="body">
      <div className="body-content" id="horarios">
        <h2>Horarios de Trabajadores</h2>
        <div className="schedule-table">
          <table>
            <thead>
              <tr>
                <th>Trabajador</th>
                <th>Lunes - Martes</th>
                <th>Jueves - Viernes</th>
                <th>Sabado</th>
                <th>Domingo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Trabajador 1</td>
                <td className="cell-rojo">Abrir</td>
                <td className="cell-rojo">Abrir</td>
                <td className="cell-verde">Partir</td>
                <td className="cell-rojo">Abrir</td>
              </tr>
              <tr>
                <td>Trabajador 2</td>
                <td className="cell-verde">Partir</td>
                <td className="cell-verde">Partir</td>
                <td className="cell-verde">Partir</td>
                <td className="cell-verde">Partir</td>
              </tr>
              <tr>
                <td>Trabajador 3</td>
                <td className="cell-verde">Partir</td>
                <td className="cell-verde">Partir</td>
                <td className="cell-verde">Partir</td>
                <td className="cell-verde">Partir</td>
              </tr>
              <tr>
                <td>Trabajador 4</td>
                <td className="cell-verde">Partir</td>
                <td className="cell-verde">Partir</td>
                <td className="cell-verde">Partir</td>
                <td className="cell-verde">Partir</td>
              </tr>
              <tr>
                <td>Trabajador 5</td>
                <td className="cell-amarillo">Cerrar</td>
                <td className="cell-amarillo">Cerrar</td>
                <td className="cell-amarillo">Cerrar</td>
                <td className="cell-amarillo">Cerrar</td>
              </tr>
              <tr>
                <td>Trabajador 6</td>
                <td className="cell-amarillo">Cerrar</td>
                <td className="cell-amarillo">Cerrar</td>
                <td className="cell-amarillo">Cerrar</td>
                <td className="cell-amarillo">Cerrar</td>
              </tr>
            </tbody>
          </table>
        </div>
          <div className="color-legend-container">
            <div className="color-legend">
          <span className="legend-item">
            <span className="legend-color cell-rojo"></span>
            9am-5pm
          </span>
          <span className="legend-item">
            <span className="legend-color cell-verde"></span>
            12:30-4:30; 8:30pm-...
          </span>
          <span className="legend-item">
            <span className="legend-color cell-amarillo"></span>
            6:00pm-...
          </span>
        </div>
          </div>
        </div>
        <button className="pdf-button" onClick={() => window.print()}>
          Descargar PDF
        </button>
        <div className="inventario" id="inventario">
          <h2>Inventario</h2>
          <p>Proximamente...</p>
        </div>

        <div className="reservas" id="reservas">
          <h2>Reservas</h2>
          <p>Proximamente...</p>
        </div>
      </div>
    </main>
  )
}

export default Body
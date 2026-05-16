import './Body.css'
import Inventario from '../Inventario/Inventario.jsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const trabajadores = [
  { nombre: 'Trabajador 1', lunesMartes: 'Abrir', juevesViernes: 'Abrir', sabado: 'Partir', domingo: 'Abrir' },
  { nombre: 'Trabajador 2', lunesMartes: 'Partir', juevesViernes: 'Partir', sabado: 'Partir', domingo: 'Partir' },
  { nombre: 'Trabajador 3', lunesMartes: 'Partir', juevesViernes: 'Partir', sabado: 'Partir', domingo: 'Partir' },
  { nombre: 'Trabajador 4', lunesMartes: 'Partir', juevesViernes: 'Partir', sabado: 'Partir', domingo: 'Partir' },
  { nombre: 'Trabajador 5', lunesMartes: 'Cerrar', juevesViernes: 'Cerrar', sabado: 'Cerrar', domingo: 'Cerrar' },
  { nombre: 'Trabajador 6', lunesMartes: 'Cerrar', juevesViernes: 'Cerrar', sabado: 'Cerrar', domingo: 'Cerrar' },
];

function generarPDFHorarios() {
  const fecha = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const doc = new jsPDF();

  doc.setFillColor(52, 58, 64);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PORTAL PORRONES', 14, 18);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Horarios de Trabajadores', 14, 26);

  doc.setFontSize(10);
  doc.text(`Fecha: ${fecha}`, 140, 18);

  doc.setTextColor(52, 58, 64);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Horario de Trabajo', 14, 48);

  const tableData = trabajadores.map(t => [
    t.nombre,
    t.lunesMartes,
    t.juevesViernes,
    t.sabado,
    t.domingo
  ]);

  doc.autoTable({
    head: [['Trabajador', 'Lunes - Martes', 'Jueves - Viernes', 'Sábado', 'Domingo']],
    body: tableData,
    startY: 55,
    headStyles: { 
      fillColor: [52, 58, 64],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    bodyStyles: { fontSize: 10 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didParseCell: function(data) {
      if (data.column.index > 0 && data.cell.raw === 'Abrir') {
        data.cell.styles.textColor = [220, 53, 69];
        data.cell.styles.fontStyle = 'bold';
      } else if (data.column.index > 0 && data.cell.raw === 'Partir') {
        data.cell.styles.textColor = [40, 167, 69];
        data.cell.styles.fontStyle = 'bold';
      } else if (data.column.index > 0 && data.cell.raw === 'Cerrar') {
        data.cell.styles.textColor = [255, 193, 7];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Portal Porrones - Gestión de Horarios', 14, finalY);

  doc.save(`horarios_trabajadores_${new Date().toISOString().split('T')[0]}.pdf`);
}

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
          <button className="pdf-button" onClick={generarPDFHorarios}>
            Descargar PDF
          </button>
        </div>
        <div className="inventario" id="inventario">
          <Inventario />
        </div>
      </div>
    </main>
  )
}

export default Body
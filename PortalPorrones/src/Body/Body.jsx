import { useState, useEffect } from 'react'
import axios from 'axios'
import './Body.css'
import { useAuth } from '../hooks/useAuth.js'

const API_URL = import.meta.env.VITE_API_URL || 'https://portalporrones-backend-production.up.railway.app/api/productos'

const TURNOS = ['Abrir', '1er Partido', '2do Partido', '3er Partido', 'Cerrar']

const TURNOS_COLORES = {
  'Abrir': [200, 50, 50],
  '1er Partido': [50, 160, 80],
  '2do Partido': [130, 50, 200],
  '3er Partido': [0, 170, 170],
  'Cerrar': [40, 100, 200],
}

const TURNOS_HORARIOS = {
  'Abrir': '9:00 AM - 5:00 PM',
  '1er Partido': '11:00 AM - 3:00 PM / 7:00 PM - Cierre',
  '2do Partido': '2:00 PM - 5:00 PM / 8:00 PM - Cierre',
  '3er Partido': '9:00 AM - 2:00 PM / 6:30 PM - Cierre',
  'Cerrar': '6:30 PM - Cierre',
}

const DIAS = ['lunes', 'martes', 'jueves', 'viernes', 'sabadoDomingo']

const TRABAJADORES_POR_DEFECTO = [
  { nombre: 'Santiago', lunes: '1er Partido', martes: '2do Partido', jueves: 'Abrir', viernes: '2do Partido', sabadoDomingo: 'Abrir' },
  { nombre: 'Marvel', lunes: 'Cerrar', martes: '3er Partido', jueves: '2do Partido', viernes: '1er Partido', sabadoDomingo: 'Abrir' },
  { nombre: 'Zulay', lunes: 'Abrir', martes: '2do Partido', jueves: '2do Partido', viernes: 'Cerrar', sabadoDomingo: 'Abrir' },
  { nombre: 'Luis', lunes: '2do Partido', martes: '2do Partido', jueves: '1er Partido', viernes: 'Abrir', sabadoDomingo: 'Abrir' },
  { nombre: 'Alejo', lunes: '2do Partido', martes: '3er Partido', jueves: 'Cerrar', viernes: '2do Partido', sabadoDomingo: 'Abrir' },
  { nombre: 'Vacante', lunes: 'Cerrar', martes: 'Cerrar', jueves: 'Cerrar', viernes: 'Cerrar', sabadoDomingo: 'Cerrar' },
]

function claseTurno(turno) {
  switch (turno) {
    case 'Abrir': return 'cell-rojo'
    case '1er Partido': return 'cell-verde'
    case '2do Partido': return 'cell-purpura'
    case '3er Partido': return 'cell-cian'
    case 'Cerrar': return 'cell-azul'
    default: return ''
  }
}

function Body() {
  const { autenticado, passwordInput, error, setPasswordInput, handleLogin, handleLogout } = useAuth()
  const [sincronizando, setSincronizando] = useState(false)
  const [ultimaSync, setUltimaSync] = useState(null)
  const [selectedWorkerIdx, setSelectedWorkerIdx] = useState(-1)

  const [trabajadores, setTrabajadores] = useState(() => {
    try {
      const guardado = localStorage.getItem('portalPorronesHorarios')
      if (guardado) return JSON.parse(guardado)
    } catch {}
    return TRABAJADORES_POR_DEFECTO
  })

  useEffect(() => {
    cargarDesdeAPI().then(hayRemoto => {
      if (!hayRemoto) {
        guardarEnAPI(TRABAJADORES_POR_DEFECTO)
      }
    })
  }, [])

  function encodeTrabajadores(lista) {
    return lista.map(t =>
      `${t.nombre}|${t.lunes}|${t.martes}|${t.jueves}|${t.viernes}|${t.sabadoDomingo}`
    )
  }

  function decodeTrabajadores(entries) {
    return entries.map(entry => {
      const parts = entry.split('|')
      return {
        nombre: parts[0],
        lunes: parts[1],
        martes: parts[2],
        jueves: parts[3],
        viernes: parts[4],
        sabadoDomingo: parts[5],
      }
    })
  }

  async function cargarDesdeAPI() {
    try {
      const res = await axios.get(API_URL)
      const horarios = res.data.filter(p => p.categoria === 'horarios')
      if (horarios.length > 0) {
        const datos = decodeTrabajadores(horarios.map(h => h.nombre))
        setTrabajadores(datos)
        localStorage.setItem('portalPorronesHorarios', JSON.stringify(datos))
        setUltimaSync(new Date())
        return true
      }
    } catch (err) {
      console.error('Error al cargar horarios remotos:', err)
    }
    return false
  }

  async function guardarEnAPI(datos) {
    setSincronizando(true)
    try {
      const res = await axios.get(API_URL)
      const existentes = res.data.filter(p => p.categoria === 'horarios')

      await Promise.all(existentes.map(e => axios.delete(`${API_URL}/${e.id}`)))

      const encoded = encodeTrabajadores(datos)
      await Promise.all(encoded.map(nombre =>
        axios.post(API_URL, { nombre, cantidad: 1, categoria: 'horarios' })
      ))

      setUltimaSync(new Date())
    } catch (err) {
      console.error('Error al sincronizar horarios:', err)
    } finally {
      setSincronizando(false)
    }
  }

  function guardar(nuevos) {
    setTrabajadores(nuevos)
    localStorage.setItem('portalPorronesHorarios', JSON.stringify(nuevos))
    guardarEnAPI(nuevos)
  }

  function cambiarTurno(idx, dia, valor) {
    const copia = trabajadores.map(t => ({ ...t }))
    copia[idx][dia] = valor
    guardar(copia)
  }

  function cambiarNombre(idx, valor) {
    const copia = trabajadores.map(t => ({ ...t }))
    copia[idx].nombre = valor
    guardar(copia)
  }

  function agregarTrabajador() {
    const vacio = { nombre: 'Nuevo', lunes: 'Abrir', martes: 'Abrir', jueves: 'Abrir', viernes: 'Abrir', sabadoDomingo: 'Abrir' }
    guardar([...trabajadores, vacio])
  }

  function eliminarTrabajador(idx) {
    if (trabajadores.length <= 1) return
    const copia = trabajadores.filter((_, i) => i !== idx)
    guardar(copia)
  }

  function resetear() {
    if (!confirm('¿Resetear todos los horarios a los valores por defecto?')) return
    guardar(TRABAJADORES_POR_DEFECTO)
  }

  async function generarPDFIndividual(trabajador) {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    const fecha = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const doc = new jsPDF()

    doc.setFillColor(52, 58, 64)
    doc.rect(0, 0, 210, 38, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('PORTAL PORRONES', 14, 20)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Horario de Trabajador', 14, 28)

    doc.setFontSize(9)
    doc.text(`Fecha: ${fecha}`, 140, 20)

    doc.setTextColor(108, 92, 231)
    doc.setFontSize(26)
    doc.setFont('helvetica', 'bold')
    doc.text(trabajador.nombre.toUpperCase(), 14, 60)

    doc.setTextColor(136, 136, 170)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Horario Semanal', 14, 68)

    const diasCompletos = {
      lunes: 'Lunes',
      martes: 'Martes',
      jueves: 'Jueves',
      viernes: 'Viernes',
      sabadoDomingo: 'Sábado y Domingo'
    }

    const diasAbbrev = {
      lunes: 'Lun',
      martes: 'Mar',
      jueves: 'Jue',
      viernes: 'Vie',
      sabadoDomingo: 'Sáb/Dom'
    }

    const tableData = DIAS.map(dia => [diasCompletos[dia], trabajador[dia]])

    autoTable(doc, {
      head: [['Día', 'Turno']],
      body: tableData,
      startY: 76,
      headStyles: {
        fillColor: [52, 58, 64],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: { fontSize: 11 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 80 }
      },
      didParseCell: function(data) {
        if (data.column.index === 1) {
          const color = TURNOS_COLORES[data.cell.raw]
          if (color) {
            data.cell.styles.textColor = color
            data.cell.styles.fontStyle = 'bold'
          }
        }
      }
    })

    const legendY = doc.lastAutoTable.finalY + 18

    doc.setDrawColor(108, 92, 231)
    doc.setLineWidth(0.5)
    doc.line(14, legendY, 196, legendY)

    doc.setTextColor(52, 58, 64)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Referencia de Turnos', 14, legendY + 10)

    let y = legendY + 22
    doc.setFontSize(10)

    TURNOS.forEach(turno => {
      const color = TURNOS_COLORES[turno]
      const horario = TURNOS_HORARIOS[turno]
      const nombreTurno = `${turno}:`

      doc.setFillColor(color[0], color[1], color[2])
      doc.circle(18, y - 2, 2.5, 'F')

      doc.setTextColor(color[0], color[1], color[2])
      doc.setFont('helvetica', 'bold')
      doc.text(nombreTurno, 26, y)

      doc.setTextColor(100, 100, 120)
      doc.setFont('helvetica', 'normal')
      const nombreW = doc.getTextWidth(nombreTurno)
      doc.text(horario, 26 + nombreW + 3, y)

      y += 8
    })

    const footerY = Math.max(y + 12, legendY + 70)
    doc.setDrawColor(52, 58, 64)
    doc.setLineWidth(0.3)
    doc.line(14, footerY, 196, footerY)

    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.setFont('helvetica', 'normal')
    doc.text('Portal Porrones - Gestión de Horarios', 14, footerY + 8)
    doc.text('Página 1', 185, footerY + 8)

    doc.save(`horario_${trabajador.nombre.toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  async function generarPDFHorarios() {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    const fecha = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const doc = new jsPDF()

    doc.setFillColor(52, 58, 64)
    doc.rect(0, 0, 210, 38, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('PORTAL PORRONES', 14, 20)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Horarios de Trabajadores', 14, 28)

    doc.setFontSize(9)
    doc.text(`Fecha: ${fecha}`, 140, 20)

    doc.setTextColor(52, 58, 64)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Horario de Trabajo', 14, 52)

    const tableData = trabajadores.map(t => [
      t.nombre, t.lunes, t.martes, t.jueves, t.viernes, t.sabadoDomingo
    ])

    autoTable(doc, {
      head: [['Trabajador', 'Lunes', 'Martes', 'Jueves', 'Viernes', 'Sábado y Domingo']],
      body: tableData,
      startY: 60,
      headStyles: {
        fillColor: [52, 58, 64],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didParseCell: function(data) {
        if (data.column.index > 0) {
          const color = TURNOS_COLORES[data.cell.raw]
          if (color) {
            data.cell.styles.textColor = color
            data.cell.styles.fontStyle = 'bold'
          }
        }
      }
    })

    const tableEndY = doc.lastAutoTable.finalY + 15

    doc.setDrawColor(108, 92, 231)
    doc.setLineWidth(0.5)
    doc.line(14, tableEndY, 196, tableEndY)

    let ly = tableEndY + 10
    doc.setFontSize(9)
    doc.setTextColor(52, 58, 64)
    doc.setFont('helvetica', 'bold')
    doc.text('Referencia de Turnos', 14, ly)
    ly += 8

    TURNOS.forEach(turno => {
      const color = TURNOS_COLORES[turno]
      const horario = TURNOS_HORARIOS[turno]

      doc.setFillColor(color[0], color[1], color[2])
      doc.circle(16, ly - 2, 2, 'F')

      doc.setTextColor(color[0], color[1], color[2])
      doc.setFont('helvetica', 'bold')
      const turnoLabel = `${turno}:`
      doc.text(turnoLabel, 22, ly)

      doc.setTextColor(100, 100, 120)
      doc.setFont('helvetica', 'normal')
      const tw = doc.getTextWidth(turnoLabel)
      doc.text(horario, 22 + tw + 2, ly)
      ly += 7
    })

    const finalY = ly + 10
    doc.setDrawColor(52, 58, 64)
    doc.setLineWidth(0.3)
    doc.line(14, finalY, 196, finalY)

    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.setFont('helvetica', 'normal')
    doc.text('Portal Porrones - Gestión de Horarios', 14, finalY + 8)
    doc.text('Página 1', 185, finalY + 8)

    doc.save(`horarios_trabajadores_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  async function handleDownloadPDF() {
    if (selectedWorkerIdx === -1) {
      await generarPDFHorarios()
    } else {
      await generarPDFIndividual(trabajadores[selectedWorkerIdx])
    }
  }

  return (
    <main className="body">
      <div className="body-content" id="horarios">
        <h2>Horarios de Trabajadores</h2>

        <div className="sync-status">
          {sincronizando ? (
            <span className="sync-syncing">
              <span className="sync-spinner"></span>
              Sincronizando...
            </span>
          ) : ultimaSync ? (
            <span className="sync-ok">✓ Sincronizado {ultimaSync.toLocaleTimeString()}</span>
          ) : null}
        </div>

        {autenticado && (
          <div className="schedule-actions">
            <button className="action-btn" onClick={handleLogout}>Cerrar Sesión</button>
            <button className="action-btn" onClick={agregarTrabajador}>+ Agregar Trabajador</button>
            <button className="action-btn reset-btn" onClick={resetear}>Resetear</button>
          </div>
        )}

        {!autenticado && (
          <form onSubmit={handleLogin} className="schedule-login">
            <input
              type="password"
              placeholder="Contraseña para editar"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              className="password-input"
            />
            <button type="submit" className="action-btn">Editar Horarios</button>
            {error && <p className="error-msg">{error}</p>}
          </form>
        )}

        <div className="schedule-table">
          <table>
            <thead>
              <tr>
                <th>Trabajador</th>
                <th>Lunes</th>
                <th>Martes</th>
                <th>Jueves</th>
                <th>Viernes</th>
                <th>Sábado y Domingo</th>
                {autenticado && <th></th>}
              </tr>
            </thead>
            <tbody>
              {trabajadores.map((t, idx) => (
                <tr key={idx}>
                  {autenticado ? (
                    <>
                      <td data-label="Trabajador">
                        <input
                          className="nombre-input"
                          value={t.nombre}
                          onChange={e => cambiarNombre(idx, e.target.value)}
                          aria-label="Nombre del trabajador"
                        />
                      </td>
                      {DIAS.map(dia => (
                        <td key={dia} data-label={dia === 'sabadoDomingo' ? 'Sáb y Dom' : dia.charAt(0).toUpperCase() + dia.slice(1)} className={claseTurno(t[dia])}>
                          <select
                            className="turno-select"
                            value={t[dia]}
                            onChange={e => cambiarTurno(idx, dia, e.target.value)}
                            aria-label={`Turno ${dia === 'sabadoDomingo' ? 'Sábado y Domingo' : dia}`}
                          >
                            {TURNOS.map(op => (
                              <option key={op} value={op}>{op}</option>
                            ))}
                          </select>
                        </td>
                      ))}
                      <td>
                        <button className="delete-btn" onClick={() => eliminarTrabajador(idx)} aria-label={`Eliminar ${t.nombre}`}>X</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td data-label="Trabajador">{t.nombre}</td>
                      {DIAS.map(dia => (
                        <td key={dia} data-label={dia === 'sabadoDomingo' ? 'Sáb y Dom' : dia.charAt(0).toUpperCase() + dia.slice(1)} className={claseTurno(t[dia])}>{t[dia]}</td>
                      ))}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="color-legend-container">
          <div className="color-legend">
            <span className="legend-item">
              <span className="legend-color cell-rojo"></span>
              Abrir (9-5pm)
            </span>
            <span className="legend-item">
              <span className="legend-color cell-verde"></span>
              1er Partido (11-3; 7-...)
            </span>
            <span className="legend-item">
              <span className="legend-color cell-purpura"></span>
              2do Partido (2-5; 8-...)
            </span>
            <span className="legend-item">
              <span className="legend-color cell-cian"></span>
              3er Partido (9-2; 18:30-...)
            </span>
            <span className="legend-item">
              <span className="legend-color cell-azul"></span>
              Cerrar (6:30-...)
            </span>
          </div>
          <div className="pdf-download-group">
            <select
              className="worker-select"
              value={selectedWorkerIdx}
              onChange={e => setSelectedWorkerIdx(Number(e.target.value))}
            >
              <option value={-1}>Todos los trabajadores</option>
              {trabajadores.map((t, i) => (
                <option key={i} value={i}>{t.nombre}</option>
              ))}
            </select>
            <button className="pdf-button" onClick={handleDownloadPDF}>
              Descargar PDF
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Body

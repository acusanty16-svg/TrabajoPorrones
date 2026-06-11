import { useState, useEffect } from 'react';
import axios from 'axios';
import './Inventario.css';
import { useAuth } from '../hooks/useAuth.js';

const API_URL = import.meta.env.VITE_API_URL || 'https://portalporrones-backend-production.up.railway.app/api/productos';

function Inventario() {
  const { autenticado, passwordInput, error, setPasswordInput, handleLogin, handleLogout } = useAuth();
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    cantidad: '',
    categoria: ''
  });
  const [editando, setEditando] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [sinStockIds, setSinStockIds] = useState(() => {
    try {
      const guardado = localStorage.getItem('portalPorronesSinStock');
      return guardado ? JSON.parse(guardado) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('portalPorronesSinStock', JSON.stringify(sinStockIds));
  }, [sinStockIds]);

  useEffect(() => {
    if (autenticado) {
      fetchProductos();
    }
  }, [autenticado]);

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => {
        setMensaje('');
        setTipoMensaje('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const fetchProductos = async () => {
    setCargando(true);
    try {
      const res = await axios.get(API_URL);
      setProductos(res.data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      showMensaje('Error al cargar productos', 'error');
    } finally {
      setCargando(false);
    }
  };

  const showMensaje = (texto, tipo) => {
    setMensaje(texto);
    setTipoMensaje(tipo);
  };

  const exportarPDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    const fecha = new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const hora = new Date().toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const doc = new jsPDF();

    const productosAExportar = filtroCategoria 
      ? productos.filter(p => p.categoria === filtroCategoria)
      : productos;

    const titulo = filtroCategoria 
      ? `${filtroCategoria === 'bebidas' ? 'Bebidas' : filtroCategoria === 'destilados' ? 'Destilados' : 'Postres'} - Inventario`
      : 'Inventario General';

    const totalStock = productosAExportar.reduce((acc, p) => acc + getCantidad(p), 0);
    const sinStock = productosAExportar.filter(p => isSinStock(p.id) || getCantidad(p) <= 1).length;
    const stockMedio = productosAExportar.filter(p => !isSinStock(p.id) && getCantidad(p) === 2).length;

    doc.setFillColor(52, 58, 64);
    doc.rect(0, 0, 210, 45, 'F');

    doc.setFillColor(108, 92, 231);
    doc.rect(0, 45, 210, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('PORTAL PORRONES', 14, 22);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Inventario y Gestión de Productos', 14, 32);
    
    doc.setFontSize(9);
    doc.text(`Fecha: ${fecha}  |  ${hora}`, 140, 22);

    doc.setTextColor(52, 58, 64);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo, 14, 60);

    doc.setDrawColor(108, 92, 231);
    doc.setLineWidth(0.3);
    doc.line(14, 65, 196, 65);

    let resumenY = 74;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.setTextColor(52, 58, 64);
    doc.text(`Total de productos:`, 14, resumenY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${productosAExportar.length}`, 68, resumenY);

    doc.setFont('helvetica', 'normal');
    doc.text(`Stock total:`, 14, resumenY + 7);
    doc.setFont('helvetica', 'bold');
    doc.text(`${totalStock}`, 68, resumenY + 7);



    const tableData = productosAExportar.map(p => {
      const categoria = p.categoria === 'bebidas' ? 'Bebidas' : p.categoria === 'destilados' ? 'Destilados' : p.categoria === 'postre' ? 'Postre' : '-';
      const cantidad = getCantidad(p);
      let estado;
      if (isSinStock(p.id) || cantidad <= 1) estado = 'Sin stock';
      else if (cantidad === 2) estado = 'Stock bajo';
      else estado = 'Normal';
      return [p.nombre, cantidad.toString(), categoria, estado];
    });

    const MARGEN_IZQ = 14;
    const ANCHO_DISP = 182;

    autoTable(doc, {
      head: [['Nombre', 'Cant.', 'Categoría', 'Estado']],
      body: tableData,
      startY: 88,
      margin: { left: MARGEN_IZQ, right: MARGEN_IZQ },
      tableWidth: ANCHO_DISP,
      headStyles: { 
        fillColor: [52, 58, 64],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 40, halign: 'center' },
        3: { cellWidth: 35, halign: 'center' }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      didParseCell: function(data) {
        if (data.column.index === 1) {
          const val = parseInt(data.cell.raw);
          if (val <= 1) {
            data.cell.styles.textColor = [204, 0, 0];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 10;
            data.cell.styles.fillColor = [255, 230, 230];
          } else if (val === 2) {
            data.cell.styles.textColor = [180, 120, 0];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [255, 245, 200];
          }
        }
        if (data.column.index === 3) {
          const estado = data.cell.raw.toLowerCase();
          if (estado === 'sin stock') {
            data.cell.styles.textColor = [204, 0, 0];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [255, 220, 220];
          } else if (estado === 'stock bajo') {
            data.cell.styles.textColor = [180, 120, 0];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [255, 245, 200];
          } else {
            data.cell.styles.textColor = [40, 167, 69];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 15;

    doc.setDrawColor(108, 92, 231);
    doc.setLineWidth(0.3);
    doc.line(14, finalY, 196, finalY);

    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 170);
    doc.setFont('helvetica', 'normal');
    doc.text('Portal Porrones - Sistema de Gestión de Inventario', 14, finalY + 8);
    doc.text('Pág. 1', 185, finalY + 8);

    const nombreArchivo = filtroCategoria 
      ? `${filtroCategoria}_${fecha.replace(/\s/g, '_')}.pdf`
      : `inventario_${fecha.replace(/\s/g, '_')}.pdf`;
    doc.save(nombreArchivo);
    showMensaje('PDF exportado correctamente', 'success');
  };

  const handleLogoutLocal = () => {
    handleLogout();
    setProductos([]);
  };

  const resetearCategoria = () => {
    const cat = filtroCategoria;
    if (!cat) return;
    const nombreCat = cat === 'bebidas' ? 'Bebidas' : cat === 'destilados' ? 'Destilados' : 'Postres';
    if (!confirm(`¿Marcar todos los ${nombreCat} como sin stock?`)) return;
    const items = productos.filter(p => p.categoria === cat);
    if (items.length === 0) {
      showMensaje(`No hay ${nombreCat} para resetear`, 'error');
      return;
    }
    setSinStockIds(prev => {
      const nuevos = [...prev];
      items.forEach(p => {
        if (!nuevos.includes(p.id)) nuevos.push(p.id);
      });
      return nuevos;
    });
    showMensaje(`${items.length} ${nombreCat} marcado(s) como sin stock`, 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cantidad = parseInt(form.cantidad);

    if (cantidad === 0 && !editando) {
      showMensaje('La cantidad debe ser mayor a 0', 'error');
      return;
    }

    if (editando && cantidad === 0) {
      toggleSinStock(editando);
      setForm({ nombre: '', cantidad: '', categoria: '' });
      setEditando(null);
      showMensaje('Producto marcado como sin stock', 'success');
      return;
    }

    setCargando(true);
    try {
      if (editando) {
        const productoData = {
          nombre: form.nombre,
          cantidad,
          categoria: form.categoria
        };
        await axios.put(`${API_URL}/${editando}`, productoData);
        showMensaje('Producto actualizado correctamente', 'success');
        setEditando(null);
      } else {
        await axios.post(API_URL, {
          nombre: form.nombre,
          cantidad,
          categoria: form.categoria
        });
        showMensaje('Producto agregado correctamente', 'success');
      }

      setForm({ nombre: '', cantidad: '', categoria: '' });
      fetchProductos();
    } catch (err) {
      console.error('Error al guardar:', err);
      showMensaje('Error al guardar el producto', 'error');
      setCargando(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este producto?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        showMensaje('Producto eliminado correctamente', 'success');
        fetchProductos();
      } catch (err) {
        console.error('Error al eliminar:', err);
        showMensaje('Error al eliminar el producto', 'error');
      }
    }
  };

  const isSinStock = (id) => sinStockIds.includes(id);

  const toggleSinStock = (id) => {
    setSinStockIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getCantidad = (p) => isSinStock(p.id) ? 0 : p.cantidad;

  const handleEdit = (producto) => {
    setForm({
      nombre: producto.nombre,
      cantidad: isSinStock(producto.id) ? 0 : producto.cantidad,
      categoria: producto.categoria || ''
    });
    setEditando(producto.id);
  };

  const productosFiltrados = productos.filter(p => {
    if (p.categoria === 'horarios') return false;
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.categoria && p.categoria.toLowerCase().includes(busqueda.toLowerCase()));
    const coincideCategoria = !filtroCategoria || p.categoria === filtroCategoria;
    return coincideBusqueda && coincideCategoria;
  });

  if (!autenticado) {
    return (
      <div className="inventario-container">
        <h2>Inventario</h2>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="password"
            placeholder="Ingrese contraseña"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
          />
          <button type="submit">Acceder</button>
          {error && <p className="error-msg">{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="inventario-container">
      {mensaje && (
        <div className={`mensaje-popup ${tipoMensaje}`}>
          {mensaje}
        </div>
      )}
      
      <div className="inventario-header">
        <h2>Inventario</h2>
        <button onClick={handleLogoutLocal} className="logout-btn">Salir</button>
      </div>

      <form onSubmit={handleSubmit} className="inventario-form">
        <input
          type="text"
          placeholder="Nombre del producto"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Cantidad"
          value={form.cantidad}
          onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
          min="0"
          required
        />
        <select
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          required
        >
          <option value="">Seleccionar categoría</option>
          <option value="bebidas">Bebidas</option>
          <option value="destilados">Destilados</option>
          <option value="postre">Postre</option>
        </select>
        <button type="submit">{editando ? 'Actualizar' : 'Agregar'}</button>
        {editando && (
          <button type="button" onClick={() => { setEditando(null); setForm({ nombre: '', cantidad: '', categoria: '' }); }}>
            Cancelar
          </button>
        )}
      </form>

      <div className="busqueda-container">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="busqueda-input"
        />
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="filtro-categoria"
        >
          <option value="">Todas las categorías</option>
          <option value="bebidas">Bebidas</option>
          <option value="destilados">Destilados</option>
          <option value="postre">Postre</option>
        </select>
        {filtroCategoria && (
          <button onClick={resetearCategoria} className="reset-cat-btn">
            Reset {filtroCategoria === 'bebidas' ? 'Bebidas' : filtroCategoria === 'destilados' ? 'Destilados' : 'Postres'}
          </button>
        )}
        <button onClick={exportarPDF} className="csv-btn">
          {filtroCategoria ? `Exportar ${filtroCategoria === 'bebidas' ? 'Bebidas' : filtroCategoria === 'destilados' ? 'Destilados' : 'Postres'} PDF` : 'Exportar PDF'}
        </button>
      </div>

      {cargando ? (
        <div className="spinner" role="status" aria-label="Cargando productos"></div>
      ) : (
        <div className="table-container">
          <table className="inventario-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cantidad</th>
                <th>Categoría</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((p) => (
                <tr key={p.id} className={isSinStock(p.id) ? 'row-sin-stock' : ''}>
                  <td data-label="Nombre">{p.nombre}</td>
                  <td data-label="Cant." className={isSinStock(p.id) ? 'cantidad-cero' : ''}>
                    {getCantidad(p)}
                  </td>
                  <td data-label="Cat.">{p.categoria === 'bebidas' ? 'Bebidas' : p.categoria === 'destilados' ? 'Destilados' : p.categoria === 'postre' ? 'Postre' : '-'}</td>
                  <td data-label="Acciones">
                    <button onClick={() => handleEdit(p)}>Editar</button>
                    <button
                      onClick={() => toggleSinStock(p.id)}
                      className={isSinStock(p.id) ? 'stock-btn-restore' : 'stock-btn-zero'}
                    >
                      {isSinStock(p.id) ? 'Restaurar' : 'Sin stock'}
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="delete-btn">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!cargando && productosFiltrados.length === 0 && <p className="no-data">No hay productos</p>}
    </div>
  );
}

export default Inventario;
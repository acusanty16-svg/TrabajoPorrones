import { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Inventario.css';

const API_URL = 'https://portalporrones-backend-production.up.railway.app/api/productos';
// Actualizado para conectar con Railway
const PASSWORD = '1010';

function Inventario() {
  const [autenticado, setAutenticado] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
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
    try {
      const res = await axios.get(API_URL);
      setProductos(res.data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      showMensaje('Error al cargar productos', 'error');
    }
  };

  const showMensaje = (texto, tipo) => {
    setMensaje(texto);
    setTipoMensaje(tipo);
  };

  const exportarPDF = () => {
    const fecha = new Date().toISOString().split('T')[0];
    const doc = new jsPDF();

    const productosAExportar = filtroCategoria 
      ? productos.filter(p => p.categoria === filtroCategoria)
      : productos;

    const titulo = filtroCategoria 
      ? `${filtroCategoria === 'bebidas' ? 'Bebidas' : filtroCategoria === 'destilados' ? 'Destilados' : 'Postres'} - ${fecha}`
      : `Inventario - ${fecha}`;

    doc.setFontSize(18);
    doc.text(titulo, 14, 20);

    const tableData = productosAExportar.map(p => {
      const categoria = p.categoria === 'bebidas' ? 'Bebidas' : p.categoria === 'destilados' ? 'Destilados' : p.categoria === 'postre' ? 'Postre' : '-';
      const esStockBajo = p.cantidad <= 2;
      const estado = esStockBajo ? 'Stock bajo' : 'Normal';
      return [p.nombre, p.cantidad.toString(), categoria, estado];
    });

    autoTable(doc, {
      head: [['Nombre', 'Cantidad', 'Categoría', 'Estado']],
      body: tableData,
      startY: 30,
      headStyles: { fillColor: [52, 58, 64] },
      didParseCell: function(data) {
        if (data.column.index === 3 && data.cell.raw.toLowerCase().includes('stock bajo')) {
          data.cell.styles.textColor = [204, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.column.index === 1 && parseInt(data.cell.raw) < 3) {
          data.cell.styles.textColor = [204, 0, 0];
        }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Total de productos: ${productosAExportar.length}`, 14, finalY);

    const nombreArchivo = filtroCategoria 
      ? `${filtroCategoria}_${fecha}.pdf`
      : `inventario_${fecha}.pdf`;
    doc.save(nombreArchivo);
    showMensaje('PDF exportado correctamente', 'success');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === PASSWORD) {
      setAutenticado(true);
      setError('');
    } else {
      setError('Contraseña incorrecta');
    }
    setPasswordInput('');
  };

  const handleLogout = () => {
    setAutenticado(false);
    setProductos([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productoData = {
        nombre: form.nombre,
        cantidad: parseInt(form.cantidad),
        categoria: form.categoria
      };

      if (editando) {
        await axios.put(`${API_URL}/${editando}`, productoData);
        showMensaje('Producto actualizado correctamente', 'success');
        setEditando(null);
      } else {
        await axios.post(API_URL, productoData);
        showMensaje('Producto agregado correctamente', 'success');
      }

      setForm({ nombre: '', cantidad: '', categoria: '' });
      fetchProductos();
    } catch (err) {
      console.error('Error al guardar:', err);
      showMensaje('Error al guardar el producto', 'error');
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

  const handleEdit = (producto) => {
    setForm({
      nombre: producto.nombre,
      cantidad: producto.cantidad,
      categoria: producto.categoria || ''
    });
    setEditando(producto.id);
  };

  const productosFiltrados = productos.filter(p => {
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
        <button onClick={handleLogout} className="logout-btn">Salir</button>
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
        <button onClick={exportarPDF} className="csv-btn">
          {filtroCategoria ? `Exportar ${filtroCategoria === 'bebidas' ? 'Bebidas' : filtroCategoria === 'destilados' ? 'Destilados' : 'Postres'} PDF` : 'Exportar PDF'}
        </button>
      </div>

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
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>{p.cantidad}</td>
                <td>{p.categoria === 'bebidas' ? 'Bebidas' : p.categoria === 'destilados' ? 'Destilados' : p.categoria === 'postre' ? 'Postre' : '-'}</td>
                <td>
                  <button onClick={() => handleEdit(p)}>Editar</button>
                  <button onClick={() => handleDelete(p.id)} className="delete-btn">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {productosFiltrados.length === 0 && <p className="no-data">No hay productos</p>}
    </div>
  );
}

export default Inventario;
import { useState, useEffect } from 'react';
import axios from 'axios';
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

  const exportarCSV = () => {
    const fecha = new Date().toISOString().split('T')[0];
    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Inventario ${fecha}</title>
<style>
  body { font-family: Arial, sans-serif; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #333; padding: 12px; text-align: left; }
  th { background-color: #343a40; color: white; }
  .rojo { background-color: #ffcccc; color: #cc0000; font-weight: bold; }
  .stock-bajo { color: red; }
</style>
</head>
<body>
<h2>Inventario - ${fecha}</h2>
<table>
  <thead>
    <tr>
      <th>Nombre</th>
      <th>Cantidad</th>
      <th>Categoría</th>
      <th>Estado</th>
    </tr>
  </thead>
  <tbody>
`;

    productos.forEach(p => {
      const categoria = p.categoria === 'bebidas' ? 'Bebidas' : p.categoria === 'destilados' ? 'Destilados' : p.categoria === 'postre' ? 'Postre' : '-';
      const esStockBajo = p.cantidad < 3;
      const estado = esStockBajo ? '⚠️ STOCK BAJO' : '✓ Normal';
      const claseRojo = esStockBajo ? 'rojo' : '';
      
      htmlContent += `    <tr class="${claseRojo}">
      <td>${p.nombre}</td>
      <td class="${esStockBajo ? 'stock-bajo' : ''}">${p.cantidad}</td>
      <td>${categoria}</td>
      <td>${estado}</td>
    </tr>\n`;
    });

    htmlContent += `  </tbody>
</table>
<p>Total de productos: ${productos.length}</p>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventario_${fecha}.html`;
    link.click();
    showMensaje('Archivo exportado correctamente', 'success');
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

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.categoria && p.categoria.toLowerCase().includes(busqueda.toLowerCase()))
  );

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
        <button onClick={exportarCSV} className="csv-btn">Exportar</button>
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
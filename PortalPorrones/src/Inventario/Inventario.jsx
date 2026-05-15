import { useState, useEffect } from 'react';
import axios from 'axios';
import './Inventario.css';

const API_URL = 'https://portalporrones-backend-production.up.railway.app/api/productos';

function Inventario() {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    cantidad: '',
    precio: '',
    categoria: '',
    descripcion: ''
  });
  const [editando, setEditando] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      const res = await axios.get(API_URL);
      setProductos(res.data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productoData = {
        ...form,
        cantidad: parseInt(form.cantidad),
        precio: parseFloat(form.precio)
      };

      if (editando) {
        await axios.put(`${API_URL}/${editando}`, productoData);
        setEditando(null);
      } else {
        await axios.post(API_URL, productoData);
      }

      setForm({ nombre: '', cantidad: '', precio: '', categoria: '', descripcion: '' });
      fetchProductos();
    } catch (err) {
      console.error('Error al guardar:', err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este producto?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchProductos();
      } catch (err) {
        console.error('Error al eliminar:', err);
      }
    }
  };

  const handleEdit = (producto) => {
    setForm({
      nombre: producto.nombre,
      cantidad: producto.cantidad,
      precio: producto.precio,
      categoria: producto.categoria || '',
      descripcion: producto.descripcion || ''
    });
    setEditando(producto.id);
  };

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.categoria && p.categoria.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="inventario-container">
      <h2>Inventario</h2>

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
        <input
          type="number"
          step="0.01"
          placeholder="Precio"
          value={form.precio}
          onChange={(e) => setForm({ ...form, precio: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Categoría"
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
        />
        <input
          type="text"
          placeholder="Descripción"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />
        <button type="submit">{editando ? 'Actualizar' : 'Agregar'}</button>
        {editando && (
          <button type="button" onClick={() => { setEditando(null); setForm({ nombre: '', cantidad: '', precio: '', categoria: '', descripcion: '' }); }}>
            Cancelar
          </button>
        )}
      </form>

      <input
        type="text"
        placeholder="Buscar productos..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="busqueda-input"
      />

      <table className="inventario-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Categoría</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosFiltrados.map((p) => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>{p.cantidad}</td>
              <td>${parseFloat(p.precio).toFixed(2)}</td>
              <td>{p.categoria || '-'}</td>
              <td>
                <button onClick={() => handleEdit(p)}>Editar</button>
                <button onClick={() => handleDelete(p.id)} className="delete-btn">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {productosFiltrados.length === 0 && <p className="no-data">No hay productos</p>}
    </div>
  );
}

export default Inventario;
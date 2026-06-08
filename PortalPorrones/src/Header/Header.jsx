import { NavLink } from 'react-router-dom'
import './Header.css'

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <NavLink to="/" className="logo">PortalPorrones</NavLink>
        <nav aria-label="Navegación principal">
          <ul className="nav-links">
            <li><NavLink to="/" end>Horarios</NavLink></li>
            <li><NavLink to="/inventario">Inventario</NavLink></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header

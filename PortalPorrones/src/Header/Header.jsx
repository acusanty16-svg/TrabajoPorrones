import './Header.css'

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">PortalPorrones</h1>
        <nav>
          <ul className="nav-links">
            <li><a href="#horarios">Horarios</a></li>
            <li><a href="#inventario">Inventario</a></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header
import { Outlet } from 'react-router-dom'
import Header from './Header/Header.jsx'
import Footer from './Footer/Footer.jsx'

function Layout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}

export default Layout

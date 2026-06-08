import { Routes, Route } from 'react-router-dom'
import Layout from './Layout.jsx'
import HomePage from './pages/HomePage.jsx'
import InventarioPage from './pages/InventarioPage.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/inventario" element={<InventarioPage />} />
      </Route>
    </Routes>
  )
}

export default App

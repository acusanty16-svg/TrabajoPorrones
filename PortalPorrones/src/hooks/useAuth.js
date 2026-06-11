import { useState } from 'react'

const PASSWORD = import.meta.env.VITE_PASSWORD || '1010'

export function useAuth() {
  const [autenticado, setAutenticado] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [error, setError] = useState('')

  function handleLogin(e) {
    e.preventDefault()
    if (passwordInput === PASSWORD) {
      setAutenticado(true)
      setError('')
    } else {
      setError('Contraseña incorrecta')
    }
    setPasswordInput('')
  }

  function handleLogout() {
    setAutenticado(false)
    setError('')
    setPasswordInput('')
  }

  return {
    autenticado,
    passwordInput,
    error,
    setPasswordInput,
    handleLogin,
    handleLogout,
  }
}

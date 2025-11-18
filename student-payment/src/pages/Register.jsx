import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser, login } from '../services/auth'
import { useI18n } from '../i18n.jsx'

export default function Register() {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registerUser({ name, email, password, role: 'student' })
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="surface card">
        <h2 style={{ marginTop: 0 }}>{t('register')}</h2>
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <div>{t('name') || 'Name'}</div>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="field">
            <div>{t('email') || 'Email'}</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label className="field">
            <div>{t('password') || 'Password'}</div>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </label>
          {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
          <button className="btn primary" type="submit" disabled={loading}>{loading ? (t('creating') || 'Creating...') : (t('createAccount') || 'Create account')}</button>
        </form>
        <p className="section-title">
          {(t('haveAccount') || 'Already have an account?')} <Link to="/login">{t('login')}</Link>
        </p>
      </div>
    </div>
  )
}



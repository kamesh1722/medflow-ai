import { useState } from 'react'
import { Activity, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function Login({ admin, onSignIn, configured, startupError }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!email.trim() || !password) {
      setError('Enter your email address and password to continue.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    if (!configured) {
      setError('Admin access is not enabled. Configure the server authentication API before signing in.')
      return
    }
    setLoading(true)
    try {
      await onSignIn(email.trim(), password, remember)
      const destination = location.state?.from?.pathname
      navigate(destination && destination !== '/login' ? destination : '/', { replace: true })
    } catch (cause) {
      const status = cause?.response?.status
      setError(status === 401 || status === 403
        ? 'We couldn’t verify those credentials. Check your email and password, then try again.'
        : cause?.code === 'ERR_NETWORK'
          ? 'We couldn’t connect to MedFlow. Check that the backend and MongoDB are running, then try again.'
          : cause?.response?.data?.message || cause?.message || 'Sign-in failed. Please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="login-page">
    <Link to="/login" className="login-brand"><span className="login-logo"><Activity size={21} strokeWidth={2.6}/></span><span>MedFlow<span>AI</span></span></Link>
    <section className="login-card" aria-labelledby="login-title">
      <div className="login-heading"><div className="login-heading-icon"><ShieldCheck size={19}/></div><h1 id="login-title">Welcome Back</h1><p>Sign in to manage your healthcare inventory.</p></div>
      {!admin && !configured && <div className="auth-config-notice" role="status"><AlertCircle size={17}/><div><strong>Development preview</strong><span>Server authentication must be configured before administrator access can be securely enabled.</span></div></div>}
      {startupError && <div className="auth-config-notice" role="status"><AlertCircle size={16}/><div><strong>Session update</strong><span>{startupError}</span></div></div>}
      {notice && <div className="auth-config-notice" role="status"><AlertCircle size={16}/><div><strong>Account help</strong><span>{notice}</span></div></div>}
      {admin ? <div className="signed-in-state"><div className="signed-in-avatar"><ShieldCheck size={21}/></div><strong>You’re already signed in</strong><span>{admin.name || admin.displayName || admin.email || 'Administrator'}</span><Link className="button primary signed-in-button" to="/">Go to inventory <ArrowRight size={15}/></Link></div> : <form className="login-form" onSubmit={submit} noValidate>
        <label className="login-field"><span>Email Address</span><input type="email" name="email" autoComplete="username" inputMode="email" placeholder="admin@hospital.com" value={email} onChange={e=>setEmail(e.target.value)} aria-describedby={error?'login-error':undefined} autoCapitalize="none" spellCheck="false" required disabled={loading}/></label>
        <label className="login-field"><span>Password</span><div className="password-wrap"><input type={showPassword?'text':'password'} name="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} aria-describedby={error?'login-error':undefined} required disabled={loading}/><button type="button" className="password-toggle" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Hide password':'Show password'} aria-pressed={showPassword} disabled={loading}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
        {error && <div className="auth-error" id="login-error" role="alert"><AlertCircle size={15}/><span>{error}</span></div>}
        <div className="login-options"><label className="remember-option"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} disabled={loading}/><span className="custom-checkbox"/><span>Remember me</span></label><button type="button" className="forgot-link" onClick={()=>{setError('');setNotice('Password recovery is not configured. Contact your system administrator.')}}>Forgot password?</button></div>
        <button className="button primary login-submit" type="submit" disabled={loading}>{loading?<><span className="button-spinner"/> Signing in…</>:<>Sign In <ArrowRight size={16}/></>}</button>
      </form>}
      <div className="login-secure-note"><ShieldCheck size={15}/><span>Your credentials are sent to the MedFlow authentication service over a protected session. Passwords are never stored in this browser.</span></div>
    </section>
    <footer className="clean-login-footer"><span>© 2026 MedFlow AI</span><span>Inventory intelligence for healthcare</span></footer>
  </main>
}

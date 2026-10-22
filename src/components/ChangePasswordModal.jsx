import { useState } from 'react'
import { AlertCircle, Check, KeyRound, X } from 'lucide-react'
import { changePassword } from '../services/auth.js'

export default function ChangePasswordModal({ onClose, onChanged }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (newPassword.length !== 4 || new TextEncoder().encode(newPassword).length > 72) {
      setError('Your new password must be exactly 4 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      onChanged()
    } catch (cause) {
      setError(cause?.response?.data?.message || 'Your password could not be changed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && !loading && onClose()}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="change-password-title">
      <div className="modal-head">
        <div><span className="eyebrow">ACCOUNT SECURITY</span><h2 id="change-password-title">Change password</h2></div>
        <button className="icon-button" onClick={onClose} aria-label="Close" disabled={loading}><X size={19}/></button>
      </div>
      <p className="modal-note">Confirm your current password, then choose a new password with exactly 4 characters. You’ll need to sign in again after changing it.</p>
      <form onSubmit={submit}>
        <div className="form-grid password-change-fields">
          <label className="field full"><span>Current password <b>*</b></span><input type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required disabled={loading}/></label>
          <label className="field full"><span>New password <b>*</b></span><input type="password" autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} minLength={4} maxLength={4} required disabled={loading}/></label>
          <label className="field full"><span>Confirm new password <b>*</b></span><input type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} minLength={4} maxLength={4} required disabled={loading}/></label>
        </div>
        {error && <div className="form-error" role="alert"><AlertCircle size={15}/>{error}</div>}
        <div className="modal-actions">
          <button type="button" className="button outline" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="button primary" type="submit" disabled={loading}>{loading ? <><span className="button-spinner"/> Updating…</> : <><KeyRound size={15}/> Update password</>}</button>
        </div>
      </form>
    </section>
  </div>
}

import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

/** A password box with a control to reveal what was typed. */
export default function PasswordInput({ className = '', ...props }: Props) {
  const [visible, setVisible] = useState(false)
  const label = visible ? 'Hide password' : 'Show password'

  return (
    <div className="password-field">
      <input {...props} type={visible ? 'text' : 'password'} className={`input ${className}`.trim()} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((value) => !value)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  )
}

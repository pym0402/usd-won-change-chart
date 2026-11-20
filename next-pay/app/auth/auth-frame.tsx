import { useEffect, useRef, type ReactNode } from 'react'
import { Check, Zap } from 'lucide-react'
import homeStyles from '../home.module.css'
import styles from './auth.module.css'

export function AuthFrame({ title, description, children, aside }: {
  title: string
  description: string
  children: ReactNode
  aside?: ReactNode
}) {
  return (
    <main className={`${homeStyles.home} ${styles.page}`}>
      <div className={styles.layout}>
        <header className={styles.intro}>
          <div className={styles.brandMark}><Zap size={25} fill="currentColor" aria-hidden="true" /></div>
          <p className={styles.brand}>Next Pay</p>
          <h1>{title}</h1>
          <p className={styles.description}>{description}</p>
        </header>
        <div className={styles.card}>{children}</div>
        {aside && <aside className={styles.aside} aria-labelledby="demo-accounts">{aside}</aside>}
      </div>
    </main>
  )
}

export function AuthSuccess({ title, onConfirm }: { title: string; onConfirm: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="auth-success-title"
      aria-describedby="auth-success-description"
      onCancel={(event) => event.preventDefault()}
    >
      <span className={styles.successIcon}><Check size={28} aria-hidden="true" /></span>
      <h2 id="auth-success-title">{title}</h2>
      <p id="auth-success-description">Next Pay에 오신 것을 환영합니다!</p>
      <button type="button" className={styles.submit} onClick={onConfirm} autoFocus>확인</button>
    </dialog>
  )
}

export function RecoveryResult({ title, label, value, description }: {
  title: string
  label: string
  value: string
  description?: string
}) {
  return (
    <div className={styles.success} role="status">
      <h2 className={styles.resultHeading}><Check size={18} aria-hidden="true" />{title}</h2>
      <dl className={styles.resultValue}>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </dl>
      {description && <p className={styles.resultNote}>{description}</p>}
    </div>
  )
}

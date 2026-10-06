import { useState, type FormEvent } from 'react';
import styles from '../../styles/modules/form/emailCaptureForm.module.css';

interface EmailCaptureFormProps {
  id: string;
  label: string;
  buttonText: string;
  variant: 'dark' | 'light';
}

export function EmailCaptureForm({ id, label, buttonText, variant }: EmailCaptureFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    setError('');
    // Integrar aquí la suscripción o solicitud cuando exista un servicio de contacto.
  };

  return <form className={`${styles.form} ${styles[variant]}`} onSubmit={handleSubmit} noValidate><label htmlFor={id}>{label}</label><div className={styles.controls}><input id={id} type="email" placeholder={label} value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} required aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} /><button type="submit">{buttonText}</button></div>{error && <span className={styles.error} id={`${id}-error`} role="alert">{error}</span>}</form>;
}

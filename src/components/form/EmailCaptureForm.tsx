import { useEmailCaptureForm } from '../../hooks/useEmailCaptureForm';
import type { EmailFormSource } from '../../utils/formSubmission';
import { HoneypotField } from './HoneypotField';
import { Spinner } from '../../assets/icons/Spinner';
import styles from '../../styles/modules/form/emailCaptureForm.module.css';

interface EmailCaptureFormProps {
  id: string;
  label: string;
  buttonText: string;
  variant: 'dark' | 'light';
  formSource: EmailFormSource;
}

export function EmailCaptureForm({ id, label, buttonText, variant, formSource }: EmailCaptureFormProps) {
  const { values, error, submission, handleChange, handleSubmit, isSubmitting, isBlocked } = useEmailCaptureForm(formSource);

  return <form data-form-id={formSource} className={`${styles.form} ${styles[variant]}`} onSubmit={handleSubmit} aria-busy={isSubmitting} noValidate>
    <label htmlFor={id}>{label}</label>
    <div className={styles.controls}>
      <input id={id} name="email" type="email" autoComplete="email" maxLength={254} placeholder={label} value={values.email} onChange={handleChange} disabled={isSubmitting} required aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
      <button type="submit" disabled={isBlocked}>
        {isSubmitting && <span aria-hidden="true"><Spinner size={18} /></span>}
        <span>{isSubmitting ? 'Enviando...' : buttonText}</span>
      </button>
    </div>
    <HoneypotField id={`${id}-website`} value={values.website} onChange={handleChange} />
    {error && <span className={styles.error} id={`${id}-error`} role="alert">{error}</span>}
    {submission.message && <p className={submission.status === 'success' ? styles.success : styles.error} role={submission.status === 'success' ? 'status' : 'alert'}>{submission.message}</p>}
  </form>;
}

import { useGeneralInquiryForm } from '../../hooks/useGeneralInquiryForm';
import { HoneypotField } from './HoneypotField';
import { Spinner } from '../../assets/icons/Spinner';
import styles from '../../styles/modules/form/generalInquiryForm.module.css';

export function GeneralInquiryForm() {
  const { values, errors, handleChange, handleSubmit, submission, isSubmitting, isBlocked } = useGeneralInquiryForm();

  return <form className={styles.form} onSubmit={handleSubmit} aria-busy={isSubmitting} noValidate>
    <div className={styles.field}><label htmlFor="inquiry-name">Nombre completo</label><input id="inquiry-name" name="name" maxLength={120} disabled={isSubmitting} value={values.name} onChange={handleChange} autoComplete="name" required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'inquiry-name-error' : undefined} />{errors.name && <span className={styles.error} id="inquiry-name-error" role="alert">{errors.name}</span>}</div>
    <div className={styles.field}><label htmlFor="inquiry-email">Correo electrónico</label><input id="inquiry-email" name="email" type="email" maxLength={254} disabled={isSubmitting} value={values.email} onChange={handleChange} autoComplete="email" required aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'inquiry-email-error' : undefined} />{errors.email && <span className={styles.error} id="inquiry-email-error" role="alert">{errors.email}</span>}</div>
    <div className={styles.field}><label htmlFor="inquiry-subject">Asunto</label><select id="inquiry-subject" name="subject" disabled={isSubmitting} value={values.subject} onChange={handleChange} required aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? 'inquiry-subject-error' : undefined}><option value="">Selecciona una opción</option><option value="asesoria">Solicitar asesoría</option><option value="servicios">Información de servicios</option><option value="otro">Otro</option></select>{errors.subject && <span className={styles.error} id="inquiry-subject-error" role="alert">{errors.subject}</span>}</div>
    <div className={styles.field}><label htmlFor="inquiry-message">Mensaje</label><textarea id="inquiry-message" name="message" maxLength={5000} disabled={isSubmitting} value={values.message} onChange={handleChange} rows={5} required aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'inquiry-message-error' : undefined} />{errors.message && <span className={styles.error} id="inquiry-message-error" role="alert">{errors.message}</span>}</div>
    <HoneypotField id="inquiry-website" value={values.website} onChange={handleChange} />
    {submission.message && <p className={submission.status === 'success' ? styles.success : styles.error} role={submission.status === 'success' ? 'status' : 'alert'}>{submission.message}</p>}
    <button className={styles.submit} type="submit" disabled={isBlocked}>
      {isSubmitting && <span aria-hidden="true"><Spinner size={18} /></span>}
      <span>{isSubmitting ? 'Enviando...' : 'Enviar consulta'}</span>
    </button>
  </form>;
}

import type { FormEvent } from 'react';
import { useGeneralInquiryForm } from '../../hooks/useGeneralInquiryForm';
import styles from '../../styles/modules/form/generalInquiryForm.module.css';

export function GeneralInquiryForm() {
  const { values, errors, handleChange, validate } = useGeneralInquiryForm();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    // Integrar aquí el envío cuando exista un servicio de contacto.
  };

  return <form className={styles.form} onSubmit={handleSubmit} noValidate>
    <div className={styles.field}><label htmlFor="inquiry-name">Nombre completo</label><input id="inquiry-name" name="name" value={values.name} onChange={handleChange} autoComplete="name" required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'inquiry-name-error' : undefined} />{errors.name && <span className={styles.error} id="inquiry-name-error" role="alert">{errors.name}</span>}</div>
    <div className={styles.field}><label htmlFor="inquiry-email">Correo electrónico</label><input id="inquiry-email" name="email" type="email" value={values.email} onChange={handleChange} autoComplete="email" required aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'inquiry-email-error' : undefined} />{errors.email && <span className={styles.error} id="inquiry-email-error" role="alert">{errors.email}</span>}</div>
    <div className={styles.field}><label htmlFor="inquiry-subject">Asunto</label><select id="inquiry-subject" name="subject" value={values.subject} onChange={handleChange} required aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? 'inquiry-subject-error' : undefined}><option value="">Selecciona una opción</option><option value="asesoria">Solicitar asesoría</option><option value="servicios">Información de servicios</option><option value="otro">Otro</option></select>{errors.subject && <span className={styles.error} id="inquiry-subject-error" role="alert">{errors.subject}</span>}</div>
    <div className={styles.field}><label htmlFor="inquiry-message">Mensaje</label><textarea id="inquiry-message" name="message" value={values.message} onChange={handleChange} rows={5} required aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'inquiry-message-error' : undefined} />{errors.message && <span className={styles.error} id="inquiry-message-error" role="alert">{errors.message}</span>}</div>
    <button className={styles.submit} type="submit">Enviar consulta</button>
  </form>;
}

import type { FormEvent } from 'react';
import { useJoinTeamForm } from '../../hooks/useJoinTeamForm';
import styles from '../../styles/modules/form/joinTeamForm.module.css';

export function JoinTeamForm() {
  const { values, errors, handleChange, validate } = useJoinTeamForm();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    // Integrar aquí la postulación cuando exista un servicio de reclutamiento.
  };

  return <form className={styles.form} onSubmit={handleSubmit} noValidate>
    <div className={styles.field}><label htmlFor="join-name">Nombre</label><input id="join-name" name="name" value={values.name} onChange={handleChange} autoComplete="name" required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'join-name-error' : undefined} />{errors.name && <span className={styles.error} id="join-name-error" role="alert">{errors.name}</span>}</div>
    <div className={styles.field}><label htmlFor="join-phone">Teléfono</label><input id="join-phone" name="phone" type="tel" value={values.phone} onChange={handleChange} autoComplete="tel" required aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'join-phone-error' : undefined} />{errors.phone && <span className={styles.error} id="join-phone-error" role="alert">{errors.phone}</span>}</div>
    <div className={styles.field}><label htmlFor="join-location">Ubicación de interés</label><select id="join-location" name="location" value={values.location} onChange={handleChange} required aria-invalid={Boolean(errors.location)} aria-describedby={errors.location ? 'join-location-error' : undefined}><option value="">Selecciona una ubicación</option><option value="monterrey">Monterrey</option><option value="nacional">Otra ciudad en México</option></select>{errors.location && <span className={styles.error} id="join-location-error" role="alert">{errors.location}</span>}</div>
    <div className={styles.field}><label htmlFor="join-cv">CV (PDF o DOCX, máximo 5 MB)</label><input id="join-cv" name="cv" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleChange} required aria-invalid={Boolean(errors.cv)} aria-describedby={errors.cv ? 'join-cv-error' : 'join-cv-hint'} /><small id="join-cv-hint">{values.cv ? `Archivo seleccionado: ${values.cv.name}` : 'Selecciona un archivo de hasta 5 MB.'}</small>{errors.cv && <span className={styles.error} id="join-cv-error" role="alert">{errors.cv}</span>}</div>
    <button className={styles.submit} type="submit">Enviar postulación</button>
  </form>;
}

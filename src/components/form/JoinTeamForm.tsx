import { useRef, type DragEvent, type FormEvent } from 'react';
import { useJoinTeamForm } from '../../hooks/useJoinTeamForm';
import uploadIcon from '../../assets/images/contacto/cargar-archivos.svg';
import styles from '../../styles/modules/form/joinTeamForm.module.css';

export function JoinTeamForm() {
  const { values, errors, handleChange, updateCv, validate } = useJoinTeamForm();
  const cvInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;

    // Mantener el control nativo sincronizado con el archivo soltado.
    const transfer = new DataTransfer();
    transfer.items.add(file);
    if (cvInputRef.current) cvInputRef.current.files = transfer.files;
    updateCv(file);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    // Integrar aquí la postulación cuando exista un servicio de reclutamiento.
  };

  return <form className={styles.form} onSubmit={handleSubmit} noValidate>
    <div className={styles.field}><label htmlFor="join-name">Nombre</label><input id="join-name" name="name" value={values.name} onChange={handleChange} autoComplete="name" required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'join-name-error' : undefined} />{errors.name && <span className={styles.error} id="join-name-error" role="alert">{errors.name}</span>}</div>
    <div className={styles.field}><label htmlFor="join-phone">Teléfono</label><input id="join-phone" name="phone" type="tel" value={values.phone} onChange={handleChange} autoComplete="tel" required aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'join-phone-error' : undefined} />{errors.phone && <span className={styles.error} id="join-phone-error" role="alert">{errors.phone}</span>}</div>
    <div className={styles.field}><label htmlFor="join-location">Ubicación de interés</label><select id="join-location" name="location" value={values.location} onChange={handleChange} required aria-invalid={Boolean(errors.location)} aria-describedby={errors.location ? 'join-location-error' : undefined}><option value="">Selecciona una ubicación</option><option value="monterrey">Monterrey</option><option value="nacional">Otra ciudad en México</option></select>{errors.location && <span className={styles.error} id="join-location-error" role="alert">{errors.location}</span>}</div>
    <div className={`${styles.field} ${styles.cvField}`}>
      <input ref={cvInputRef} className={styles.fileInput} id="join-cv" name="cv" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleChange} required aria-invalid={Boolean(errors.cv)} aria-describedby={`join-cv-hint join-cv-selected${errors.cv ? ' join-cv-error' : ''}`} />
      <label className={styles.dropzone} htmlFor="join-cv" onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }} onDrop={handleDrop}>
        <img src={uploadIcon} alt="" width="33" height="24" />
        <span>Haz clic o arrastra tu CV aquí</span>
        <small id="join-cv-hint">PDF, DOCX (Máx. 5MB)</small>
        <span className={styles.selectedFile} id="join-cv-selected" role="status">{values.cv && `Archivo seleccionado: ${values.cv.name}`}</span>
      </label>
      {errors.cv && <span className={styles.error} id="join-cv-error" role="alert">{errors.cv}</span>}
    </div>
    <button className={styles.submit} type="submit">Enviar postulación</button>
  </form>;
}

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { getFormUtm } from '../utils/formUtm';
import { trackFormSuccess } from '../utils/tracking';
import { isSubmissionBlocked, submitForm, type FormSubmissionState } from '../utils/formSubmission';
import { isValidFormName } from '../utils/formValidation';

export interface JoinTeamValues {
  name: string;
  phone: string;
  location: string;
  cv: File | null;
  website: string;
}

type JoinTeamErrors = Partial<Record<Exclude<keyof JoinTeamValues, 'website'>, string>>;

const initialValues: JoinTeamValues = { name: '', phone: '', location: '', cv: null, website: '' };
const maxCvSize = 5_000_000;

export function useJoinTeamForm() {
  const [values, setValues] = useState<JoinTeamValues>(initialValues);
  const [errors, setErrors] = useState<JoinTeamErrors>({});
  const [submission, setSubmission] = useState<FormSubmissionState>({ status: 'idle', message: '' });
  const locked = useRef(false);

  const updateTextField = (field: 'name' | 'phone' | 'location' | 'website', value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (field !== 'website') setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmission((current) => current.status === 'error' || current.status === 'success' ? { status: 'idle', message: '' } : current);
  };

  const updateCv = (value: File | null) => {
    setValues((current) => ({ ...current, cv: value }));
    setErrors((current) => ({ ...current, cv: undefined }));
    setSubmission((current) => current.status === 'error' || current.status === 'success' ? { status: 'idle', message: '' } : current);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const field = event.currentTarget.name;
    if (submission.status === 'loading') return;
    if (field === 'cv' && event.currentTarget instanceof HTMLInputElement) {
      updateCv(event.currentTarget.files?.[0] ?? null);
      return;
    }
    if (field === 'name' || field === 'phone' || field === 'location' || field === 'website') updateTextField(field, event.currentTarget.value);
  };

  const validate = () => {
    const nextErrors: JoinTeamErrors = {};
    if (!isValidFormName(values.name)) nextErrors.name = 'Escribe un nombre de entre 2 y 120 caracteres.';
    if (values.phone.length > 40 || !/^\+?[0-9 ().-]+$/.test(values.phone.trim())
      || !/^\+?\d{8,15}$/.test(values.phone.trim().replace(/[ ().-]/g, ''))) nextErrors.phone = 'Ingresa un teléfono válido de 8 a 15 dígitos.';
    if (!['monterrey', 'nacional'].includes(values.location)) nextErrors.location = 'Selecciona una ubicación.';

    if (!values.cv) nextErrors.cv = 'Adjunta tu CV en PDF o DOCX.';
    else {
      const validExtension = /\.(pdf|docx)$/i.test(values.cv.name);
      const validType = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/octet-stream'].includes(values.cv.type);
      if (!validExtension || (values.cv.type && !validType) || values.cv.size === 0) nextErrors.cv = 'El archivo debe ser un PDF o DOCX no vacío.';
      else if (values.cv.size > maxCvSize) nextErrors.cv = 'El archivo debe pesar máximo 5 MB.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked.current) return;
    if (!validate()) {
      setSubmission({ status: 'error', message: 'Revisa los campos marcados antes de enviar.' });
      return;
    }
    const form = event.currentTarget;
    locked.current = true;
    setSubmission({ status: 'loading', message: '' });
    const body = new FormData();
    body.append('name', values.name.trim());
    body.append('phone', values.phone.trim());
    body.append('location', values.location);
    if (values.cv) body.append('cv', values.cv);
    body.append('formSource', 'cv_contacto');
    body.append('utm', JSON.stringify(getFormUtm()));
    body.append('website', values.website);
    const result = await submitForm('cv', body);
    setSubmission(result);
    if (result.status === 'success') {
      if (!values.website.trim()) trackFormSuccess('cv_contacto');
      setValues(initialValues);
      setErrors({});
      form.reset();
    }
    locked.current = isSubmissionBlocked(result.status);
  };

  return { values, errors, handleChange, updateCv, validate, handleSubmit, submission,
    isSubmitting: submission.status === 'loading', isBlocked: isSubmissionBlocked(submission.status) };
}

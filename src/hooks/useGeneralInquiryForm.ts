import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { getFormUtm } from '../utils/formUtm';
import { isSubmissionBlocked, submitForm, type FormSubmissionState } from '../utils/formSubmission';
import { hasFormControlCharacters, isValidFormEmail, isValidFormName } from '../utils/formValidation';

export interface GeneralInquiryValues {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
}

type GeneralInquiryErrors = Partial<Record<Exclude<keyof GeneralInquiryValues, 'website'>, string>>;

const initialValues: GeneralInquiryValues = { name: '', email: '', subject: '', message: '', website: '' };

export function useGeneralInquiryForm() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<GeneralInquiryErrors>({});
  const [submission, setSubmission] = useState<FormSubmissionState>({ status: 'idle', message: '' });
  const locked = useRef(false);

  const updateField = (field: keyof GeneralInquiryValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (field !== 'website') setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmission((current) => current.status === 'error' || current.status === 'success' ? { status: 'idle', message: '' } : current);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const field = event.currentTarget.name;
    if (submission.status === 'loading') return;
    if (field === 'name' || field === 'email' || field === 'subject' || field === 'message' || field === 'website') updateField(field, event.currentTarget.value);
  };

  const validate = () => {
    const nextErrors: GeneralInquiryErrors = {};
    if (!isValidFormName(values.name)) nextErrors.name = 'Escribe un nombre de entre 2 y 120 caracteres.';
    if (!isValidFormEmail(values.email)) nextErrors.email = 'Ingresa un correo válido de hasta 254 caracteres.';
    if (!['asesoria', 'servicios', 'otro'].includes(values.subject)) nextErrors.subject = 'Selecciona un asunto.';
    if (values.message.trim().length < 10 || values.message.length > 5000 || hasFormControlCharacters(values.message, true)) nextErrors.message = 'Escribe un mensaje de entre 10 y 5000 caracteres.';
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
    const result = await submitForm('con', {
      name: values.name.trim(), email: values.email.trim().toLowerCase(), subject: values.subject, message: values.message.trim(),
      formSource: 'consulta_contacto', utm: getFormUtm(), website: values.website,
    });
    setSubmission(result);
    if (result.status === 'success') {
      setValues(initialValues);
      setErrors({});
      form.reset();
    }
    locked.current = isSubmissionBlocked(result.status);
  };

  return { values, errors, handleChange, validate, handleSubmit, submission,
    isSubmitting: submission.status === 'loading', isBlocked: isSubmissionBlocked(submission.status) };
}

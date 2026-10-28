import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { getFormUtm } from '../utils/formUtm';
import { trackFormSuccess } from '../utils/tracking';
import { isSubmissionBlocked, submitForm, type EmailFormSource, type FormSubmissionState } from '../utils/formSubmission';
import { isValidFormEmail } from '../utils/formValidation';

export function useEmailCaptureForm(formSource: EmailFormSource) {
  const [values, setValues] = useState({ email: '', website: '' });
  const [error, setError] = useState('');
  const [submission, setSubmission] = useState<FormSubmissionState>({ status: 'idle', message: '' });
  const locked = useRef(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget;
    if ((name !== 'email' && name !== 'website') || submission.status === 'loading') return;
    setValues((current) => ({ ...current, [name]: value }));
    if (name === 'email') setError('');
    setSubmission((current) => current.status === 'error' || current.status === 'success' ? { status: 'idle', message: '' } : current);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked.current) return;
    if (!isValidFormEmail(values.email)) {
      setError('Ingresa un correo electrónico válido de hasta 254 caracteres.');
      setSubmission({ status: 'error', message: 'Revisa el correo antes de enviar.' });
      return;
    }
    const form = event.currentTarget;
    locked.current = true;
    setError('');
    setSubmission({ status: 'loading', message: '' });
    const result = await submitForm('email', {
      email: values.email.trim().toLowerCase(), formSource, utm: getFormUtm(), website: values.website,
    });
    setSubmission(result);
    if (result.status === 'success') {
      if (!values.website.trim()) trackFormSuccess(formSource);
      setValues({ email: '', website: '' });
      form.reset();
    }
    locked.current = isSubmissionBlocked(result.status);
  };

  return { values, error, submission, handleChange, handleSubmit,
    isSubmitting: submission.status === 'loading', isBlocked: isSubmissionBlocked(submission.status) };
}

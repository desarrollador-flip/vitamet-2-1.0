import { useState, type ChangeEvent } from 'react';

export interface GeneralInquiryValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type GeneralInquiryErrors = Partial<Record<keyof GeneralInquiryValues, string>>;

const initialValues: GeneralInquiryValues = { name: '', email: '', subject: '', message: '' };

export function useGeneralInquiryForm() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<GeneralInquiryErrors>({});

  const updateField = (field: keyof GeneralInquiryValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const field = event.currentTarget.name as keyof GeneralInquiryValues;
    updateField(field, event.currentTarget.value);
  };

  const validate = () => {
    const nextErrors: GeneralInquiryErrors = {};
    if (values.name.trim().length < 2) nextErrors.name = 'Escribe tu nombre completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) nextErrors.email = 'Ingresa un correo válido.';
    if (!values.subject) nextErrors.subject = 'Selecciona un asunto.';
    if (values.message.trim().length < 10) nextErrors.message = 'Escribe un mensaje de al menos 10 caracteres.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  return { values, errors, handleChange, validate };
}

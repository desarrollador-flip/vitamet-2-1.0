import { useState, type ChangeEvent } from 'react';

export interface JoinTeamValues {
  name: string;
  phone: string;
  location: string;
  cv: File | null;
}

type JoinTeamErrors = Partial<Record<keyof JoinTeamValues, string>>;

const initialValues: JoinTeamValues = { name: '', phone: '', location: '', cv: null };
const maxCvSize = 5 * 1024 * 1024;

export function useJoinTeamForm() {
  const [values, setValues] = useState<JoinTeamValues>(initialValues);
  const [errors, setErrors] = useState<JoinTeamErrors>({});

  const updateTextField = (field: 'name' | 'phone' | 'location', value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const updateCv = (value: File | null) => {
    setValues((current) => ({ ...current, cv: value }));
    setErrors((current) => ({ ...current, cv: undefined }));
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const field = event.currentTarget.name;
    if (field === 'cv' && event.currentTarget instanceof HTMLInputElement) {
      updateCv(event.currentTarget.files?.[0] ?? null);
      return;
    }
    if (field === 'name' || field === 'phone' || field === 'location') updateTextField(field, event.currentTarget.value);
  };

  const validate = () => {
    const nextErrors: JoinTeamErrors = {};
    if (values.name.trim().length < 2) nextErrors.name = 'Escribe tu nombre.';
    if (values.phone.replace(/\D/g, '').length < 8) nextErrors.phone = 'Ingresa un teléfono válido.';
    if (!values.location) nextErrors.location = 'Selecciona una ubicación.';

    if (!values.cv) nextErrors.cv = 'Adjunta tu CV en PDF o DOCX.';
    else {
      const validExtension = /\.(pdf|docx)$/i.test(values.cv.name);
      const validType = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(values.cv.type);
      if (!validExtension || (values.cv.type && !validType)) nextErrors.cv = 'El archivo debe ser PDF o DOCX.';
      else if (values.cv.size > maxCvSize) nextErrors.cv = 'El archivo debe pesar máximo 5 MB.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  return { values, errors, handleChange, validate };
}

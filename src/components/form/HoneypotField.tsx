import type { ChangeEventHandler } from 'react';
import styles from '../../styles/modules/form/honeypotField.module.css';

interface HoneypotFieldProps {
  id: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
}

export function HoneypotField({ id, value, onChange }: HoneypotFieldProps) {
  return <div className={styles.honeypot} aria-hidden="true">
    <label htmlFor={id}>Sitio web</label>
    <input id={id} name="website" type="text" value={value} onChange={onChange} autoComplete="off" tabIndex={-1} maxLength={512} />
  </div>;
}

'use client';

import { type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';

export function ReporterInfo() {
  const t = useTranslations('steps');
  const { reporterName, department, role, email, phone, update } = useFormStore();

  const onChange = (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
    update({ [field]: e.target.value });
  };

  return (
    <div className="space-y-4">
      <Field label={`${t('reporter.name')} *`} value={reporterName} onChange={onChange('reporterName')} placeholder={t('reporter.namePlaceholder')} />
      <Field label={`${t('reporter.email')} *`} value={email} onChange={onChange('email')} placeholder={t('reporter.emailPlaceholder')} type="email" error={email.length > 0 && !email.includes('@') ? t('reporter.invalidEmail') : undefined} />
      <Field label={`${t('reporter.phone')} *`} value={phone} onChange={onChange('phone')} placeholder={t('reporter.phonePlaceholder')} type="tel" />
      <Field label={t('reporter.department')} value={department} onChange={onChange('department')} placeholder={t('reporter.departmentPlaceholder')} />
      <Field label={t('reporter.role')} value={role} onChange={onChange('role')} placeholder={t('reporter.rolePlaceholder')} />
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', error }: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  const id = label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-500 dark:text-gray-300">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`h-12 w-full rounded-lg border px-4 text-base text-gray-900 outline-none transition-all placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500 ${
          error
            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-red-700 dark:bg-red-900/10'
            : 'border-gray-200 bg-gray-50 focus:border-[var(--brand-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/20 dark:border-gray-700 dark:bg-gray-800 dark:focus:bg-gray-800'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

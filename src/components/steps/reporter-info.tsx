'use client';

import { type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';
import { EMAIL_RE } from '@/lib/form/schema';
import { TextField } from '@/components/ui';

export function ReporterInfo() {
  const t = useTranslations('steps');
  const { reporterName, department, role, email, phone, update } = useFormStore();

  const onChange = (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
    update({ [field]: e.target.value });
  };

  return (
    <div className="space-y-4">
      <TextField
        label={t('reporter.name')}
        required
        value={reporterName}
        onChange={onChange('reporterName')}
        placeholder={t('reporter.namePlaceholder')}
      />
      <TextField
        label={t('reporter.email')}
        required
        type="email"
        value={email}
        onChange={onChange('email')}
        placeholder={t('reporter.emailPlaceholder')}
        error={email.length > 0 && !EMAIL_RE.test(email) ? t('reporter.invalidEmail') : undefined}
      />
      <TextField
        label={t('reporter.phone')}
        required
        type="tel"
        value={phone}
        onChange={onChange('phone')}
        placeholder={t('reporter.phonePlaceholder')}
      />
      <TextField
        label={t('reporter.department')}
        value={department}
        onChange={onChange('department')}
        placeholder={t('reporter.departmentPlaceholder')}
      />
      <TextField
        label={t('reporter.role')}
        value={role}
        onChange={onChange('role')}
        placeholder={t('reporter.rolePlaceholder')}
      />
    </div>
  );
}

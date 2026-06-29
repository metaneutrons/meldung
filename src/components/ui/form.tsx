'use client';

import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

/** Shared label + control styling — the single source for form-control looks. */
export const labelClass = 'mb-1.5 block text-sm font-medium text-fg-muted';

const controlBase =
  'w-full rounded-xl border border-border bg-surface-2 text-base text-fg outline-none transition-all placeholder:text-fg-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger-bg aria-[invalid=true]:focus:ring-danger/20';

const choiceBase =
  'h-4 w-4 border-border accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

// --- Low-level controls -----------------------------------------------------

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlBase, 'h-12 px-4', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(controlBase, 'min-h-[120px] resize-y px-4 py-3 leading-relaxed', className)}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlBase, 'h-12 px-4', className)} {...props}>
      {children}
    </select>
  );
}

// --- Field wrapper ----------------------------------------------------------

interface FieldShellProps {
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ id, label, required, error, hint, children }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required ? ' *' : ''}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs italic text-fg-subtle">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

// --- Ergonomic field + control combos --------------------------------------

type FieldExtras = { label: string; required?: boolean; error?: string; hint?: string };

export function TextField({
  label,
  required,
  error,
  hint,
  id,
  ...inputProps
}: FieldExtras & InputHTMLAttributes<HTMLInputElement>) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <Field id={fieldId} label={label} required={required} error={error} hint={hint}>
      <Input id={fieldId} aria-invalid={error ? true : undefined} {...inputProps} />
    </Field>
  );
}

export function TextareaField({
  label,
  required,
  error,
  hint,
  id,
  ...textareaProps
}: FieldExtras & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <Field id={fieldId} label={label} required={required} error={error} hint={hint}>
      <Textarea id={fieldId} aria-invalid={error ? true : undefined} {...textareaProps} />
    </Field>
  );
}

export function SelectField({
  label,
  required,
  error,
  hint,
  id,
  children,
  ...selectProps
}: FieldExtras & SelectHTMLAttributes<HTMLSelectElement>) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <Field id={fieldId} label={label} required={required} error={error} hint={hint}>
      <Select id={fieldId} aria-invalid={error ? true : undefined} {...selectProps}>
        {children}
      </Select>
    </Field>
  );
}

// --- Choice groups ----------------------------------------------------------

export interface ChoiceOption {
  value: string;
  label: string;
}

export function RadioGroup({
  name,
  legend,
  required,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  required?: boolean;
  options: readonly ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className={labelClass}>
        {legend}
        {required ? ' *' : ''}
      </legend>
      <div className="flex flex-wrap gap-4 p-3">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm text-fg-muted">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className={choiceBase}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CheckboxGroup({
  legend,
  options,
  values,
  onToggle,
  columns = true,
}: {
  legend: string;
  options: readonly ChoiceOption[];
  values: string[];
  onToggle: (value: string) => void;
  columns?: boolean;
}) {
  return (
    <fieldset>
      <legend className={labelClass}>{legend}</legend>
      <div
        className={cn(
          'gap-3 rounded-xl border border-border bg-surface-2 p-4',
          columns ? 'grid grid-cols-1 sm:grid-cols-2' : 'flex flex-col',
        )}
      >
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-3 text-sm text-fg">
            <input
              type="checkbox"
              checked={values.includes(opt.value)}
              onChange={() => onToggle(opt.value)}
              className={cn(choiceBase, 'rounded')}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Apple-style segmented control for short, mutually-exclusive option sets. */
export function SegmentedControl({
  legend,
  required,
  options,
  value,
  onChange,
}: {
  legend?: string;
  required?: boolean;
  options: readonly ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      {legend && (
        <legend className={labelClass}>
          {legend}
          {required ? ' *' : ''}
        </legend>
      )}
      <div
        role="radiogroup"
        className="inline-flex rounded-xl border border-border bg-surface-2 p-1"
      >
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                active ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

'use client';

import { useState, type FormEvent } from 'react';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const ROLE_OPTIONS = [
  'CIO',
  'CTO',
  'VP IT',
  'Program Manager',
  'Solution Architect',
  'Developer',
  'Other',
];

interface FieldErrors {
  name?: string;
  email?: string;
  company?: string;
  role?: string;
  message?: string;
}

function validate(fields: Record<string, string>): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.name.trim()) errors.name = 'Name is required.';
  if (!fields.email.trim()) {
    errors.email = 'Work email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!fields.company.trim()) errors.company = 'Company is required.';
  if (!fields.role) errors.role = 'Please select a role.';
  if (!fields.message.trim()) errors.message = 'Message is required.';
  return errors;
}

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');

    const fieldValues = { name, email, company, role, message };
    const fieldErrors = validate(fieldValues);
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) return;

    setStatus('submitting');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldValues),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Request failed.');
      }

      setStatus('success');
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Failed to send. Please try again.',
      );
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center" role="status">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="24" cy="24" r="24" fill="var(--color-success)" fillOpacity="0.12" />
          <path
            d="M15 24L21 30L33 18"
            stroke="var(--color-success)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h2
          className="text-[var(--font-size-h3)] font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Message sent
        </h2>
        <p
          className="text-[var(--font-size-body-m)] leading-relaxed max-w-md"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          We received your inquiry and will get back to you shortly.
        </p>
      </div>
    );
  }

  const inputBase =
    'w-full rounded-[var(--radius-button)] border bg-[var(--color-bg)] px-4 py-2.5 text-[var(--font-size-body-m)] text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-focus)] focus:ring-2 focus:ring-[var(--color-focus)]/25';

  const errorBorder = 'border-[var(--color-danger)]';
  const normalBorder = 'border-[var(--color-border)]';

  return (
    <form onSubmit={handleSubmit} noValidate>
      {status === 'error' && serverError && (
        <div
          role="alert"
          className="mb-6 rounded-[var(--radius-button)] border border-[var(--color-danger)] bg-[var(--color-danger)]/8 px-4 py-3 text-[var(--font-size-body-s)] text-[var(--color-danger)]"
        >
          {serverError}
        </div>
      )}

      <div className="flex flex-col gap-5">
        {/* Name */}
        <div>
          <label
            htmlFor="contact-name"
            className="mb-1.5 block text-[var(--font-size-body-s)] font-medium text-[var(--color-text-primary)]"
          >
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            className={`${inputBase} ${errors.name ? errorBorder : normalBorder}`}
          />
          {errors.name && (
            <p
              id="contact-name-error"
              role="alert"
              className="mt-1 text-[var(--font-size-caption)] text-[var(--color-danger)]"
            >
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="contact-email"
            className="mb-1.5 block text-[var(--font-size-body-s)] font-medium text-[var(--color-text-primary)]"
          >
            Work email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            className={`${inputBase} ${errors.email ? errorBorder : normalBorder}`}
          />
          {errors.email && (
            <p
              id="contact-email-error"
              role="alert"
              className="mt-1 text-[var(--font-size-caption)] text-[var(--color-danger)]"
            >
              {errors.email}
            </p>
          )}
        </div>

        {/* Company */}
        <div>
          <label
            htmlFor="contact-company"
            className="mb-1.5 block text-[var(--font-size-body-s)] font-medium text-[var(--color-text-primary)]"
          >
            Company
          </label>
          <input
            id="contact-company"
            type="text"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            aria-invalid={!!errors.company}
            aria-describedby={errors.company ? 'contact-company-error' : undefined}
            className={`${inputBase} ${errors.company ? errorBorder : normalBorder}`}
          />
          {errors.company && (
            <p
              id="contact-company-error"
              role="alert"
              className="mt-1 text-[var(--font-size-caption)] text-[var(--color-danger)]"
            >
              {errors.company}
            </p>
          )}
        </div>

        {/* Role */}
        <div>
          <label
            htmlFor="contact-role"
            className="mb-1.5 block text-[var(--font-size-body-s)] font-medium text-[var(--color-text-primary)]"
          >
            Role
          </label>
          <select
            id="contact-role"
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-invalid={!!errors.role}
            aria-describedby={errors.role ? 'contact-role-error' : undefined}
            className={`${inputBase} ${errors.role ? errorBorder : normalBorder} appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat`}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%235A6170' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
            }}
          >
            <option value="">Select your role</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {errors.role && (
            <p
              id="contact-role-error"
              role="alert"
              className="mt-1 text-[var(--font-size-caption)] text-[var(--color-danger)]"
            >
              {errors.role}
            </p>
          )}
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="contact-message"
            className="mb-1.5 block text-[var(--font-size-body-s)] font-medium text-[var(--color-text-primary)]"
          >
            Message
          </label>
          <textarea
            id="contact-message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'contact-message-error' : undefined}
            className={`${inputBase} resize-y ${errors.message ? errorBorder : normalBorder}`}
          />
          {errors.message && (
            <p
              id="contact-message-error"
              role="alert"
              className="mt-1 text-[var(--font-size-caption)] text-[var(--color-danger)]"
            >
              {errors.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-brand)] px-6 py-3 text-[var(--font-size-body-m)] font-medium text-white transition-colors hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'submitting' ? 'Sending...' : 'Send message'}
        </button>
      </div>

      <div aria-live="polite" className="sr-only">
        {status === 'submitting' && 'Sending your message...'}
        {status === 'error' && serverError}
      </div>
    </form>
  );
}

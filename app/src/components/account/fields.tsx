import type { ReactNode } from 'react'

// Bits of the account forms (stage 3) in the site's form style: a .field with
// its label, hint and error, plus the props every input of a form shares.

export type Option = { value: string; label: string }

export function Field({
  id,
  label,
  required: _required, // kept for the callers; account forms show no "*" (client, 15.10.2026)
  error,
  hint,
  children,
  wide,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className={`field${error ? ' invalid' : ''}${wide ? ' sm:col-span-2' : ''}`}>
      <label htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && !error ? <span className="form-note">{hint}</span> : null}
      <span id={`${id}-err`} className="field-error">
        {error}
      </span>
    </div>
  )
}

/** `input(name)` props and `select(name, options)` for one form: ids `<prefix>-<name>`,
 *  the stored value as default, the error wired to aria. */
export function formInputs(prefix: string, values: Record<string, string>, errors: Record<string, string>) {
  const input = (name: string, extra: Record<string, unknown> = {}) => ({
    id: `${prefix}-${name}`,
    name,
    defaultValue: values[name] ?? '',
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${prefix}-${name}-err` : undefined,
    ...extra,
  })
  const select = (name: string, options: Option[], placeholder?: string, extra: Record<string, unknown> = {}) => (
    <select {...input(name, extra)}>
      {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
      {options.map((op) => (
        <option key={op.value} value={op.value}>
          {op.label}
        </option>
      ))}
    </select>
  )
  return { input, select }
}

export function FormMessage({ message }: { message: string | null }) {
  return message ? (
    <div role="alert" className="mb-4 rounded-lg border border-[#c53030] bg-[#fdecec] px-4 py-3 text-sm text-[#c53030]">
      {message}
    </div>
  ) : null
}

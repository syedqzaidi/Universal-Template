'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

interface FormField {
  blockType: string
  name: string
  label?: string
  required?: boolean
  defaultValue?: string
  options?: Array<{ label: string; value: string }>
  message?: any
  width?: number
}

interface PayloadFormConfig {
  id: string
  title: string
  fields: FormField[]
  submitButtonLabel?: string
  confirmationType?: 'message' | 'redirect'
  confirmationMessage?: any
  redirect?: { url: string }
}

interface Props {
  formSlug: string
  contactInfo?: {
    phone?: string
    email?: string
    address?: string
    hours?: string
  }
}

export default function PayloadForm({ formSlug, contactInfo }: Props) {
  const [formConfig, setFormConfig] = useState<PayloadFormConfig | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  useEffect(() => {
    const baseUrl = import.meta.env.PUBLIC_PAYLOAD_URL || ''
    fetch(`${baseUrl}/api/forms?where[title][equals]=${encodeURIComponent(formSlug)}&limit=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data.docs?.[0]) {
          setFormConfig(data.docs[0])
        } else {
          setError('Form not found')
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load form')
        setLoading(false)
      })
  }, [formSlug])

  const onSubmit = async (data: Record<string, any>) => {
    if (!formConfig) return
    setError(null)

    try {
      const baseUrl = import.meta.env.PUBLIC_PAYLOAD_URL || ''
      const res = await fetch(`${baseUrl}/api/form-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: formConfig.id,
          submissionData: Object.entries(data).map(([field, value]) => ({
            field,
            value: String(value),
          })),
        }),
      })

      if (!res.ok) throw new Error('Submission failed')
      setSubmitted(true)

      if (formConfig.confirmationType === 'redirect' && formConfig.redirect?.url) {
        window.location.href = formConfig.redirect.url
        return
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  if (loading) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />
  }

  if (submitted) {
    return (
      <div className="text-center py-12 px-6 bg-muted/50 rounded-xl">
        <h3 className="text-xl font-semibold mb-2">Thank you!</h3>
        <p className="text-muted-foreground">
          {formConfig?.confirmationMessage
            ? (typeof formConfig.confirmationMessage === 'string'
                ? formConfig.confirmationMessage
                : "We've received your message and will get back to you shortly.")
            : "We've received your message and will get back to you shortly."}
        </p>
      </div>
    )
  }

  if (!formConfig) {
    return error ? <p className="text-destructive">{error}</p> : null
  }

  const renderField = (field: FormField) => {
    const baseClasses = 'w-full px-4 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary'

    switch (field.blockType) {
      case 'text':
      case 'email':
        return (
          <input
            type={field.blockType === 'email' ? 'email' : 'text'}
            {...register(field.name, {
              required: field.required,
              pattern: field.blockType === 'email' ? { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' } : undefined,
            })}
            placeholder={field.label}
            className={baseClasses}
          />
        )
      case 'textarea':
        return (
          <textarea
            {...register(field.name, { required: field.required })}
            placeholder={field.label}
            rows={4}
            className={baseClasses}
          />
        )
      case 'select':
        return (
          <select
            {...register(field.name, { required: field.required })}
            className={baseClasses}
          >
            <option value="">{field.label || 'Select...'}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register(field.name, { required: field.required })}
              className="rounded border-input"
            />
            <span className="text-sm">{field.label}</span>
          </label>
        )
      case 'number':
        return (
          <input
            type="number"
            {...register(field.name, { required: field.required })}
            placeholder={field.label}
            className={baseClasses}
          />
        )
      case 'message':
        return null
      default:
        return (
          <input
            type="text"
            {...register(field.name, { required: field.required })}
            placeholder={field.label}
            className={baseClasses}
          />
        )
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {formConfig.fields.map((field, i) => (
            <div key={`${field.name}-${i}`}>
              {field.blockType !== 'checkbox' && field.blockType !== 'message' && field.label && (
                <label className="block text-sm font-medium mb-1.5">
                  {field.label}
                  {field.required && <span className="text-destructive ml-0.5">*</span>}
                </label>
              )}
              {renderField(field)}
              {errors[field.name] && (
                <p className="text-sm text-destructive mt-1">
                  {(errors[field.name]?.message as string) || 'This field is required'}
                </p>
              )}
            </div>
          ))}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : formConfig.submitButtonLabel || 'Send Message'}
          </button>
        </form>
      </div>

      {contactInfo && (
        <div className="lg:col-span-2 space-y-6">
          {contactInfo.phone && (
            <div>
              <h3 className="font-semibold mb-1">Phone</h3>
              <a href={`tel:${contactInfo.phone}`} className="text-primary hover:underline">
                {contactInfo.phone}
              </a>
            </div>
          )}
          {contactInfo.email && (
            <div>
              <h3 className="font-semibold mb-1">Email</h3>
              <a href={`mailto:${contactInfo.email}`} className="text-primary hover:underline">
                {contactInfo.email}
              </a>
            </div>
          )}
          {contactInfo.address && (
            <div>
              <h3 className="font-semibold mb-1">Address</h3>
              <p className="text-muted-foreground">{contactInfo.address}</p>
            </div>
          )}
          {contactInfo.hours && (
            <div>
              <h3 className="font-semibold mb-1">Hours</h3>
              <p className="text-muted-foreground">{contactInfo.hours}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

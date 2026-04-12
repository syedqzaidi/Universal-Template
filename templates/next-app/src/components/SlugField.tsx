'use client'

import { TextInput, useField, useFormFields, FieldLabel } from '@payloadcms/ui'
import React, { useCallback, useEffect } from 'react'

/**
 * Custom slug field that auto-generates from name/title/displayName.
 * Lock toggle: locked = auto-generates, unlocked = manual edit.
 */
const SlugField: React.FC<{ field: any; path?: string; readOnly?: boolean }> = ({
  field,
  path = 'slug',
  readOnly,
}) => {
  const { value = '', setValue } = useField<string>({ path })
  const [locked, setLocked] = React.useState(!value)

  const nameValue = useFormFields(([fields]: any) => {
    return (
      fields?.name?.value ||
      fields?.title?.value ||
      fields?.displayName?.value ||
      ''
    ) as string
  })

  const slugify = useCallback((text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }, [])

  useEffect(() => {
    if (locked && nameValue) {
      setValue(slugify(nameValue))
    }
  }, [locked, nameValue, slugify, setValue])

  useEffect(() => {
    if (!value && nameValue) {
      setValue(slugify(nameValue))
      setLocked(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <FieldLabel label={field?.label || 'Slug'} path={path} required={field?.required} />
        <button
          type="button"
          onClick={() => setLocked((l: boolean) => !l)}
          style={{
            background: 'none',
            border: '1px solid var(--theme-elevation-300)',
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {locked ? 'Auto' : 'Manual'}
        </button>
      </div>
      <TextInput
        path={path}
        value={value}
        onChange={(e: any) => {
          if (!locked) {
            setValue(e.target.value)
          }
        }}
        readOnly={readOnly || locked}
        label=""
        showError={false}
      />
    </div>
  )
}

export default SlugField

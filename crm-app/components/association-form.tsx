"use client"

import { FormEvent, useEffect, useState } from 'react'
import type { Association, Municipality } from '@/lib/api'

export interface AssociationFormValues {
  name: string
  municipality_id: number | null
  type: string | null
  status: string | null
  email: string | null
  phone: string | null
  address: string | null
  website: string | null
  description: string | null
}

interface AssociationFormProps {
  initial?: Partial<Association>
  municipalities: Municipality[]
  onSubmit: (values: AssociationFormValues) => Promise<void>
  onCancel: () => void
  submitLabel: string
  isSubmitting?: boolean
}

const blankValues: AssociationFormValues = {
  name: '',
  municipality_id: null,
  type: null,
  status: null,
  email: null,
  phone: null,
  address: null,
  website: null,
  description: null,
}

function trimNullable(value: string | null): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function validateValues(values: AssociationFormValues): string | null {
  if (!values.name.trim()) {
    return 'Namn är obligatoriskt.'
  }

  if (values.email) {
    const email = values.email.trim()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i
    if (!emailPattern.test(email)) {
      return 'Ogiltig e-postadress.'
    }
  }

  if (values.website) {
    const website = values.website.trim()
    let isValidUrl = false
    try {
      new URL(website)
      isValidUrl = true
    } catch {
      try {
        new URL(`https://${website}`)
        isValidUrl = true
      } catch {
        isValidUrl = false
      }
    }
    if (!isValidUrl) {
      return 'Ogiltig webbadress.'
    }
  }

  return null
}

export function AssociationForm({ initial, municipalities, onSubmit, onCancel, submitLabel, isSubmitting }: AssociationFormProps) {
  const [values, setValues] = useState<AssociationFormValues>({
    ...blankValues,
    ...normalizeInitial(initial),
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setValues({
      ...blankValues,
      ...normalizeInitial(initial),
    })
    setError(null)
  }, [initial])

  function normalizeInitial(data?: Partial<Association>): AssociationFormValues {
    if (!data) {
      return { ...blankValues }
    }
    return {
      name: data.name ?? '',
      municipality_id: data.municipality_id ?? null,
      type: data.type ?? null,
      status: data.status ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      website: data.website ?? null,
      description: data.description ?? null,
    }
  }

  function handleChange(field: keyof AssociationFormValues, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value.trim() === '' && field !== 'name' ? null : value,
    }))
  }

  function handleMunicipalityChange(value: string) {
    setValues((current) => ({
      ...current,
      municipality_id: value === '' ? null : Number(value),
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const sanitized: AssociationFormValues = {
      name: values.name.trim(),
      municipality_id: values.municipality_id ?? null,
      type: trimNullable(values.type),
      status: trimNullable(values.status),
      email: trimNullable(values.email),
      phone: trimNullable(values.phone),
      address: trimNullable(values.address),
      website: trimNullable(values.website),
      description: trimNullable(values.description),
    }

    const validationError = validateValues(sanitized)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    await onSubmit(sanitized)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="name">
            Namn
          </label>
          <input
            id="name"
            required
            value={values.name}
            onChange={(event) => handleChange('name', event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="municipality_id">
            Kommun
          </label>
          <select
            id="municipality_id"
            value={values.municipality_id ?? ''}
            onChange={(event) => handleMunicipalityChange(event.target.value)}
          >
            <option value="">Alla kommuner</option>
            {municipalities.map((municipality) => (
              <option key={municipality.id} value={municipality.id}>
                {municipality.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="type">
            Typ
          </label>
          <input id="type" value={values.type ?? ''} onChange={(event) => handleChange('type', event.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="status">
            Status
          </label>
          <input id="status" value={values.status ?? ''} onChange={(event) => handleChange('status', event.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            E-post
          </label>
          <input id="email" type="email" value={values.email ?? ''} onChange={(event) => handleChange('email', event.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="phone">
            Telefon
          </label>
          <input id="phone" value={values.phone ?? ''} onChange={(event) => handleChange('phone', event.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="address">
            Adress
          </label>
          <input id="address" value={values.address ?? ''} onChange={(event) => handleChange('address', event.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="website">
            Webbplats
          </label>
          <input id="website" value={values.website ?? ''} onChange={(event) => handleChange('website', event.target.value)} />
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="description">
            Beskrivning
          </label>
          <textarea
            id="description"
            rows={4}
            value={values.description ?? ''}
            onChange={(event) => handleChange('description', event.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="border border-slate-300 bg-white text-slate-700" onClick={onCancel}>
          Avbryt
        </button>
        <button type="submit" className="bg-sky-600 text-white hover:bg-sky-700" disabled={isSubmitting}>
          {isSubmitting ? 'Sparar…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

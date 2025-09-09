import React from "react"
import { Label } from "@/shared/components/atoms/label"
import { Input } from "@/shared/components/atoms/input"
import { Select } from "@/shared/components/atoms/select"
import { Textarea } from "@/shared/components/atoms/textarea"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  className?: string
  children?: React.ReactNode
}

export function FormField({ 
  label, 
  required, 
  error, 
  className, 
  children 
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label required={required}>{label}</Label>
      {children}
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}

interface InputFieldProps extends FormFieldProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  name?: string
}

export function InputField({ 
  label, 
  required, 
  error, 
  className, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  name,
  ...props 
}: InputFieldProps) {
  return (
    <FormField label={label} required={required} error={error} className={className}>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
        className={error ? "border-red-300 focus-visible:ring-red-500" : ""}
        {...props}
      />
    </FormField>
  )
}

interface SelectFieldProps extends FormFieldProps {
  options: { value: string; label: string }[]
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  name?: string
}

export function SelectField({ 
  label, 
  required, 
  error, 
  className, 
  options, 
  placeholder, 
  value, 
  onChange, 
  name,
  ...props 
}: SelectFieldProps) {
  return (
    <FormField label={label} required={required} error={error} className={className}>
      <Select
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
        className={error ? "border-red-300 focus-visible:ring-red-500" : ""}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FormField>
  )
}

interface TextareaFieldProps extends FormFieldProps {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  name?: string
  rows?: number
}

export function TextareaField({ 
  label, 
  required, 
  error, 
  className, 
  placeholder, 
  value, 
  onChange, 
  name,
  rows = 4,
  ...props 
}: TextareaFieldProps) {
  return (
    <FormField label={label} required={required} error={error} className={className}>
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
        rows={rows}
        className={error ? "border-red-300 focus-visible:ring-red-500" : ""}
        {...props}
      />
    </FormField>
  )
}
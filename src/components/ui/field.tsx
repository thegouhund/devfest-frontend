import * as React from "react"
import { cn } from "cn"

interface FieldProps extends React.ComponentProps<"div"> {
  isInvalid?: boolean
}

function Field({ className, isInvalid, children, ...props }: FieldProps) {
  return (
    <div
      data-slot="field"
      data-invalid={isInvalid}
      className={cn("w-full space-y-1.5", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function FieldError({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  if (!children) return null
  return (
    <p
      data-slot="field-error"
      className={cn("text-xs text-red-500 font-medium mt-1", className)}
      {...props}
    >
      {children}
    </p>
  )
}

const TextField = Field

export { Field, TextField, FieldError }

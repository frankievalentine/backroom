import * as z from "zod"

/**
 * The contact form's validation rules, in one place.
 *
 * Imported by both the client form and the API route so the two cannot disagree
 * about what a valid submission is. The inline field errors the visitor sees and
 * the 400s the route returns are the same strings, generated from the same
 * schema.
 *
 * Messages are the form's existing copy, moved here rather than rewritten. They
 * are deliberately plain ("Tell us what you need.") rather than zod's default
 * constraint text ("Too small: expected string to have >=1 characters"), because
 * this form receives takedown requests from people who are not being asked to
 * learn a validation library.
 */

/** Which kind of request, so it can be triaged without reading the message. */
export const contactKinds = ["general", "privacy", "rights"] as const

export const contactSchema = z.object({
  kind: z.enum(contactKinds, {
    error: "Unknown request type.",
  }),

  /*
    `z.string().trim().pipe(z.email())`, not `z.email().trim()`.

    Both look equivalent and are not. `z.email()` is itself a string schema that
    runs an email-format check, and `.trim()` is registered after it, so the
    check still sees the raw input. An address pasted with surrounding whitespace
    is rejected even though it is perfectly valid. Piping a trimmed string into
    `z.email()` is the only ordering where the format check sees trimmed input.

    Length is checked on the raw value before the pipe, so it bounds what a
    client can send rather than what gets stored. That matches the previous
    `.trim().slice(0, 200)` behaviour.
  */
  email: z
    .string({ error: "Enter an email address so we can reply." })
    .trim()
    .min(1, { error: "Enter an email address so we can reply." })
    .max(200, { error: "That email address is too long." })
    .pipe(z.email({ error: "Enter an email address so we can reply." })),

  /*
    Optional rather than required. `undefined` (absent) is accepted, and so is
    `""`, which is what an empty text input actually submits — so the field needs
    no normalizer to stay optional.
  */
  domain: z
    .string()
    .trim()
    .max(200, { error: "That domain is too long." })
    .optional(),

  message: z
    .string()
    .trim()
    .min(1, { error: "Tell us what you need." })
    .max(4000, {
      error: "That message is too long. Keep it under 4000 characters.",
    }),
})

/** What the client collects and the route receives, before validation. */
export type ContactInput = z.input<typeof contactSchema>

/** A validated submission. `domain` is trimmed, possibly absent. */
export type Contact = z.output<typeof contactSchema>

/**
 * Flatten a validation failure into one message per field.
 *
 * `z.flattenError` rather than `error.flatten()`, which is deprecated in zod 4.
 * Every field here is flat, so the shallow result is sufficient.
 *
 * Returns an empty object when parsing succeeds, so callers can branch on
 * emptiness rather than on the result union.
 */
export function firstFieldErrors(
  error: z.ZodError<ContactInput>
): Partial<Record<keyof ContactInput, string>> {
  /*
    Parameterized as `z.ZodError<ContactInput>` rather than bare `z.ZodError`.

    `z.flattenError` is generic in the error's value type. A bare `z.ZodError`
    leaves that type as `unknown`, which collapses `fieldErrors` to `{}` and makes
    every property access on it a type error. Passing the concrete input type
    gives `fieldErrors` a real shape, so `messages[0]` is checked rather than
    assumed.
  */
  const { fieldErrors } = z.flattenError(error)

  return Object.fromEntries(
    Object.entries(fieldErrors).flatMap(([field, messages]) =>
      messages?.[0] ? [[field, messages[0]]] : []
    )
  ) as Partial<Record<keyof ContactInput, string>>
}

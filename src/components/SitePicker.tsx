"use client"

import {
  ChevronDownIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { SavedSite } from "@/hooks/use-saved-sites"
import { normalizeDomain } from "@/lib/domain"

type SitePickerProps = {
  sites: SavedSite[]
  selectedDomain: string | null
  status: "idle" | "loading" | "success" | "error"
  /** Inline validation or transport error for the current input. */
  inputError: string | null
  onSelect: (domain: string) => void
  onSubmitDomain: (rawInput: string) => void
  onRemoveSite: (domain: string) => void
}

const SITE_PICKER_LABEL = "Scrape a store"

/**
 * Store picker: a validated free-text field plus a popover listing saved stores.
 *
 * Deliberately a Popover rather than a DropdownMenu. A menu owns keyboard focus
 * and expects one action per row; the previous implementation nested two
 * `<button>` elements inside a single menu item, which left the remove button
 * unreachable by keyboard. Rows in a popover are ordinary content, so each one
 * can expose its own controls.
 */
export const SitePicker = ({
  sites,
  selectedDomain,
  status,
  inputError,
  onSelect,
  onSubmitDomain,
  onRemoveSite,
}: SitePickerProps) => {
  const [draft, setDraft] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [localError, setLocalError] = React.useState<string | null>(null)

  const isLoading = status === "loading"
  const error = localError ?? inputError

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalized = normalizeDomain(draft)

    if (!normalized.ok) {
      setLocalError(normalized.reason)
      return
    }

    setLocalError(null)
    setOpen(false)
    onSubmitDomain(normalized.domain)
  }

  const handleDraftChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value)

    if (localError) setLocalError(null)
  }

  const handleRemove = (
    event: React.MouseEvent<HTMLButtonElement>,
    domain: string
  ) => {
    event.stopPropagation()
    onRemoveSite(domain)
  }

  return (
    // Capped: a domain field stretched across a wide viewport reads as a search
    // box and invites the wrong kind of input. The saved-stores trigger sits
    // beside it, right-aligned, so the pair stays together on one line.
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-2xl items-start gap-2"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <label
          htmlFor="site-picker-input"
          className="text-xs font-medium text-muted-foreground"
        >
          {SITE_PICKER_LABEL}
        </label>

        <InputGroup className="h-9">
          <InputGroupInput
            id="site-picker-input"
            name="domain"
            type="text"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="allbirds.com"
            value={draft}
            onChange={handleDraftChange}
            disabled={isLoading}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "site-picker-error" : undefined}
          />

          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="submit"
              variant="ghost"
              size="icon-xs"
              disabled={isLoading || !draft.trim()}
              aria-label="Scrape this store"
            >
              {isLoading ? (
                <Loader2Icon
                  className="animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <PlusIcon aria-hidden="true" />
              )}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        {error && (
          <p
            id="site-picker-error"
            role="alert"
            className="text-xs font-medium text-destructive"
          >
            {error}
          </p>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0 gap-1.5"
            />
          }
        >
          <span className="tabular-nums">
            {sites.length} saved {sites.length === 1 ? "store" : "stores"}
          </span>
          <ChevronDownIcon className="size-3.5 opacity-60" aria-hidden="true" />
        </PopoverTrigger>

        <PopoverContent align="end" className="w-72 p-0">
          {sites.length === 0 ? (
            <Empty className="border-0 p-6">
              <EmptyHeader>
                <EmptyTitle>No saved stores</EmptyTitle>
                <EmptyDescription>
                  Enter a domain above to save it here for next time.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="max-h-72 overflow-y-auto p-1">
              {sites.map((site) => {
                const isSelected = site.domain === selectedDomain

                return (
                  <li key={site.domain}>
                    <div
                      className={
                        "flex items-center gap-1 rounded-md px-1 transition-colors hover:bg-accent has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-ring has-[button:focus-visible]:ring-inset"
                      }
                      data-selected={isSelected ? "true" : undefined}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onSelect(site.domain)
                          setOpen(false)
                        }}
                        className="min-w-0 flex-1 justify-start font-normal"
                      >
                        <span className="truncate">{site.domain}</span>
                        {isSelected && (
                          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                            Loaded
                          </span>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={(event) => handleRemove(event, site.domain)}
                        aria-label={`Remove ${site.domain} from saved stores`}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2Icon aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    </form>
  )
}

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

const SITE_PICKER_LABEL = "Explore a store"

/**
 * Store picker: a validated free-text field plus a popover listing saved stores.
 *
 * Deliberately a Popover rather than a DropdownMenu. A menu owns keyboard focus
 * and expects one action per row; the previous implementation nested two
 * `<button>` elements inside a single menu item, which left the remove button
 * unreachable by keyboard. Rows in a popover are ordinary content, so each one
 * can expose its own controls.
 *
 * The label is synced to `selectedDomain` below. A store opened from the home
 * page arrives as `?domain=`, so the server loads and streams it, and by the
 * time this mounts the field would otherwise still read empty -- leaving the
 * toolbar looking like nothing was selected while the whole grid sat below it.
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
  const [open, setOpen] = React.useState(false)
  const [localError, setLocalError] = React.useState<string | null>(null)

  /*
    The draft starts as the selected store rather than empty.

    On a `?domain=` arrival from the home page, `selectedDomain` is already
    correct on the very first render, so a later sync effect would never fire
    and the field would sit blank above a fully loaded grid. Seeding initial
    state from the prop handles that case; the sync below handles everything
    after, when the selection changes.

    Guarded so it never fights the user mid-edit: the draft is only overwritten
    when it is empty or still equals the store we last wrote into it, so
    whatever is in the box came from us rather than from a keystroke.
  */
  const [draft, setDraft] = React.useState(selectedDomain ?? "")
  const [syncedDomain, setSyncedDomain] = React.useState(selectedDomain)

  if (selectedDomain !== syncedDomain) {
    setSyncedDomain(selectedDomain)

    if (draft === "" || draft === syncedDomain) {
      setDraft(selectedDomain ?? "")
    }
  }

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
    /*
      Capped: a domain field stretched across a wide viewport reads as a search
      box and invites the wrong kind of input.

      The label is a full-width row of its own rather than the first child of the
      field's column. It used to sit inside that column, so the `h-9` saved-stores
      trigger -- a sibling of the column, not of the input -- lined up with the
      label's top edge and floated a line above the input it belongs with. Putting
      the label above both controls lets the field and the trigger share one row
      and align on the same baseline.
    */
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <label
        htmlFor="site-picker-input"
        className="mb-1.5 block text-xs font-medium text-muted-foreground"
      >
        {SITE_PICKER_LABEL}
      </label>

      {/*
          Wraps rather than sits on one row. The saved-stores trigger is a fixed
          width that cannot shrink, so on a narrow viewport it pushed the field
          past the right edge. Letting it drop below keeps the domain input --
          the primary control -- full width and still reachable.
        */}
      <div className="flex min-w-0 flex-1 flex-wrap items-start gap-2">
        <InputGroup className="h-9 min-w-0 flex-1">
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
              aria-label="Explore this store"
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
            <ChevronDownIcon
              className="size-3.5 opacity-60"
              aria-hidden="true"
            />
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
      </div>

      {error && (
        <p
          id="site-picker-error"
          role="alert"
          className="mt-1.5 text-xs font-medium text-destructive"
        >
          {error}
        </p>
      )}
    </form>
  )
}

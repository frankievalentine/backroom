import { cn } from "@/lib/utils"

/**
 * First focusable element on a page.
 *
 * The app puts a sticky header and a full-height filter sidebar in front of the
 * content, so without this a keyboard user tabs through the whole chrome on
 * every page before reaching anything. Hidden until focused, then parked in the
 * top-left where it cannot overlap the header.
 */
export const SkipLink = ({
  targetId = "main-content",
  className,
}: {
  targetId?: string
  className?: string
}) => (
  <a
    href={`#${targetId}`}
    className={cn(
      "sr-only rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:outline-2 focus:outline-offset-2 focus:outline-ring",
      className
    )}
  >
    Skip to content
  </a>
)

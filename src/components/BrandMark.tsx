/**
 * The Backroom mark: a door in a doorway, swinging slowly open and shut.
 *
 * Extracted so the site header and the catalog sidebar cannot drift apart.
 * Decorative: every caller sits it beside the wordmark, so it is `aria-hidden`.
 *
 * The leaf is filled, not stroked, and that is load-bearing. Measured on the real
 * page, `rotateY` collapsed a 2-unit stroke from 9px to 2.18px, a 76% squash that
 * read as a stroke-width bug. A solid panel squashes the way a real object in
 * perspective does. `vector-effect: non-scaling-stroke` holds the width steady
 * but leaves the leaf looking shut, so it is not a fix.
 *
 * The knob is a second subpath under `fill-rule="evenodd"`, punching a hole
 * through the leaf; a separate stroked circle would deform the same way.
 */

/** The leaf outline, and the knob as a subpath of the same path. */
const LEAF_PATH =
  "M6.6 20.4V9a5.4 5.4 0 0 1 10.8 0v11.4Z" +
  "M13.5 13.6a1.05 1.05 0 1 0 2.1 0a1.05 1.05 0 1 0 -2.1 0Z"

/** The opening behind the leaf: the dark of the back room. */
const OPENING_PATH = "M6 20.6V9a6 6 0 0 1 12 0v11.6Z"

export const BrandMark = () => (
  <span
    aria-hidden="true"
    className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"
  >
    <svg viewBox="0 0 24 24" className="size-5">
      <path d={OPENING_PATH} fill="currentColor" opacity={0.16} />

      {/* The swing, the play-once on load and the reduced-motion opt-out live in
          globals.css under .brand-door-leaf. */}
      <g className="brand-door-leaf">
        <path d={LEAF_PATH} fill="currentColor" fillRule="evenodd" />
      </g>
    </svg>
  </span>
)

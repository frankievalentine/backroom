/**
 * The Backroom mark: a door in a doorway, swinging slowly open and shut.
 *
 * Extracted so the site header and the catalog sidebar cannot drift apart. Both
 * previously rendered the same badge inline, which is exactly the kind of
 * duplication that ends with one of them a release behind.
 *
 * The glyph is decorative. Every caller sits it beside the "Backroom" wordmark
 * or a link label, so it is `aria-hidden` and adds nothing for a screen reader.
 *
 * The leaf is FILLED, not stroked, and that is load-bearing. A stroke cannot be
 * foreshortened by a 3D transform without deforming along with the geometry it
 * outlines -- measured on the real page, rotateY collapsed the painted width of
 * a 2-unit stroke from 9px to 2.18px, a 76% squash that read as a stroke-width
 * bug. Filling the leaf sidesteps it: a solid panel squashes the way a real
 * object in perspective does, which is what the eye expects. vector-effect:
 * non-scaling-stroke holds the width steady but leaves the leaf looking shut
 * rather than open, so it is not a fix.
 *
 * The knob is a second subpath in the same <path> with fill-rule="evenodd",
 * which punches a hole through the leaf so whatever is behind shows through.
 * A separate stroked circle would have the same deformation problem.
 *
 * NOTE: src/app/icon.svg is this same geometry frozen closed, since a favicon
 * cannot animate. An SVG icon cannot read the page's custom properties, so the
 * colours there are literals -- if the geometry changes here, change it there.
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

      {/* Hinged on its left edge. The swing, the play-once-on-load and the
          reduced-motion opt-out all live in globals.css under .brand-door-leaf. */}
      <g className="brand-door-leaf">
        <path d={LEAF_PATH} fill="currentColor" fillRule="evenodd" />
      </g>
    </svg>
  </span>
)

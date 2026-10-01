import { NextResponse } from "next/server"

/**
 * The tool used to live at `/scraper`. Redirect rather than 404, so links
 * shared before the rename keep working.
 *
 * Query parameters are carried across, so an old deep link such as
 * `/scraper?domain=cuyana.com` still lands on a loaded store.
 */
export function GET(request: Request) {
  const { search } = new URL(request.url)

  return NextResponse.redirect(new URL(`/backroom${search}`, request.url), {
    // Permanent: this path is never coming back, and 308 keeps the method and
    // body intact for anything non-GET that might hit it.
    status: 308,
  })
}

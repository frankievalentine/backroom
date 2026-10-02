import { NextResponse } from "next/server"

/**
 * The tool used to live at `/scraper`. Redirect rather than 404, carrying the
 * query string across so an old deep link like `/scraper?domain=cuyana.com` still
 * lands on a loaded store.
 */
export function GET(request: Request) {
  const { search } = new URL(request.url)

  return NextResponse.redirect(new URL(`/backroom${search}`, request.url), {
    // Permanent: this path is never coming back, and 308 keeps the method and
    // body intact for anything non-GET that might hit it.
    status: 308,
  })
}

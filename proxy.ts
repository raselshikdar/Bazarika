import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

export default async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/orders/:path*",
    "/checkout/:path*",
    "/wishlist/:path*",
    "/login",
    "/register",
  ],
}

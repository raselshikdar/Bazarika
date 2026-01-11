import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
      Protect ALL routes including nested ones
    */
    "/admin/:path*",
    "/profile/:path*",
    "/orders/:path*",
    "/checkout/:path*",
    "/wishlist/:path*",
    "/login",
    "/register",
  ],
}

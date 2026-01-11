import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successfully confirmed - redirect to intended page or home
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If no code or error, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}

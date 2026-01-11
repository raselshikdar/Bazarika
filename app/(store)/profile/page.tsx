import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { ProfileContent } from "@/components/profile/profile-content"
import type { Profile, Address } from "@/types/database"

export const metadata: Metadata = {
  title: "My Profile | Bazarika",
  description: "Manage your account settings",
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/profile")
  }

  // Get profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get addresses
  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      <ProfileContent user={user} profile={profile as Profile} addresses={(addresses as Address[]) || []} />
    </div>
  )
}

import { useState, useEffect } from "react"
import { supabase } from "../integrations/supabase/client.ts"

export interface Profile {
  id: string
  role: "patient" | "verifier" | "admin"
  org_name: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        setProfile(null)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (error) {
        console.error("Error fetching profile:", error)
        setProfile(null)
      } else {
        setProfile(data as Profile)
      }

      setLoading(false)
    }

    fetchProfile()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setProfile(data as Profile)
          })
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const updateProfile = async (updates: Partial<Profile>) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return { error: new Error("Not authenticated") }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", session.user.id)
      .select()
      .single()

    if (!error && data) {
      setProfile(data as Profile)
    }

    return { data, error }
  }

  return { profile, loading, updateProfile }
}
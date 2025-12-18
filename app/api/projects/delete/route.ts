import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

const ARCHIVE_USER_EMAIL = "contact@thinktrace.net"

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId } = body

    // Validate input
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      )
    }

    // Verify the project belongs to the user
    const { data: project, error: projectError } = await supabase
      .from("repositories")
      .select("id, user_id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      )
    }

    // Get the archive user's ID (contact@thinktrace.net)
    const { data: archiveUser, error: archiveError } = await supabase
      .from("users")
      .select("id")
      .eq("email", ARCHIVE_USER_EMAIL)
      .single()

    if (archiveError || !archiveUser) {
      console.error("Archive user not found:", archiveError)
      return NextResponse.json(
        { error: "Failed to process deletion" },
        { status: 500 }
      )
    }

    // Transfer ownership to archive user instead of deleting
    const { error: updateError } = await supabase
      .from("repositories")
      .update({
        user_id: archiveUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)

    if (updateError) {
      console.error("Failed to archive project:", updateError)
      return NextResponse.json(
        { error: "Failed to delete project" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

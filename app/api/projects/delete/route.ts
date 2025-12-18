import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { deleteProject } from "@/lib/api/client"

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

    // Get user's API key for external API call
    const { data: userData } = await supabase
      .from("users")
      .select("api_key")
      .eq("id", user.id)
      .single()

    const apiKey = userData?.api_key

    // Call external API to delete (archive) project
    const success = await deleteProject(projectId, user.id, apiKey)

    if (!success) {
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

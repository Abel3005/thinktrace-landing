import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { createProject } from "@/lib/api/client"

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
    const { name, description, userId } = body

    // Validate input
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      )
    }

    // Verify userId matches authenticated user
    if (userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get user's API key for external API call
    const { data: userData } = await supabase
      .from("users")
      .select("api_key")
      .eq("id", user.id)
      .single()

    const apiKey = userData?.api_key

    // Call external API to create project
    const result = await createProject(
      userId,
      name.trim(),
      description?.trim() || undefined,
      apiKey
    )

    if (!result) {
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      project: result.project,
      hash: result.hash,
    })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

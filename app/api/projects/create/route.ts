import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { createHash, randomBytes } from "crypto"

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

    // Generate unique hash for the project
    // Combination of timestamp, random bytes, and project name
    const timestamp = Date.now().toString()
    const random = randomBytes(16).toString("hex")
    const projectHash = createHash("sha256")
      .update(`${name}-${timestamp}-${random}`)
      .digest("hex")
      .substring(0, 16) // Use first 32 characters

    // Insert project into database
    // Assuming you have a 'repositories' or 'projects' table
    const { data, error } = await supabase
      .from("repositories")
      .insert({
        user_id: userId,
        repo_name: name.trim(),
        description: description?.trim() || null,
        repo_hash: projectHash,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      project: data,
      hash: projectHash,
    })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

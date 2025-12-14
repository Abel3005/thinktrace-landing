export type Platform =
  | "darwin-amd64"
  | "darwin-arm64"
  | "linux-amd64"
  | "linux-arm64"
  | "windows-amd64"

export interface PlatformInfo {
  platform: Platform
  os: string
  arch: string
  displayName: string
  extension: string
}

const platformDisplayNames: Record<Platform, string> = {
  "darwin-amd64": "macOS (Intel)",
  "darwin-arm64": "macOS (Apple Silicon)",
  "linux-amd64": "Linux (x64)",
  "linux-arm64": "Linux (ARM64)",
  "windows-amd64": "Windows (x64)",
}

export function detectPlatform(): PlatformInfo | null {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return null
  }

  const userAgent = navigator.userAgent.toLowerCase()
  const platform = navigator.platform?.toLowerCase() || ""

  // Detect OS
  let os: "darwin" | "linux" | "windows" = "linux"
  if (userAgent.includes("mac") || platform.includes("mac")) {
    os = "darwin"
  } else if (userAgent.includes("win") || platform.includes("win")) {
    os = "windows"
  } else if (userAgent.includes("linux") || platform.includes("linux")) {
    os = "linux"
  }

  // Detect architecture
  let arch: "amd64" | "arm64" = "amd64"

  // Check for ARM architecture
  if (
    userAgent.includes("arm64") ||
    userAgent.includes("aarch64") ||
    platform.includes("arm") ||
    // @ts-expect-error - userAgentData is not in TypeScript types yet
    navigator.userAgentData?.platform?.toLowerCase().includes("arm")
  ) {
    arch = "arm64"
  }

  // macOS specific: check for Apple Silicon
  if (os === "darwin") {
    // Modern detection using userAgentData
    // @ts-expect-error - userAgentData is not in TypeScript types yet
    const uaData = navigator.userAgentData
    if (uaData) {
      // Check brands for architecture hints
      const brands = uaData.brands || []
      const isARM = brands.some((b: { brand: string }) =>
        b.brand.toLowerCase().includes("arm")
      )
      if (isARM) {
        arch = "arm64"
      }
    }

    // Heuristic: newer Macs (2020+) are likely ARM
    // This is a fallback when we can't detect precisely
    // Users can always manually select if needed
  }

  // Windows only supports amd64 in our dist
  if (os === "windows") {
    arch = "amd64"
  }

  const detectedPlatform: Platform = `${os}-${arch}` as Platform

  return {
    platform: detectedPlatform,
    os,
    arch,
    displayName: platformDisplayNames[detectedPlatform],
    extension: os === "windows" ? ".exe" : "",
  }
}

export function getAllPlatforms(): { platform: Platform; displayName: string }[] {
  return [
    { platform: "darwin-arm64", displayName: "macOS (Apple Silicon)" },
    { platform: "darwin-amd64", displayName: "macOS (Intel)" },
    { platform: "linux-amd64", displayName: "Linux (x64)" },
    { platform: "linux-arm64", displayName: "Linux (ARM64)" },
    { platform: "windows-amd64", displayName: "Windows (x64)" },
  ]
}

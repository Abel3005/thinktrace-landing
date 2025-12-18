/**
 * External API Client
 * NEXT_PUBLIC_API_URL 서버와 통신하는 클라이언트
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.thinktrace.net';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  apiKey?: string;
}

class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, apiKey } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  const config: RequestInit = {
    method,
    headers,
    cache: 'no-store',
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, config);
  const result: ApiResponse<T> = await response.json();

  if (!response.ok || !result.success) {
    throw new ApiError(
      result.error || 'Unknown error',
      result.code || 'UNKNOWN_ERROR',
      response.status
    );
  }

  return result.data as T;
}

// ============================================================================
// Statistics API
// ============================================================================

import type { UserStatistics, ContributionData, ProjectStatistics, ProjectInfo, ProjectCommit, AIInteraction, RepositoryLookup } from './types';

export async function fetchUserStatistics(
  userId: string,
  apiKey?: string
): Promise<UserStatistics | null> {
  try {
    return await apiRequest<UserStatistics>(
      `/api/statistics?userId=${encodeURIComponent(userId)}`,
      { apiKey }
    );
  } catch (error) {
    console.error('Failed to fetch user statistics:', error);
    return null;
  }
}

// ============================================================================
// Contributions API
// ============================================================================

export async function fetchContributionData(
  userId: string,
  days: number = 365,
  apiKey?: string
): Promise<ContributionData[]> {
  try {
    return await apiRequest<ContributionData[]>(
      `/api/contributions?userId=${encodeURIComponent(userId)}&days=${days}`,
      { apiKey }
    );
  } catch (error) {
    console.error('Failed to fetch contribution data:', error);
    return [];
  }
}

// ============================================================================
// Projects API
// ============================================================================

export async function fetchProjectStatistics(
  userId: string,
  apiKey?: string
): Promise<ProjectStatistics[]> {
  try {
    return await apiRequest<ProjectStatistics[]>(
      `/api/projects?userId=${encodeURIComponent(userId)}`,
      { apiKey }
    );
  } catch (error) {
    console.error('Failed to fetch project statistics:', error);
    return [];
  }
}

export async function fetchProjectInfo(
  projectId: number,
  userId: string,
  apiKey?: string
): Promise<ProjectInfo | null> {
  try {
    return await apiRequest<ProjectInfo>(
      `/api/projects/${projectId}?userId=${encodeURIComponent(userId)}`,
      { apiKey }
    );
  } catch (error) {
    console.error('Failed to fetch project info:', error);
    return null;
  }
}

export async function createProject(
  userId: string,
  name: string,
  description?: string,
  apiKey?: string
): Promise<{ project: ProjectInfo; hash: string } | null> {
  try {
    return await apiRequest<{ project: ProjectInfo; hash: string }>(
      '/api/projects',
      {
        method: 'POST',
        body: { userId, name, description },
        apiKey,
      }
    );
  } catch (error) {
    console.error('Failed to create project:', error);
    return null;
  }
}

export async function deleteProject(
  projectId: number,
  userId: string,
  apiKey?: string
): Promise<boolean> {
  try {
    await apiRequest<{ message: string }>(
      `/api/projects/${projectId}`,
      {
        method: 'DELETE',
        body: { userId },
        apiKey,
      }
    );
    return true;
  } catch (error) {
    console.error('Failed to delete project:', error);
    return false;
  }
}

// ============================================================================
// Commits API
// ============================================================================

export async function fetchProjectCommits(
  projectId: number,
  userId: string,
  apiKey?: string
): Promise<ProjectCommit[]> {
  try {
    return await apiRequest<ProjectCommit[]>(
      `/api/projects/${projectId}/commits?userId=${encodeURIComponent(userId)}`,
      { apiKey }
    );
  } catch (error) {
    console.error('Failed to fetch project commits:', error);
    return [];
  }
}

// ============================================================================
// AI Interactions API
// ============================================================================

export async function fetchProjectInteractions(
  projectId: number,
  userId: string,
  apiKey?: string
): Promise<AIInteraction[]> {
  try {
    return await apiRequest<AIInteraction[]>(
      `/api/projects/${projectId}/interactions?userId=${encodeURIComponent(userId)}`,
      { apiKey }
    );
  } catch (error) {
    console.error('Failed to fetch project interactions:', error);
    return [];
  }
}

// ============================================================================
// Repository Lookup API (for CodeTracker)
// ============================================================================

export async function lookupRepository(
  userId: string,
  repoHash?: string,
  repoName?: string,
  apiKey?: string
): Promise<RepositoryLookup | null> {
  try {
    const params = new URLSearchParams({ userId });
    if (repoHash) params.append('repoHash', repoHash);
    if (repoName) params.append('repoName', repoName);

    return await apiRequest<RepositoryLookup>(
      `/api/repositories/lookup?${params.toString()}`,
      { apiKey }
    );
  } catch (error) {
    console.error('Failed to lookup repository:', error);
    return null;
  }
}

export async function createRepository(
  userId: string,
  repoName: string,
  repoHash: string,
  apiKey?: string
): Promise<RepositoryLookup | null> {
  try {
    return await apiRequest<RepositoryLookup>(
      '/api/repositories',
      {
        method: 'POST',
        body: { userId, repoName, repoHash },
        apiKey,
      }
    );
  } catch (error) {
    console.error('Failed to create repository:', error);
    return null;
  }
}

// ============================================================================
// Admin API (모든 사용자 통계 조회)
// ============================================================================

export async function fetchAllUserStatistics(
  apiKey?: string
): Promise<UserStatistics[]> {
  try {
    return await apiRequest<UserStatistics[]>(
      '/api/admin/statistics',
      { apiKey }
    );
  } catch (error) {
    console.error('Failed to fetch all user statistics:', error);
    return [];
  }
}

export { ApiError };

/**
 * Axios API client for PitchReady.
 * Automatically attaches JWT tokens and handles 401/402 redirects globally.
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import { getToken, signOut } from './auth';

// ---------------------------------------------------------------------------
// Shared error shape
// ---------------------------------------------------------------------------

export interface ApiError {
    status: number;
    message: string;
    code?: string;
}

// ---------------------------------------------------------------------------
// Client setup
// ---------------------------------------------------------------------------

export const apiClient: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach Bearer token
apiClient.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        if (typeof window !== 'undefined') {
            console.log(`[API Interceptor] Token found and attached to request ${config.url}`);
        }
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        if (typeof window !== 'undefined') {
            console.warn(`[API Interceptor] No token found for request ${config.url}`);
        }
    }
    return config;
});

// Response interceptor — handle auth/billing failures globally
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const status = error.response?.status;

        if (status === 401) {
            // Use window.location.href to avoid throwing Next.js NEXT_REDIRECT error inside a fetch promise block
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }

        if (status === 402) {
            if (typeof window !== 'undefined') {
                window.location.href = '/pricing?reason=limit_reached';
            }
            return Promise.reject(error);
        }

        // Normalise all other errors
        const data = error.response?.data as Record<string, unknown> | undefined;
        
        let message = 'An unexpected error occurred';
        if (Array.isArray(data?.detail) && data?.detail.length > 0) {
            const firstError = data.detail[0] as Record<string, unknown>;
            message = (firstError.msg as string) || 'Validation error';
            if (Array.isArray(firstError.loc) && firstError.loc.length > 1) {
                message = `${firstError.loc[firstError.loc.length - 1]}: ${message}`;
            }
        } else if (typeof data?.detail === 'string') {
            message = data.detail;
        } else if (typeof data?.message === 'string') {
            message = data.message;
        } else if (error.message) {
            message = error.message;
        }

        const normalized: ApiError = {
            status: status ?? 0,
            message,
            code: (data?.code as string) ?? undefined,
        };
        return Promise.reject(normalized);
    }
);

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface UploadFileResponse {
    object_key: string;
    run_id: string;
}

export interface AnalysisResponse {
    job_id: string;
    run_id: string;
    status: string;
}

export interface ReportDetail {
    id: string;
    vertical: string;
    assumption_map: unknown[];
    blind_spots: unknown[];
    sharpening: unknown[];
}

export interface ReportSummary {
    id: string;
    vertical: string;
    status: string;
    created_at: string;
    run_id: string;
}

export interface AdminStats {
    total_users: number;
    active_7d: number;
    active_30d: number;
    total_runs: number;
    success_rate: number;
    avg_cost_usd: number;
}

// ---------------------------------------------------------------------------
// Typed API functions
// ---------------------------------------------------------------------------

/**
 * Upload a pitch file directly to the backend (which proxies it to R2).
 * Returns object_key and run_id without needing a presigned URL.
 */
export async function uploadFile(
    file: File,
): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('vertical', 'auto');

    const token = await getToken();
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${baseURL}/upload/file`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw { status: res.status, message: data.detail || 'Upload failed' };
    }

    return res.json();
}

/**
 * Submit a pitch for analysis after the file has been uploaded.
 */
export async function submitAnalysis(
    object_key: string,
): Promise<AnalysisResponse> {
    const { data } = await apiClient.post<AnalysisResponse>('/analyze', {
        object_key,
    });
    return data;
}

/**
 * Fetch a single completed report by ID.
 */
export async function getReport(id: string): Promise<ReportDetail> {
    const { data } = await apiClient.get<ReportDetail>(`/reports/${id}`);
    return data;
}

/**
 * Fetch all reports for the authenticated user.
 */
export async function getReports(): Promise<ReportSummary[]> {
    const { data } = await apiClient.get<ReportSummary[]>('/reports');
    return data;
}

/**
 * Delete a report/run history item.
 */
export async function deleteReport(runId: string): Promise<void> {
    await apiClient.delete(`/reports/${runId}`);
}

/**
 * Fetch platform-wide statistics (admin only).
 */
export async function getAdminStats(): Promise<AdminStats> {
    const { data } = await apiClient.get<AdminStats>('/admin/stats');
    return data;
}

/**
 * Update user intelligence profile preferences.
 */
export async function updatePreferences(
    skeptic_level: string,
    focus_area: string,
): Promise<void> {
    await apiClient.patch('/auth/me/preferences', {
        skeptic_level,
        focus_area,
    });
}

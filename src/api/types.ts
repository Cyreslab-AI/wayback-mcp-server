// Types for Wayback Machine API responses

// Response from the availability API
export interface WaybackAvailabilityResponse {
  url: string;
  archived_snapshots: {
    closest?: {
      status: string;
      available: boolean;
      url: string;
      timestamp: string;
    };
  };
}

// Response from the CDX Server API (in JSON format)
export type CdxResponse = string[][];

// Processed snapshot information
export interface SnapshotInfo {
  timestamp: string;
  original: string;
  mimetype: string;
  statusCode: string;
  digest: string;
  length: string;
  archiveUrl: string;
  formattedDate?: string;
}

// Parameters for snapshot search
export interface SnapshotSearchParams {
  url: string;
  from?: string;
  to?: string;
  limit?: number;
  matchType?: 'exact' | 'prefix' | 'host' | 'domain';
}

// Parameters for archived page retrieval
export interface ArchivedPageParams {
  url: string;
  timestamp: string;
  original?: boolean;
}

// Error response
export interface WaybackError {
  error: string;
  message: string;
  statusCode?: number;
}

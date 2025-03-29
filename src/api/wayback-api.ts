import axios from 'axios';
import {
  ArchivedPageParams,
  CdxResponse,
  SnapshotInfo,
  SnapshotSearchParams,
  WaybackAvailabilityResponse,
  WaybackError
} from './types.js';

// Base URLs for Wayback Machine APIs
const AVAILABILITY_API_URL = 'https://archive.org/wayback/available';
const CDX_API_URL = 'https://web.archive.org/cdx/search/cdx';
const WAYBACK_BASE_URL = 'https://web.archive.org/web';

/**
 * Format a timestamp from YYYYMMDDHHMMSS to a human-readable date
 */
export function formatTimestamp(timestamp: string): string {
  if (timestamp.length !== 14) return timestamp;

  const year = timestamp.substring(0, 4);
  const month = timestamp.substring(4, 6);
  const day = timestamp.substring(6, 8);
  const hour = timestamp.substring(8, 10);
  const minute = timestamp.substring(10, 12);
  const second = timestamp.substring(12, 14);

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * Check if a URL has been archived in the Wayback Machine
 */
export async function checkAvailability(url: string): Promise<WaybackAvailabilityResponse> {
  try {
    const response = await axios.get(AVAILABILITY_API_URL, {
      params: { url }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorResponse: WaybackError = {
        error: 'API_ERROR',
        message: error.message,
        statusCode: error.response?.status
      };
      throw errorResponse;
    }
    throw error;
  }
}

/**
 * Get a list of snapshots for a URL from the CDX Server API
 */
export async function getSnapshots(params: SnapshotSearchParams): Promise<SnapshotInfo[]> {
  try {
    const { url, from, to, limit = 100, matchType = 'exact' } = params;

    // Build query parameters
    const queryParams: Record<string, string | number> = {
      url,
      output: 'json',
      fl: 'timestamp,original,mimetype,statuscode,digest,length',
      collapse: 'timestamp:8', // Group by day to reduce results
      limit
    };

    // Add optional parameters
    if (from) queryParams.from = from;
    if (to) queryParams.to = to;

    // Set match type
    switch (matchType) {
      case 'prefix':
        queryParams.matchType = 'prefix';
        break;
      case 'host':
        queryParams.matchType = 'host';
        break;
      case 'domain':
        queryParams.matchType = 'domain';
        break;
      default:
        // 'exact' is the default
        break;
    }

    const response = await axios.get<CdxResponse>(CDX_API_URL, {
      params: queryParams
    });

    // The first row contains field names, so we skip it
    const data = response.data;
    if (!data || data.length <= 1) {
      return [];
    }

    // Process the results
    return data.slice(1).map(row => {
      const [timestamp, original, mimetype, statusCode, digest, length] = row;
      const archiveUrl = `${WAYBACK_BASE_URL}/${timestamp}/${original}`;

      return {
        timestamp,
        original,
        mimetype,
        statusCode,
        digest,
        length,
        archiveUrl,
        formattedDate: formatTimestamp(timestamp)
      };
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorResponse: WaybackError = {
        error: 'API_ERROR',
        message: error.message,
        statusCode: error.response?.status
      };
      throw errorResponse;
    }
    throw error;
  }
}

/**
 * Get the content of an archived page
 */
export async function getArchivedPage(params: ArchivedPageParams): Promise<string> {
  try {
    const { url, timestamp, original = false } = params;

    // Build the Wayback Machine URL
    // If original is true, add 'id_' to get the original content without Wayback Machine's banner
    const prefix = original ? 'id_' : '';
    const waybackUrl = `${WAYBACK_BASE_URL}/${prefix}${timestamp}/${url}`;

    const response = await axios.get(waybackUrl, {
      responseType: 'text'
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorResponse: WaybackError = {
        error: 'API_ERROR',
        message: error.message,
        statusCode: error.response?.status
      };
      throw errorResponse;
    }
    throw error;
  }
}

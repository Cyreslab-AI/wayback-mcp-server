import { getArchivedPage } from '../api/wayback-api.js';
import { ArchivedPageParams, WaybackError } from '../api/types.js';

// Resource template for accessing archived pages
export const waybackResourceTemplate = {
  uriTemplate: 'wayback://{url}/{timestamp}',
  name: 'Wayback Machine Archived Page',
  mimeType: 'text/html',
  description: 'Access archived web pages from the Internet Archive Wayback Machine'
};

// Handler for the wayback resource
export async function handleWaybackResource(uri: string) {
  try {
    // Parse the URI
    const match = uri.match(/^wayback:\/\/([^/]+)\/([^/]+)$/);
    if (!match) {
      throw new Error(`Invalid URI format: ${uri}`);
    }

    // Extract parameters
    const encodedUrl = match[1];
    const timestamp = match[2];
    const url = decodeURIComponent(encodedUrl);

    // Validate parameters
    if (!url) {
      throw new Error('URL is required');
    }

    if (!timestamp) {
      throw new Error('Timestamp is required');
    }

    // Set up parameters for the API call
    const params: ArchivedPageParams = {
      url,
      timestamp,
      original: true // Get the original content without Wayback Machine banner
    };

    // Call the API
    const content = await getArchivedPage(params);

    // Determine the MIME type
    let mimeType = 'text/plain';
    if (content.trim().startsWith('<!DOCTYPE') ||
        content.trim().startsWith('<html') ||
        content.includes('<body')) {
      mimeType = 'text/html';
    } else if (content.startsWith('{') || content.startsWith('[')) {
      mimeType = 'application/json';
    }

    // Return the content
    return {
      uri,
      mimeType,
      text: content
    };
  } catch (error) {
    const waybackError = error as WaybackError;
    throw new Error(`Failed to retrieve archived page: ${waybackError.message || 'Unknown error'}`);
  }
}

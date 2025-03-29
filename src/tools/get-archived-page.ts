import { getArchivedPage } from '../api/wayback-api.js';
import { ArchivedPageParams, WaybackError } from '../api/types.js';

// Input schema for the get_archived_page tool
export const getArchivedPageInputSchema = {
  type: 'object',
  properties: {
    url: {
      type: 'string',
      description: 'URL of the page to retrieve'
    },
    timestamp: {
      type: 'string',
      description: 'Timestamp in YYYYMMDDHHMMSS format'
    },
    original: {
      type: 'boolean',
      description: 'Whether to get the original content without Wayback Machine banner (default: false)'
    }
  },
  required: ['url', 'timestamp']
};

// Implementation of the get_archived_page tool
export async function getArchivedPageTool(args: any) {
  try {
    // Validate input
    if (!args.url) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: URL is required'
          }
        ],
        isError: true
      };
    }

    if (!args.timestamp) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Timestamp is required'
          }
        ],
        isError: true
      };
    }

    // Map input parameters to API parameters
    const params: ArchivedPageParams = {
      url: args.url,
      timestamp: args.timestamp,
      original: args.original === true
    };

    // Call the API
    const content = await getArchivedPage(params);

    // Determine content type (HTML, text, etc.)
    const isHtml = content.trim().startsWith('<!DOCTYPE') ||
                  content.trim().startsWith('<html') ||
                  content.includes('<body');

    // Format the response
    return {
      content: [
        {
          type: 'text',
          text: formatArchivedPageResponse(params, content, isHtml)
        }
      ]
    };
  } catch (error) {
    const waybackError = error as WaybackError;
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${waybackError.message || 'Unknown error occurred'}`
        }
      ],
      isError: true
    };
  }
}

// Helper function to format the archived page response
function formatArchivedPageResponse(
  params: ArchivedPageParams,
  content: string,
  isHtml: boolean
): string {
  const { url, timestamp, original } = params;
  const waybackUrl = `https://web.archive.org/web/${original ? 'id_' : ''}${timestamp}/${url}`;

  let response = `Retrieved archived page from ${timestamp} for ${url}\n`;
  response += `Wayback URL: ${waybackUrl}\n\n`;

  // For HTML content, provide a summary instead of the full content
  if (isHtml) {
    const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'No title found';

    response += `Title: ${title}\n\n`;
    response += `Content type: HTML\n`;
    response += `Content length: ${content.length} characters\n\n`;
    response += `Note: HTML content is available at the Wayback URL above.\n`;
    response += `To view the raw HTML content, use the 'original=true' parameter.\n`;
  } else {
    // For text content, include the full content (up to a reasonable limit)
    const maxLength = 10000;
    const truncated = content.length > maxLength;

    response += `Content type: Text\n`;
    response += `Content length: ${content.length} characters\n\n`;
    response += `Content:\n${'='.repeat(80)}\n`;
    response += truncated ? content.substring(0, maxLength) + '...\n[Content truncated]' : content;
    response += `\n${'='.repeat(80)}\n`;
  }

  return response;
}

import { getSnapshots } from '../api/wayback-api.js';
import { SnapshotInfo, SnapshotSearchParams, WaybackError } from '../api/types.js';

// Input schema for the get_snapshots tool
export const getSnapshotsInputSchema = {
  type: 'object',
  properties: {
    url: {
      type: 'string',
      description: 'URL to check for snapshots'
    },
    from: {
      type: 'string',
      description: 'Start date in YYYYMMDD format (optional)'
    },
    to: {
      type: 'string',
      description: 'End date in YYYYMMDD format (optional)'
    },
    limit: {
      type: 'number',
      description: 'Maximum number of snapshots to return (default: 100)'
    },
    match_type: {
      type: 'string',
      enum: ['exact', 'prefix', 'host', 'domain'],
      description: 'Type of URL matching to use (default: exact)'
    }
  },
  required: ['url']
};

// Implementation of the get_snapshots tool
export async function getSnapshotsTool(args: any) {
  try {
    // Validate and transform input
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

    // Map input parameters to API parameters
    const params: SnapshotSearchParams = {
      url: args.url,
      from: args.from,
      to: args.to,
      limit: args.limit,
      matchType: args.match_type as any
    };

    // Call the API
    const snapshots = await getSnapshots(params);

    // Format the response
    if (snapshots.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No snapshots found for URL: ${args.url}`
          }
        ]
      };
    }

    // Create a formatted response
    const formattedSnapshots = formatSnapshotsResponse(snapshots);

    return {
      content: [
        {
          type: 'text',
          text: formattedSnapshots
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

// Helper function to format snapshots into a readable response
function formatSnapshotsResponse(snapshots: SnapshotInfo[]): string {
  const count = snapshots.length;
  const url = snapshots[0]?.original || 'Unknown URL';

  let response = `Found ${count} snapshots for ${url}\n\n`;

  // Table header
  response += 'Date'.padEnd(20) + 'Status'.padEnd(10) + 'Type'.padEnd(20) + 'URL\n';
  response += '='.repeat(80) + '\n';

  // Table rows
  snapshots.forEach(snapshot => {
    const date = snapshot.formattedDate || snapshot.timestamp;
    const status = snapshot.statusCode;
    const type = snapshot.mimetype;
    const url = snapshot.archiveUrl;

    response += date.padEnd(20) + status.padEnd(10) + type.padEnd(20) + url + '\n';
  });

  return response;
}

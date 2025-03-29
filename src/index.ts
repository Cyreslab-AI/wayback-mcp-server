#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import tools
import { getSnapshotsTool, getSnapshotsInputSchema } from './tools/get-snapshots.js';
import { getArchivedPageTool, getArchivedPageInputSchema } from './tools/get-archived-page.js';

// Import resources
import { waybackResourceTemplate, handleWaybackResource } from './resources/wayback-resource.js';

class WaybackMachineServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'wayback-machine-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // Set up request handlers
    this.setupToolHandlers();
    this.setupResourceHandlers();

    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_snapshots',
          description: 'Get a list of available snapshots for a URL from the Wayback Machine',
          inputSchema: getSnapshotsInputSchema
        },
        {
          name: 'get_archived_page',
          description: 'Retrieve the content of an archived webpage from the Wayback Machine',
          inputSchema: getArchivedPageInputSchema
        }
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'get_snapshots':
          return await getSnapshotsTool(args);

        case 'get_archived_page':
          return await getArchivedPageTool(args);

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
      }
    });
  }

  private setupResourceHandlers() {
    // List available resource templates
    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
      resourceTemplates: [waybackResourceTemplate],
    }));

    // List static resources (none in this implementation)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [],
    }));

    // Handle resource requests
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      // Check if the URI matches our resource template
      if (uri.startsWith('wayback://')) {
        const resource = await handleWaybackResource(uri);
        return {
          contents: [resource],
        };
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Unknown resource URI: ${uri}`
      );
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Wayback Machine MCP server running on stdio');
  }
}

// Start the server
const server = new WaybackMachineServer();
server.run().catch(console.error);

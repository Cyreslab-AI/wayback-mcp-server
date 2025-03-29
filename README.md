# Wayback Machine MCP Server

This is a Model Context Protocol (MCP) server that provides access to the Internet Archive's Wayback Machine. It allows you to retrieve archived versions of web pages and check available snapshots of URLs.

## Features

### Tools

1. **get_snapshots**

   - Get a list of available snapshots for a URL from the Wayback Machine
   - Parameters:
     - `url` (required): URL to check for snapshots
     - `from` (optional): Start date in YYYYMMDD format
     - `to` (optional): End date in YYYYMMDD format
     - `limit` (optional): Maximum number of snapshots to return (default: 100)
     - `match_type` (optional): Type of URL matching to use (default: exact)
       - Options: 'exact', 'prefix', 'host', 'domain'

2. **get_archived_page**
   - Retrieve the content of an archived webpage from the Wayback Machine
   - Parameters:
     - `url` (required): URL of the page to retrieve
     - `timestamp` (required): Timestamp in YYYYMMDDHHMMSS format
     - `original` (optional): Whether to get the original content without Wayback Machine banner (default: false)

### Resource Templates

1. **wayback://{url}/{timestamp}**
   - Access archived web pages from the Internet Archive Wayback Machine
   - Parameters:
     - `url`: The webpage URL to retrieve
     - `timestamp`: The specific archive timestamp (YYYYMMDDHHMMSS format)

## Installation

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Add the server to your MCP settings file:

```json
{
  "mcpServers": {
    "wayback-machine": {
      "command": "node",
      "args": ["/path/to/wayback-server/build/index.js"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Usage Examples

### Get Snapshots

```
use_mcp_tool(
  server_name="wayback-machine",
  tool_name="get_snapshots",
  arguments={
    "url": "example.com",
    "from": "20200101",
    "to": "20201231",
    "limit": 10
  }
)
```

### Get Archived Page

```
use_mcp_tool(
  server_name="wayback-machine",
  tool_name="get_archived_page",
  arguments={
    "url": "example.com",
    "timestamp": "20200101120000",
    "original": true
  }
)
```

### Access Resource

```
access_mcp_resource(
  server_name="wayback-machine",
  uri="wayback://example.com/20200101120000"
)
```

## API Details

This server uses the following Wayback Machine APIs:

1. **Availability API**: `https://archive.org/wayback/available?url={url}`
2. **CDX Server API**: `https://web.archive.org/cdx/search/cdx?url={url}&output=json`
3. **Wayback Machine Memento API**: `https://web.archive.org/web/{timestamp}/{url}`

## License

ISC

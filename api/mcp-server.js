import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server({
  name: "distro-tools",
  version: "1.0.0",
}, {
  capabilities: { tools: {} },
});

// Define available tools for the AI
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "post_to_telegram",
      description: "Posts a curated summary to a Telegram channel",
      inputSchema: {
        type: "object",
        properties: {
          content: { type: "string" },
          channelId: { type: "string" }
        },
        required: ["content"]
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "post_to_telegram") {
    // Logic to call Telegram Bot API using your .env credentials
    return { content: [{ type: "text", text: "Successfully posted to Telegram." }] };
  }
  throw new Error("Tool not found");
});

const transport = new StdioServerTransport();
await server.connect(transport);
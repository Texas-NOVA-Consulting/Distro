const { Server } = require("@modelcontextprotocol/sdk");
const server = new Server({ name: "distro-tools", version: "1.0.0" });

server.tool("post_to_telegram", { message: "string" }, async ({ message }) => {
  // Logic to call Telegram Bot API
});
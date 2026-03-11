import { IncomingMessage } from "node:http";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { runAnalystRequest } from "./server/analyst";

function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const anthropicApiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || "";

  return {
    plugins: [
      react(),
      {
        name: "analyst-api-dev-proxy",
        configureServer(server) {
          server.middlewares.use("/api/analyst", async (req, res) => {
            if (req.method !== "POST") {
              res.statusCode = 405;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Method not allowed." }));
              return;
            }

            try {
              const payload = await readJsonBody(req);
              const result = await runAnalystRequest(payload, anthropicApiKey);
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error: any) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: error?.message || "The analyst request failed." }));
            }
          });
        },
      },
    ],
  };
});

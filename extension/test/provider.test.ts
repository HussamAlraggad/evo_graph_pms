import * as http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { OpenAICompatibleProvider, AssistantRequestError } from "../src/ai/openaiCompatible";
import { ASSISTANT_SYSTEM_PROMPT } from "../src/ai/provider";

interface StubServer {
  baseUrl: string;
  requests: Array<{ url: string | undefined; headers: http.IncomingHttpHeaders; body: string }>;
  close(): Promise<void>;
}

async function startStubServer(
  respond: (request: { url: string | undefined; body: string }) => { status: number; body: string },
): Promise<StubServer> {
  const requests: StubServer["requests"] = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += String(chunk)));
    req.on("end", () => {
      requests.push({ url: req.url, headers: req.headers, body });
      const reply = respond({ url: req.url, body });
      res.statusCode = reply.status;
      res.setHeader("content-type", "application/json");
      res.end(reply.body);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("no port");
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    requests,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

describe("OpenAICompatibleProvider", () => {
  let server: StubServer | undefined;

  afterEach(async () => {
    if (server) await server.close();
    server = undefined;
  });

  it("sends the system prompt plus conversation, and parses the reply", async () => {
    server = await startStubServer(() => ({
      status: 200,
      body: JSON.stringify({ choices: [{ message: { role: "assistant", content: "Try this." } }] }),
    }));
    const provider = new OpenAICompatibleProvider({
      baseUrl: `${server.baseUrl}/`,
      apiKey: "test-key",
      model: "gpt-4o-mini",
    });
    const reply = await provider.chat([
      { role: "user", content: "Fix the race condition", createdAt: "2026-10-24T12:00:00.000Z" },
    ]);
    expect(reply.content).toBe("Try this.");
    expect(reply.provider).toBe("openai-compatible");
    expect(reply.model).toBe("gpt-4o-mini");

    const request = server.requests[0];
    expect(request.url).toBe("/chat/completions");
    expect(request.headers.authorization).toBe("Bearer test-key");
    const body = JSON.parse(request.body) as { model: string; messages: Array<{ role: string; content: string }> };
    expect(body.model).toBe("gpt-4o-mini");
    expect(body.messages[0]).toEqual({ role: "system", content: ASSISTANT_SYSTEM_PROMPT });
    expect(body.messages[1]).toEqual({ role: "user", content: "Fix the race condition" });
  });

  it("raises a clear error on non-200 responses", async () => {
    server = await startStubServer(() => ({ status: 401, body: '{"error":"bad key"}' }));
    const provider = new OpenAICompatibleProvider({ baseUrl: server.baseUrl, apiKey: "nope", model: "m" });
    const failure = provider.chat([{ role: "user", content: "hi", createdAt: "2026-10-24T12:00:00.000Z" }]);
    await expect(failure).rejects.toThrow(/HTTP 401/);
    await expect(failure).rejects.toBeInstanceOf(AssistantRequestError);
    await expect(failure).rejects.toMatchObject({ status: 401 });
  });

  it("rejects responses that are not JSON", async () => {
    server = await startStubServer(() => ({ status: 200, body: "not json at all" }));
    const provider = new OpenAICompatibleProvider({ baseUrl: server.baseUrl, apiKey: "k", model: "m" });
    await expect(
      provider.chat([{ role: "user", content: "hi", createdAt: "2026-10-24T12:00:00.000Z" }]),
    ).rejects.toThrow(/JSON|Unexpected token/);
  });

  it("rejects responses without choices or content", async () => {
    server = await startStubServer(() => ({ status: 200, body: JSON.stringify({ choices: [] }) }));
    const provider = new OpenAICompatibleProvider({ baseUrl: server.baseUrl, apiKey: "k", model: "m" });
    await expect(
      provider.chat([{ role: "user", content: "hi", createdAt: "2026-10-24T12:00:00.000Z" }]),
    ).rejects.toThrow(/no choices/);
  });

  it("times out when the endpoint never answers", async () => {
    const hanging = http.createServer(() => {
      // never respond
    });
    await new Promise<void>((resolve) => hanging.listen(0, "127.0.0.1", resolve));
    const address = hanging.address();
    if (address === null || typeof address === "string") throw new Error("no port");
    const provider = new OpenAICompatibleProvider({
      baseUrl: `http://127.0.0.1:${address.port}`,
      apiKey: "k",
      model: "m",
      timeoutMs: 120,
    });
    try {
      await expect(
        provider.chat([{ role: "user", content: "hi", createdAt: "2026-10-24T12:00:00.000Z" }]),
      ).rejects.toThrow(/timed out/);
    } finally {
      await new Promise((resolve) => hanging.close(() => resolve(undefined)));
    }
  });
});

export type Message =
  | { type: "stdout"; jobId?: string; chunk: string }
  | { type: "stderr"; jobId?: string; chunk: string }
  | { type: "job_started"; jobId: string }
  | { type: "job_finished"; jobId: string; exitCode?: number; killedByTimeout?: boolean }
  | { type: "job_error"; message: string }
  | { type: "log"; message: string }
  | { type: "needs_input"; jobId: string };

type Outbound =
  | { type: "start_job"; language: string; code: string; timeoutMs?: number }
  | { type: "stdin"; jobId: string; input: string };

let ws: WebSocket | null = null;
let handler: ((m: Message) => void) | null = null;

// Promise that resolves ONLY when WebSocket is ready
let readyPromise: Promise<void> | null = null;
let resolveReady: (() => void) | null = null;

function connect(h: (m: Message) => void, sessionId: string) {

  handler = h;

  ws = new WebSocket(`${import.meta.env.VITE_WS_API}?sessionId=${sessionId}&token=${import.meta.env.VITE_WS_TOKEN}`);

  readyPromise = new Promise((resolve) => (resolveReady = resolve));

  ws.onopen = () => {
    console.log("WS open", sessionId);
    resolveReady && resolveReady();
  };

  ws.onclose = () => console.warn("WS closed");
  ws.onerror = (e) => console.error("WS error", e);

  ws.onmessage = (ev) => {
    try {
      const parsed = JSON.parse(ev.data);
      handler && handler(parsed);
    } catch (e) {
      console.error("WS parse error", e);
    }
  };
}

async function send(msg: Outbound) {
  if (!ws) throw new Error("WS not created");

  // Wait for WS to open if still connecting
  if (readyPromise) {
    await readyPromise;
    readyPromise = null; // Only needed once
  }

  if (ws.readyState !== WebSocket.OPEN) {
    console.error("WS not connected", ws.readyState);
    throw new Error("WS not connected");
  }

  ws.send(JSON.stringify(msg));
}

function disconnect() {
  ws?.close();
  ws = null;
  handler = null;
  readyPromise = null;
  resolveReady = null;
}

export default { connect, disconnect, send };

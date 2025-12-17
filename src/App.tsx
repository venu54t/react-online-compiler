import React, { JSX, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import wsClient, { Message } from "./services/ws";
import OutputPanel, { OutputPanelHandle } from "./components/OutputPanel";
import Toolbar from "./components/Toolbar";
import EditorPanel from "./components/EditorPanel";

const DEFAULT_OUTPUT_WIDTH = 480;
type Theme = "dark" | "light";

export default function App(): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const [outputWidth, setOutputWidth] = useState(DEFAULT_OUTPUT_WIDTH);
  const [language, setLanguage] = useState("python");
  const [isRunning, setIsRunning] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const outputRef = useRef<OutputPanelHandle>(null);



  function startDragging() {
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
  }


  // THEME (persisted)
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem("theme") as Theme) || "dark"
  );

  const editorRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("share");

    if (!shared) return;

    try {
      const decoded = decodeURIComponent(atob(shared));
      const parsed = JSON.parse(decoded);

      if (parsed.language && parsed.code) {
        setLanguage(parsed.language);

        // Wait for editor to mount
        setTimeout(() => {
          editorRef.current?.setValue(parsed.code);
        }, 0);
      }
    } catch (err) {
      console.error("Invalid shared code URL", err);
    }
  }, []);

  function handleMessage(msg: Message) {
    switch (msg.type) {
      case "stdout":
      case "stderr":
        setOutput(o => o + msg.chunk);
        break;

      case "job_started":
        setOutput("");
        setCurrentJobId(msg.jobId);
        setIsRunning(true);
        break;

      case "job_finished":
        setOutput(o =>
          o +
          `\n${msg.exitCode === 0
            ? "=== Code Execution Successful ==="
            : "=== Code Exited With Errors ==="
          }\n`
        );
        setIsRunning(false);
        setCurrentJobId(null);
        break;

      case "job_error":
        setOutput(o => o + `[error] ${msg.message}\n`);
        setIsRunning(false);
        setCurrentJobId(null);
        break;
    }
  }

  function runCode(timeoutMs = 300000) {
    wsClient.disconnect();
    const sessionId = uuid();
    wsClient.connect(handleMessage, sessionId);

    setTimeout(() => {
      let code = editorRef.current?.getValue() ?? "";
      code.length && wsClient.send({
        type: "start_job",
        language,
        code: code,
        timeoutMs
      });
    }, 50);
    setTimeout(() => {
      outputRef.current?.focus();
    }, 0);
  }

  function sendStdin(txt: string) {
    if (!currentJobId) return;
    wsClient.send({ type: "stdin", jobId: currentJobId, input: txt });
    setOutput(o => o + txt);
  }

  function clearOutput() {
    setOutput("");
  }

  function shareCode() {
    const payload = {
      language,
      code: editorRef.current?.getValue() ?? ""
    };
    const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
    const url = `${window.location.origin}?share=${encoded}`;
    navigator.clipboard.writeText(url);
    alert("Share link copied!");
  }

  // Handle drag resize
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!draggingRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;

      const minWidth = 200;
      const maxWidth = rect.width - 400;

      setOutputWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    }

    function onUp() {
      draggingRef.current = false;
      document.body.style.cursor = "";
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <div className={`h-screen flex flex-col ${theme === "dark" ? "dark bg-slate-900" : "light bg-gray-100"}  min-w-0`}>

      <Toolbar theme={theme} />

      <div ref={containerRef} className="flex flex-1 min-h-0">
        <EditorPanel
          ref={editorRef}
          language={language}
          setLanguage={setLanguage}
          isRunning={isRunning}
          runCode={() => runCode()}
          theme={theme}
          toggleTheme={() => setTheme(t => (t === "dark" ? "light" : "dark"))}
          shareCode={shareCode}
        />

        <div
          onMouseDown={startDragging}
          className="w-1px cursor-col-resize middle-divider"
        />

        <OutputPanel
          ref={outputRef}
          style={{ width: outputWidth, overflow: "auto" }}
          output={output}
          onSend={sendStdin}
          onClear={clearOutput}
          isRunning={isRunning}
          theme={theme}
        />

      </div>
    </div>
  );
}

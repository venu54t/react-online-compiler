import React, { JSX, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import wsClient, { Message } from "./services/ws";
import OutputPanel, { OutputPanelHandle } from "./components/OutputPanel";
import Toolbar from "./components/Toolbar";
import EditorPanel from "./components/EditorPanel";
import { useIsDesktop } from "./utils/editor-panel";
import InfoTooltip from "./components/ToolTip";
import CloseIcon from "./svg/CloseIcon";

const DEFAULT_OUTPUT_WIDTH = 600;
type Theme = "dark" | "light";

export default function App(): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const isDesktop = useIsDesktop();

  const editorRef = useRef<any>(null);
  const outputRef = useRef<OutputPanelHandle>(null);


  const [outputWidth, setOutputWidth] = useState(DEFAULT_OUTPUT_WIDTH);
  const [language, setLanguage] = useState("python");
  const [isRunning, setIsRunning] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [output, setOutput] = useState("");

  /* ---------------- MOBILE FLOATING OUTPUT ---------------- */

  const [showMobileOutput, setShowMobileOutput] = useState(false);

  /* ---------------- THEME ---------------- */

  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem("theme") as Theme) || "dark"
  );

  function startDragging() {
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
  }
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  /* ---------------- SHARE URL ---------------- */

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("share");
    if (!shared) return;

    try {
      const decoded = decodeURIComponent(atob(shared));
      const parsed = JSON.parse(decoded);

      if (parsed.language && parsed.code) {
        setLanguage(parsed.language);
        setTimeout(() => {
          editorRef.current?.setValue(parsed.code);
        }, 0);
      }
    } catch {
      console.error("Invalid share URL");
    }
  }, []);

  /* ---------------- WS HANDLING ---------------- */

  function handleMessage(msg: Message) {
    switch (msg.type) {
      case "stdout":
      case "stderr":
        setOutput(o => o + msg.chunk);
        break;

      case "job_started":
        setOutput("");
        setIsRunning(true);
        setCurrentJobId(msg.jobId);
        if (!isDesktop) setShowMobileOutput(true);
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

  /* ---------------- RUN CODE ---------------- */

  function runCode(timeoutMs = 300000) {
    wsClient.disconnect();
    const sessionId = uuid();
    wsClient.connect(handleMessage, sessionId);

    setTimeout(() => {
      const code = editorRef.current?.getValue() ?? "";
      if (code.length) {
        wsClient.send({
          type: "start_job",
          language,
          code,
          timeoutMs,
        });
      }
    }, 50);

    if (isDesktop) {
      setTimeout(() => outputRef.current?.focus(), 0);
    }
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
      code: editorRef.current?.getValue() ?? "",
    };
    const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
    navigator.clipboard.writeText(
      `${window.location.origin}?share=${encoded}`
    );
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
    <div
      className={`h-screen flex flex-col ${theme === "dark" ? "dark bg-slate-900" : "light bg-gray-100"
        }`}
    >
      <Toolbar theme={theme} />

      <div ref={containerRef} className="flex flex-1 min-h-0 relative">
        {/* DESKTOP */}
        {isDesktop && (
          <>

            <EditorPanel
              ref={editorRef}
              language={language}
              setLanguage={setLanguage}
              isRunning={isRunning}
              runCode={runCode}
              theme={theme}
              toggleTheme={() =>
                setTheme(t => (t === "dark" ? "light" : "dark"))
              }
              shareCode={shareCode}

            />

            {isDesktop && <div
              onMouseDown={startDragging}
              className="w-1px cursor-col-resize middle-divider"
            />}

            <OutputPanel
              ref={outputRef}
              output={output}
              onSend={sendStdin}
              onClear={clearOutput}
              isRunning={isRunning}
              theme={theme}
              style={{ width: outputWidth, overflow: "auto" }}

            />


          </>
        )}

        {/* MOBILE EDITOR */}
        {!isDesktop && (
          <EditorPanel
            ref={editorRef}
            language={language}
            setLanguage={setLanguage}
            isRunning={isRunning}
            runCode={runCode}
            theme={theme}
            toggleTheme={() =>
              setTheme(t => (t === "dark" ? "light" : "dark"))
            }
            shareCode={shareCode}
            onEditorFocus={() => {
              if (!isDesktop) {
                setShowMobileOutput(false);
              }
            }}
          />
        )}

        {/* MOBILE FLOATING OUTPUT */}
        {!isDesktop && showMobileOutput && (
          <div style={{ borderTopLeftRadius: "25px", borderTopRightRadius: "25px"}} className={`absolute left-1 right-1 bottom-0 z-50 h-[55%] flex flex-col ${theme === 'dark' ? "bg-slate-900" : "bg-gray-100" }`}>
            <div className="flex justify-between items-center px-3 py-2 border-b">
              <strong className="px-2 flex items-center filename-color text-slate-300">
                Output
              </strong>
              <button
                onClick={() => setShowMobileOutput(false)}
                className="px-2 py-1 rounded text-slate-300"
              >
                <CloseIcon />
              </button>
            </div>

            <OutputPanel
              ref={outputRef}
              output={output}
              onSend={sendStdin}
              onClear={clearOutput}
              isRunning={isRunning}
              theme={theme}
              style={{overflow: "auto"}}
            />
          </div>
        )}
      </div>
    </div>
  );
}

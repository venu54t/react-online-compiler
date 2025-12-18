import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useIsDesktop } from "../utils/editor-panel";
import InfoTooltip from "./ToolTip";

export type OutputPanelHandle = {
  focus: () => void;
};

type Props = {
  output: string;
  onSend: (txt: string) => void;
  onClear: () => void;
  isRunning: boolean;
  theme: "dark" | "light";
  style?: React.CSSProperties;
};

const OutputPanel = forwardRef<OutputPanelHandle, Props>(
  ({ output, onSend, onClear, isRunning, theme, style }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [buffer, setBuffer] = useState("");
    const [blink, setBlink] = useState(true);

    const isDesktop = useIsDesktop();

    /* -------------------------------------------------
       Expose focus (DESKTOP ONLY)
       ------------------------------------------------- */
    useImperativeHandle(ref, () => ({
      focus() {
        if (isDesktop) {
          containerRef.current?.focus();
        }
      },
    }));

    /* -------------------------------------------------
       MOBILE: focus textarea ONLY while running
       ------------------------------------------------- */
    useEffect(() => {
      if (isDesktop) return;

      if (isRunning) {
        // execution started → open keyboard
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      } else {
        // execution finished → close keyboard
        textareaRef.current?.blur();
        setBuffer(""); // clear leftover input
      }
    }, [isRunning, isDesktop]);

    /* -------------------------------------------------
       Auto-scroll output (both desktop & mobile)
       ------------------------------------------------- */
    useEffect(() => {
      containerRef.current?.scrollTo(
        0,
        containerRef.current.scrollHeight
      );
    }, [output]);

    /* -------------------------------------------------
       Cursor blink (desktop only)
       ------------------------------------------------- */
    useEffect(() => {
      if (!isDesktop || !isRunning) return;
      const id = setInterval(() => setBlink(b => !b), 500);
      return () => clearInterval(id);
    }, [isRunning, isDesktop]);

    /* -------------------------------------------------
       DESKTOP key handling
       ------------------------------------------------- */
    function onDesktopKey(e: React.KeyboardEvent) {
      if (!isRunning) return;

      if (e.key === "Enter") {
        onSend(buffer + "\n");
        setBuffer("");
        e.preventDefault();
      } else if (e.key === "Backspace") {
        setBuffer(b => b.slice(0, -1));
        e.preventDefault();
      } else if (e.key.length === 1) {
        setBuffer(b => b + e.key);
        e.preventDefault();
      }
    }

    /* -------------------------------------------------
       MOBILE key handling (textarea)
       ------------------------------------------------- */
    function onMobileKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
      if (!isRunning) return;

      if (e.key === "Enter") {
        onSend(buffer + "\n");
        setBuffer("");
        e.preventDefault();
      }
    }

    /* -------------------------------------------------
       UI
       ------------------------------------------------- */
    return (
      <div className="w-full lg:w-[480px] flex flex-col" style={style}>
        {/* Header */}
        <div
          className={`px-3 py-2 flex justify-between border-b ${
            theme === "dark" ? "border-slate-700" : "border-gray-300"
          }`}
        >
          <strong className="px-2 flex items-center text-slate-300">
            Output
            <span className="ml-2">
              <InfoTooltip
                theme={theme}
                text="Run the code to see the output"
              />
            </span>
          </strong>
          <button
            onClick={onClear}
            className="px-2 py-1 border rounded border-slate-700 text-slate-300"
          >
            Clear
          </button>
        </div>

        {/* Output area (shared) */}
        <div
          ref={containerRef}
          tabIndex={isDesktop ? 0 : -1}
          onKeyDown={isDesktop ? onDesktopKey : undefined}
          className={`flex-1 p-3 font-mono outline-none overflow-auto
            ${
              theme === "dark"
                ? "bg-black text-green-400"
                : "bg-white text-gray-800"
            }`}
          style={{ whiteSpace: "break-spaces" }}
        >
          {output}
          {isDesktop && isRunning && (
            <span>
              {buffer}
              {blink ? "▌" : " "}
            </span>
          )}
        </div>

        {/* Mobile input (ONLY while running) */}
        {!isDesktop && isRunning && (
          <textarea
            ref={textareaRef}
            value={buffer}
            onChange={(e) => setBuffer(e.target.value)}
            onKeyDown={onMobileKeyDown}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={`
              h-12 resize-none outline-none px-3 py-2 font-mono
              border-t border-slate-700
              ${
                theme === "dark"
                  ? "bg-black text-green-400"
                  : "bg-white text-gray-800"
              }
            `}
            placeholder="Enter input…"
          />
        )}
      </div>
    );
  }
);

export default OutputPanel;

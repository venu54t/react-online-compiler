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
    const [buffer, setBuffer] = useState("");
    const [blink, setBlink] = useState(true);
    const isDesktop = useIsDesktop();
    const inputRef = useRef<HTMLInputElement>(null);

    // Expose focus() to parent
    useImperativeHandle(ref, () => ({
      focus() {
        if (isDesktop)
          containerRef.current?.focus();
        else
          inputRef.current?.focus();
      },
    }));

    function onMobileKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Enter") {
        onSend(buffer + "\n");
        setBuffer("");
        e.preventDefault();
      }
    }


    function onMobileInput(e: React.ChangeEvent<HTMLInputElement>) {
      const value = e.target.value;
      setBuffer(value);
    }

    // Auto-scroll
    useEffect(() => {
      containerRef.current?.scrollTo(
        0,
        containerRef.current.scrollHeight
      );
    }, [output]);

    // Cursor blink
    useEffect(() => {
      if (!isRunning) return;
      const id = setInterval(() => setBlink(b => !b), 500);
      return () => clearInterval(id);
    }, [isRunning]);

    // Auto-focus when run starts
    useEffect(() => {
      if (isRunning) {
        // wait for render
        setTimeout(() => {
          containerRef.current?.focus();
        }, 0);
      }
    }, [isRunning]);

    function onKey(e: React.KeyboardEvent) {
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

    return (
      <div className="w-full lg:w-[480px] flex flex-col" style={style}>
        <div className={`px-3 py-2 flex justify-between border-b ${theme === "dark" ? "border-slate-700" : "border-gray-300"}`}>
          <strong className="px-2 flex items-center rounded border-slate-700 filename-color text-slate-300">
            Output
            <span className="ml-2"><InfoTooltip theme={theme} text="Run the code to see the output" /></span>
          </strong>
          <button
            onClick={onClear}
            className="px-2 py-1 border rounded border-slate-700 text-slate-300"
          >
            Clear
          </button>
        </div>
        {!isDesktop && isRunning && (
          <input
            ref={inputRef}
            value={buffer}
            onChange={onMobileInput}
            onKeyDown={onMobileKeyDown}
            className="absolute opacity-0 pointer-events-none"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="enter input"
          />
        )}

        <div
          ref={containerRef}
          tabIndex={0}               // focusable
          onKeyDown={onKey}
          className={`flex-1 p-3 font-mono outline-none
            ${theme === "dark"
              ? "bg-black text-green-400"
              : "bg-white text-gray-800"}
          `}
          style={{ whiteSpace: "break-spaces", overflow: "auto" }}
        >
          {output}
          {isRunning && (
            <span>
              {buffer}
              {blink ? "▌" : " "}
            </span>
          )}
        </div>
      </div>
    );
  }
);

export default OutputPanel;

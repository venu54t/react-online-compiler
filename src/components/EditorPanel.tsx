import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { templates } from "../constants/templates";
import * as monacoEditor from "monaco-editor";

import ShareIcon from "../svg/ShareIcon";
import DarkThemeIcon from "../svg/DarkThemeIcon";
import LightThemeIcon from "../svg/LightThemeIcon";
import RunIcon from "../svg/RunIcon";
import { getQueryParam, useIsDesktop } from "../utils/editor-panel";

type Props = {
  language: string;
  setLanguage: (l: string) => void;
  runCode: () => void;
  isRunning: boolean;
  theme: "dark" | "light";
  toggleTheme: () => void;
  shareCode: () => void;
  onEditorFocus?: () => void;
};

const EditorPanel = forwardRef<any, Props>(
  (
    {
      language,
      setLanguage,
      runCode,
      isRunning,
      theme,
      toggleTheme,
      shareCode,
      onEditorFocus,
    },
    ref
  ) => {
    const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(
      null
    );

    const pendingCodeRef = useRef<string | null>(null);
    const isDesktop = useIsDesktop();
    useEffect(() => {
      const share = getQueryParam("share");
      if (!share) return;

      try {
        const json = JSON.parse(
          decodeURIComponent(atob(share))
        );

        if (json.language) {
          setLanguage(json.language);
        }

        pendingCodeRef.current = json.code ?? null;
      } catch (e) {
        console.error("Invalid share payload");
      }
    }, []);


    useImperativeHandle(ref, () => ({
      getValue: () => editorRef.current?.getValue() ?? "",
      setValue: (v: string) => editorRef.current?.setValue(v),
    }));

    const handleMount: OnMount = (editor) => {
      editorRef.current = editor;

      editor.onDidFocusEditorText(() => {
        onEditorFocus?.();
      });

      if (pendingCodeRef.current) {
        editor.setValue(pendingCodeRef.current);
        pendingCodeRef.current = null;
      }
    };

    // language + template correctly
    useEffect(() => {
      if (!editorRef.current) return;

      const model = editorRef.current.getModel();
      if (!model) return;

      // update Monaco language
      monacoEditor.editor.setModelLanguage(model, language);

      // template AFTER language switch
      editorRef.current.setValue(templates[language] ?? "");
    }, [language]);


    function setupMonaco(monaco: any) {
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        allowNonTsExtensions: true,
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
      });

      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });

      monaco.languages.typescript.javascriptDefaults.addExtraLib(
        `declare var require: any;
        declare var process: any;
        declare var module: any;
        `,
        "ts:node-globals.d.ts"
      );
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
      });

    }

    return (
      <div className="flex-1 flex flex-col min-w-0 min-h-[50vh] lg:min-h-0">
        {/* Top Bar */}
        <div
          className={`flex ${theme === "dark"
            ? "bg-slate-900 border-slate-800 text-slate-300"
            : "border-gray-200 text-gray-800"
            }`}
        >
          <strong className="px-3 py-3 border-r text-slate-300 filename-color filename-bg">
            {"main." +
              (language === "python"
                ? "py"
                : language === "javascript"
                  ? "js"
                  : language === "cpp"
                    ? "cpp"
                    : language === "java"
                      ? "java"
                      : language === "c"
                        ? "c"
                        : language === "go"
                          ? "go"
                          : language === "ruby"
                            ? "rb"
                            : "txt")}
          </strong>

          <div className="flex flex-1 justify-end gap-4 px-3 py-2 border-b">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`${theme === "dark" ? "bg-slate-900" : ""
                } border text-slate-300 px-2 py-1 rounded font-medium text-sm`}
            >
              {Object.keys(templates).map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>

            <button
              title={theme === "dark" ? "Toggle theme light" : "Toggle theme dark"}
              onClick={toggleTheme}
              className="px-2 py-1 border rounded text-slate-300"
            >
              {theme === "dark" ? <DarkThemeIcon /> : <LightThemeIcon />}
            </button>

            <button
              title="Share"
              onClick={shareCode}
              className="px-2 py-1 border rounded text-slate-300"
            >
              <ShareIcon />
            </button>

            <button
              title="Run"
              onClick={() => runCode()}
              disabled={isRunning}
              className={`px-2 py-1 border rounded text-slate-300 ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <RunIcon />
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div
          className="flex-1"
          onTouchStart={() => {
            onEditorFocus?.();        
            editorRef.current?.focus();
          }}
          onMouseDown={() => {
            onEditorFocus?.();       
          }}
        >
          <Editor
            height={"100%"}
            beforeMount={setupMonaco}
            defaultValue={templates[language]}
            language={language}
            onMount={handleMount}
            theme={theme === "dark" ? "vs-dark" : "light"}
            options={{
              minimap: { enabled: false },
              fontSize: isDesktop ? 16 : 18,
              lineNumbers: isDesktop ? "on" : "off",
              glyphMargin: isDesktop,
              folding: isDesktop,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              scrollbar: {
                alwaysConsumeMouseWheel: false,
                vertical: "hidden",
                horizontal: "hidden"
              }
            }}
          />
        </div>
      </div>
    );
  }
);

export default EditorPanel;

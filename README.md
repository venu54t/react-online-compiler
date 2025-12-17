# React Online Compiler (Vite + Monaco + Tailwind)

This is a starter React project that demonstrates:
- Monaco editor integration (@monaco-editor/react)
- Tailwind CSS (via PostCSS)
- WebSocket-based runner integration (frontend talks to your backend at ws://localhost:3000)
- Simple auth mock (localStorage)
- Per-user job handling (client-side)
- File tree, multi-file support (client-side)
- Download project files as JSON

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start dev server:
```bash
npm run dev
```

3. Open `http://localhost:5173` and use the app. Make sure your backend WebSocket server is running at `ws://localhost:3000`.

## Notes

- The project uses `@monaco-editor/react`. If you encounter issues with Monaco in some environments, the app will still work with a basic textarea fallback (but this project includes Monaco).
- The backend is expected to be the WebSocket server you already have (the one that creates ephemeral containers).

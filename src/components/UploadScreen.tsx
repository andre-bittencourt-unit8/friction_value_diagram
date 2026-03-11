import { useRef, useState, useCallback } from "react";

interface UploadScreenProps {
  onLoad: (data: unknown, fileName: string) => void | Promise<void>;
  onLoadSaved: () => void | Promise<void>;
  hasSavedVisualization: boolean;
  error?: string | null;
}

export default function UploadScreen({
  onLoad,
  onLoadSaved,
  hasSavedVisualization,
  error,
}: UploadScreenProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loadingExample, setLoadingExample] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const readFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string);
        onLoad(data, file.name);
      } catch {
        onLoad(null, file.name);
      }
    };
    reader.readAsText(file);
  }, [onLoad]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".json")) readFile(file);
  };

  const loadExample = async () => {
    setLoadingExample(true);
    try {
      const res = await fetch("/example.json");
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      onLoad(data, "csr_authoring_example.json");
    } catch {
      alert("Could not load example file.");
    }
    setLoadingExample(false);
  };

  const loadSaved = async () => {
    setLoadingSaved(true);
    try {
      await onLoadSaved();
    } finally {
      setLoadingSaved(false);
    }
  };

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      fontFamily: "system-ui, sans-serif", background: "#f8fafc", color: "#0f172a",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 24px", background: "#0f172a", color: "#fff",
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
      }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Value Friction Diagram</span>
        <span style={{ fontSize: 11, color: "#64748b" }}>Viewer</span>
      </div>

      {/* Main */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 32,
      }}>
        <div style={{ maxWidth: 520, width: "100%" }}>

          {/* Title */}
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
              Load a VFD Model
            </div>
            <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
              Upload a Value Friction Diagram JSON file to visualise it.
              The file will be validated and auto-arranged before rendering.
            </div>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragging ? "#3b82f6" : "#cbd5e1"}`,
              borderRadius: 16,
              padding: "48px 32px",
              textAlign: "center",
              cursor: "pointer",
              background: dragging ? "#eff6ff" : "#fff",
              transition: "all .15s",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>⬆</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              Drop a JSON file here
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              or click to browse
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, background: "#fef2f2",
              border: "1px solid #fecaca", color: "#dc2626", fontSize: 13,
              marginBottom: 16, lineHeight: 1.5,
            }}>
              <b>Could not load file.</b> {error}
            </div>
          )}

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ fontSize: 12, color: "#94a3b8" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          {/* Example button */}
          <button
            onClick={loadExample}
            disabled={loadingExample}
            style={{
              width: "100%", padding: "14px 20px", borderRadius: 12,
              border: "1px solid #e2e8f0", background: "#fff",
              cursor: loadingExample ? "default" : "pointer",
              fontSize: 13, fontWeight: 600, color: "#0f172a",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: loadingExample ? 0.6 : 1, transition: "background .1s",
            }}
            onMouseEnter={e => { if (!loadingExample) (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
          >
            <span style={{ fontSize: 18 }}>💊</span>
            <span>{loadingExample ? "Loading…" : "Load CSR authoring example"}</span>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>Clinical Study Report process</span>
          </button>

          {hasSavedVisualization && (
            <button
              onClick={loadSaved}
              disabled={loadingSaved}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                background: "#fff",
                cursor: loadingSaved ? "default" : "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: loadingSaved ? 0.6 : 1,
                transition: "background .1s",
                marginTop: 12,
              }}
              onMouseEnter={e => { if (!loadingSaved) (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
            >
              <span style={{ fontSize: 18 }}>💾</span>
              <span>{loadingSaved ? "Loading…" : "Load saved visualization"}</span>
            </button>
          )}

          {/* Schema hint */}
          <div style={{ marginTop: 24, padding: "12px 16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
              Expected JSON schema (VFD v5.2)
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#64748b", lineHeight: 1.7 }}>
              {`{ "definition": {...}, "nodes": [...], "flows": [...],`}<br/>
              {`  "forces": [...], "frictionPoints": [...],`}<br/>
              {`  "feedbackLoops": [...], "capabilityProfiles": [...] }`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

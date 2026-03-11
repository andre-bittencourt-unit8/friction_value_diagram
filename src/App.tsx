import { useEffect, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ExportReport from "./components/ExportReport";
import VFDRenderer from "./components/VFDRenderer";
import { validate, ValidationResult } from "./lib/validate";
import { needsLayout, autoLayout } from "./lib/layout";

const SAVED_VISUALIZATION_KEY = "vfd_saved_visualization_v1";
const DEFAULT_VFD_PATH = "/csr_authoring_process.json";
const DEFAULT_VFD_FILE_NAME = "csr_authoring_process.json";
type SaveStatus = "idle" | "saved" | "error";
type ExportPayload = {
  diagramSvg: string;
  selectedElement: any;
  selectedType: string | null;
};

function toExportBaseName(vfdData: any, fileName: string): string {
  const processName = String(vfdData?.definition?.processName || "").trim();
  const sourceName = String(fileName || "").replace(/\.json$/i, "").trim();
  const base = processName || sourceName || "value-friction-diagram";

  return base
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function readSavedVisualization(): { fileName: string; data: any } | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(SAVED_VISUALIZATION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.data) return null;
    return {
      fileName: typeof parsed.fileName === "string" ? parsed.fileName : "saved_visualization.json",
      data: parsed.data,
    };
  } catch {
    return null;
  }
}

export default function App() {
  const [vfdData, setVfdData] = useState<any>(null);
  const [fileName, setFileName] = useState("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLayouting, setIsLayouting] = useState(false);
  const [hasSavedVisualization, setHasSavedVisualization] = useState(() => !!readSavedVisualization());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const handleLoad = async (raw: unknown, name: string) => {
    setUploadError(null);

    if (raw === null) {
      setUploadError("The file could not be parsed as JSON. Make sure it is a valid .json file.");
      return;
    }

    const result = validate(raw);

    if (!result.valid) {
      const firstError = result.issues.find(i => i.severity === "error");
      setUploadError(firstError?.message ?? "Validation failed.");
      return;
    }

    // Auto-layout if positions are missing or overlapping
    setIsLayouting(true);
    try {
      const cleaned = needsLayout(result.cleaned.nodes)
        ? await autoLayout(result.cleaned)
        : result.cleaned;

      setVfdData(cleaned);
      setValidation(result);
      setFileName(name);
    } finally {
      setIsLayouting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadDefaultVisualization = async () => {
      setIsBootstrapping(true);
      setUploadError(null);

      try {
        const response = await fetch(DEFAULT_VFD_PATH, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load default visualization (${response.status})`);
        }

        const data = await response.json();
        if (!cancelled) {
          await handleLoad(data, DEFAULT_VFD_FILE_NAME);
        }
      } catch {
        if (!cancelled) {
          setUploadError(`Could not load ${DEFAULT_VFD_FILE_NAME}.`);
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    void loadDefaultVisualization();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRearrange = async () => {
    if (!vfdData || isLayouting) return;

    setIsLayouting(true);
    try {
      setVfdData(await autoLayout(vfdData));
    } finally {
      setIsLayouting(false);
    }
  };

  const handleNodePositionChange = (nodeId: string, x: number, y: number) => {
    setVfdData((current: any) => {
      if (!current?.nodes) return current;
      const minCoordinate = 24;

      return {
        ...current,
        nodes: current.nodes.map((node: any) =>
          node.id === nodeId
            ? {
                ...node,
                x: Math.max(minCoordinate, Math.round(x)),
                y: Math.max(minCoordinate, Math.round(y)),
              }
            : node
        ),
      };
    });
  };

  const handleElementChange = (
    elementType: string,
    elementId: string,
    changes: Record<string, any>
  ) => {
    setVfdData((current: any) => {
      if (!current) return current;

      const collectionKey =
        elementType === "node"
          ? "nodes"
          : elementType === "flow"
            ? "flows"
            : elementType === "force"
              ? "forces"
            : elementType === "friction"
              ? "frictionPoints"
              : elementType === "loop"
                ? "feedbackLoops"
                : null;

      if (!collectionKey || !Array.isArray(current[collectionKey])) return current;

      return {
        ...current,
        [collectionKey]: current[collectionKey].map((element: any) =>
          element.id === elementId ? { ...element, ...changes } : element
        ),
      };
    });
  };

  const handleLoadNew = () => {
    setVfdData(null);
    setValidation(null);
    setUploadError(null);
    setIsBootstrapping(true);

    void (async () => {
      try {
        const response = await fetch(DEFAULT_VFD_PATH, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load default visualization (${response.status})`);
        }

        const data = await response.json();
        await handleLoad(data, DEFAULT_VFD_FILE_NAME);
      } catch {
        setUploadError(`Could not load ${DEFAULT_VFD_FILE_NAME}.`);
      } finally {
        setIsBootstrapping(false);
      }
    })();
  };

  const handleSaveVisualization = () => {
    if (!vfdData || typeof window === "undefined") return;

    try {
      const payload = JSON.stringify(
        {
          fileName,
          data: vfdData,
          savedAt: new Date().toISOString(),
        },
        null,
        2
      );

      window.localStorage.setItem(SAVED_VISUALIZATION_KEY, payload);
      setHasSavedVisualization(true);

      const blob = new Blob([JSON.stringify(vfdData, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const baseName = (fileName || "vfd_visualization").replace(/\.json$/i, "");
      link.href = url;
      link.download = `${baseName}_layout.json`;
      link.click();
      window.URL.revokeObjectURL(url);

      setSaveStatus("saved");
      window.setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      window.setTimeout(() => setSaveStatus("idle"), 2500);
    }
  };

  const handleLoadSaved = async () => {
    const saved = readSavedVisualization();
    if (!saved) {
      setUploadError("No saved visualization was found in this browser.");
      setHasSavedVisualization(false);
      return;
    }

    await handleLoad(saved.data, saved.fileName);
  };

  const handleExportPdf = ({ diagramSvg, selectedElement, selectedType }: ExportPayload) => {
    if (typeof window === "undefined" || !vfdData) return;
    const exportBaseName = `${toExportBaseName(vfdData, fileName)}-value-friction-report`;

    const exportWindow = window.open("", "_blank", "width=1440,height=960");
    if (!exportWindow) return;

    const markup = renderToStaticMarkup(
      <ExportReport
        vfdData={vfdData}
        fileName={fileName}
        diagramSvg={diagramSvg}
        selectedElement={selectedElement}
        selectedType={selectedType}
        exportDate={new Date().toLocaleString()}
        staticMode
      />
    );

    exportWindow.document.open();
    exportWindow.document.write(`<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${exportBaseName}</title>
        </head>
        <body>${markup}
          <script>
            const printButton = document.getElementById('export-print-button');
            const closeButton = document.getElementById('export-close-button');
            if (printButton) {
              printButton.addEventListener('click', function () { window.print(); });
            }
            if (closeButton) {
              closeButton.addEventListener('click', function () { window.close(); });
            }
          </script>
        </body>
      </html>`);
    exportWindow.document.close();
    exportWindow.focus();
  };

  if (vfdData) {
    return (
      <VFDRenderer
        vfdData={vfdData}
        fileName={fileName}
        validation={validation}
        onLoadNew={handleLoadNew}
        onLoadVisualization={handleLoad}
        onLoadSaved={handleLoadSaved}
        onRearrange={handleRearrange}
        onSaveVisualization={handleSaveVisualization}
        onNodePositionChange={handleNodePositionChange}
        onElementChange={handleElementChange}
        onExportPdf={handleExportPdf}
        isLayouting={isLayouting}
        saveStatus={saveStatus}
        hasSavedVisualization={hasSavedVisualization}
      />
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "system-ui, sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#ffffff",
          border: "1px solid #dbe3ef",
          borderRadius: 16,
          padding: "24px 28px",
          boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
          {isBootstrapping ? "Loading visualization" : "Visualization unavailable"}
        </div>
        <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
          {isBootstrapping
            ? `Opening ${DEFAULT_VFD_FILE_NAME}.`
            : uploadError || `Could not load ${DEFAULT_VFD_FILE_NAME}.`}
        </div>
      </div>
    </div>
  );
}

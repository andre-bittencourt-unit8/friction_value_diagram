import React from "react";
import GuidePanel from "./GuidePanel";
import InspectPanel from "./InspectPanel";
import OverviewPanel from "./OverviewPanel";

interface ExportReportProps {
  vfdData: any;
  fileName: string;
  diagramSvg: string;
  selectedElement: any;
  selectedType: string | null;
  exportDate: string;
  onClose?: () => void;
  staticMode?: boolean;
}

function Page({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section
      className="export-page"
      style={{
        display: "block",
        boxSizing: "border-box",
        background: "#ffffff",
      }}
    >
      <div className="export-page-inner">
        {title ? (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", lineHeight: 1.15 }}>{title}</div>
            {subtitle ? (
              <div style={{ marginTop: 8, fontSize: 13, color: "#64748b", lineHeight: 1.55 }}>{subtitle}</div>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}

function KeyValue({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.55 }}>{value}</div>
    </div>
  );
}

export default function ExportReport({
  vfdData,
  fileName,
  diagramSvg,
  selectedElement,
  selectedType,
  exportDate,
  onClose,
  staticMode = false,
}: ExportReportProps): React.ReactElement {
  const definition = vfdData?.definition || {};

  return (
    <div
      className="export-report"
      style={{
        fontFamily:
          'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: "#0f172a",
        background: "#ffffff",
      }}
    >
      <style>
        {`
          @page {
            size: A4 landscape;
            margin: 18mm 14mm 18mm 14mm;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #e5e7eb;
          }
          .export-report {
            background: #e5e7eb;
            padding: 18px 0 28px;
          }
          .export-page {
            background: #ffffff;
            width: 297mm;
            min-height: 210mm;
            margin: 0 auto 18px;
            box-shadow: 0 12px 36px rgba(15, 23, 42, 0.14);
            overflow: hidden;
            position: relative;
          }
          .export-page + .export-page {
            break-before: page;
            page-break-before: always;
          }
          .export-page-inner {
            padding: 14mm;
            min-height: 210mm;
            box-sizing: border-box;
          }
          .export-keep,
          .export-keep > *,
          .export-keep section,
          .export-keep div,
          .export-keep svg {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .export-page:last-child {
            break-after: auto;
            page-break-after: auto;
            margin-bottom: 0;
          }
          @media print {
            html, body {
              background: #ffffff !important;
            }
            body {
              margin: 0;
              background: #ffffff;
            }
            .export-toolbar {
              display: none !important;
            }
            .export-report {
              background: #ffffff !important;
              padding: 0 !important;
            }
            .export-page {
              width: auto !important;
              min-height: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              overflow: visible !important;
              display: block !important;
            }
            .export-page + .export-page {
              break-before: page !important;
              page-break-before: always !important;
            }
            .export-page-inner {
              min-height: auto !important;
              padding: 4mm 0 6mm 0 !important;
              box-sizing: border-box !important;
            }
            .export-keep,
            .export-keep > *,
            .export-keep section,
            .export-keep div,
            .export-keep svg {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            .export-diagram {
              max-height: 165mm;
              overflow: hidden !important;
            }
            .export-diagram svg {
              max-height: 165mm;
              width: 100% !important;
              height: auto !important;
            }
          }
          .export-diagram svg {
            width: 100%;
            height: auto;
            display: block;
          }
        `}
      </style>

      <div
        className="export-toolbar"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "14px 18px",
          borderBottom: "1px solid #e2e8f0",
          background: "rgba(248, 250, 252, 0.96)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Export Report Ready</div>
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.55 }}>
            Use the button to open your browser print dialog, then choose <strong>Save as PDF</strong>.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button
            id={staticMode ? "export-print-button" : undefined}
            onClick={staticMode ? undefined : () => window.print()}
            style={{
              padding: "9px 14px",
              fontSize: 12,
              fontWeight: 700,
              background: "#0f172a",
              color: "#ffffff",
              border: "1px solid #0f172a",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            Print / Save as PDF
          </button>
          {staticMode ? (
            <button
              id="export-close-button"
              style={{
                padding: "9px 14px",
                fontSize: 12,
                fontWeight: 700,
                background: "#ffffff",
                color: "#475569",
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          ) : onClose ? (
            <button
              onClick={onClose}
              style={{
                padding: "9px 14px",
                fontSize: 12,
                fontWeight: 700,
                background: "#ffffff",
                color: "#475569",
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              Back to Diagram
            </button>
          ) : null}
        </div>
      </div>

      <Page
        title={definition.processName || fileName.replace(/\.json$/i, "") || "VFD Export"}
        subtitle={definition.description || "Where is value being destroyed — and why?"}
      >
        <div
          style={{
            padding: 18,
            borderRadius: 18,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            marginBottom: 18,
          }}
        >
          <KeyValue label="Value Atom" value={definition.valueAtom || "Not defined"} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 18, marginBottom: 18 }}>
          <KeyValue label="Output" value={definition.output || "Not defined"} />
          <KeyValue label="Customer" value={definition.customer || "Not defined"} />
          <KeyValue label="Config" value={definition.valueConfiguration || "Not defined"} />
          <KeyValue label="Exported" value={exportDate} />
        </div>

        {definition.configurationNotes ? (
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              fontSize: 13,
              color: "#475569",
              lineHeight: 1.6,
              marginBottom: 18,
            }}
          >
            {definition.configurationNotes}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: selectedElement ? "1fr 1fr" : "1fr",
            gap: 18,
          }}
        >
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", marginBottom: 10 }}>Report Scope</div>
            <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.65 }}>
              This PDF includes the whole-system diagram, a compact field guide, an overview diagnosis, and
              {selectedElement ? " the currently selected element detail." : " no selected-element appendix."}
            </div>
          </div>

          {selectedElement ? (
            <div
              style={{
                padding: 16,
                borderRadius: 16,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", marginBottom: 10 }}>Selected Detail</div>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.65 }}>
                {selectedType ? `${selectedType[0].toUpperCase()}${selectedType.slice(1)}` : "Element"}:
                {" "}
                <strong style={{ color: "#0f172a" }}>{selectedElement?.label || selectedElement?.title || selectedElement?.id || "Current selection"}</strong>
              </div>
            </div>
          ) : null}
        </div>
      </Page>

      <Page
        title="How To Read This VFD"
        subtitle="This condensed guide is included because the PDF is static and cannot rely on hover, tabs, or interaction."
      >
        <div className="export-keep">
          <GuidePanel />
        </div>
      </Page>

      <Page
        title="Whole-System Diagram"
        subtitle="This page captures the currently visible graph state. Use the overview and detail appendix alongside it."
      >
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 18,
            padding: 16,
            background: "#ffffff",
          }}
        >
          <div className="export-diagram" dangerouslySetInnerHTML={{ __html: diagramSvg }} />
        </div>
      </Page>

      <Page
        title="Overview"
        subtitle="A whole-system reading of value transformation, propagation, loss, dynamics, and priority areas."
      >
        <div className="export-keep">
          <OverviewPanel vfdData={vfdData} />
        </div>
      </Page>

      {selectedElement ? (
        <Page
          title="Selected Element Detail"
          subtitle="This appendix includes the element that was selected when the export was generated."
        >
          <div className="export-keep">
            <InspectPanel
              element={selectedElement}
              elementType={selectedType}
              vfdData={vfdData}
              onElementChange={() => undefined}
              readOnly
            />
          </div>
        </Page>
      ) : null}
    </div>
  );
}

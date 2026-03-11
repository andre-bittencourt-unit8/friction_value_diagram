import React, { useMemo, useState } from "react";

interface AnalystAIPanelProps {
  vfdData: any;
  fileName: string;
  selectedElement: any;
  selectedType: string | null;
}

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const EXAMPLE_QUESTIONS = [
  "If I could only change three things in this process, what should I change first?",
  "Which architectural changes would have the biggest impact on this workflow?",
  "Where are the root structural problems versus local symptoms?",
  "How much resistance should I expect if I try to introduce agentic capabilities into this process?",
  "What should I investigate before redesigning this process?",
];

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "0.95em",
            background: "#e2e8f0",
            color: "#0f172a",
            padding: "1px 4px",
            borderRadius: 4,
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function renderMarkdown(text: string): React.ReactElement {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let bulletList: string[] = [];
  let orderedList: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(
      <p key={`p-${blocks.length}`} style={{ margin: 0, lineHeight: 1.7 }}>
        {renderInlineMarkdown(paragraph.join(" "))}
      </p>
    );
    paragraph = [];
  };

  const flushBulletList = () => {
    if (bulletList.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
        {bulletList.map((item, index) => (
          <li key={index}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
    bulletList = [];
  };

  const flushOrderedList = () => {
    if (orderedList.length === 0) return;
    blocks.push(
      <ol key={`ol-${blocks.length}`} style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
        {orderedList.map((item, index) => (
          <li key={index}>{renderInlineMarkdown(item)}</li>
        ))}
      </ol>
    );
    orderedList = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushBulletList();
    flushOrderedList();
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushAll();
      return;
    }

    if (line === "---") {
      flushAll();
      blocks.push(
        <hr key={`hr-${blocks.length}`} style={{ border: 0, borderTop: "1px solid #cbd5e1", margin: 0 }} />
      );
      return;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushAll();
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const fontSize = level === 1 ? 22 : level === 2 ? 18 : 15;
      blocks.push(
        <div key={`h-${blocks.length}`} style={{ fontSize, fontWeight: 800, lineHeight: 1.35, margin: 0 }}>
          {renderInlineMarkdown(content)}
        </div>
      );
      return;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      flushBulletList();
      orderedList.push(orderedMatch[1]);
      return;
    }

    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      flushOrderedList();
      bulletList.push(bulletMatch[1]);
      return;
    }

    flushBulletList();
    flushOrderedList();
    paragraph.push(line);
  });

  flushAll();

  return <div style={{ display: "grid", gap: 10 }}>{blocks}</div>;
}

function buildSelectedElementSummary(selectedElement: any, selectedType: string | null): string {
  if (!selectedElement || !selectedType) {
    return "No specific element is currently selected.";
  }

  if (selectedType === "node") {
    return `Selected step: ${selectedElement.label || selectedElement.sublabel || "an unnamed step"} (${selectedElement.category || "value"}).`;
  }
  if (selectedType === "flow") {
    return `Selected handoff: ${selectedElement.label || "an unlabeled flow"} between two steps in the process.`;
  }
  if (selectedType === "friction") {
    return `Selected friction point: ${selectedElement.title || "an unnamed friction point"} with severity ${selectedElement.severity || "unknown"}.`;
  }
  if (selectedType === "loop") {
    return `Selected feedback loop: ${selectedElement.label || "an unnamed loop"} with polarity ${selectedElement.polarity || "unknown"}.`;
  }

  return `A process element is currently selected (${selectedType}).`;
}

export default function AnalystAIPanel({
  vfdData,
  fileName,
  selectedElement,
  selectedType,
}: AnalystAIPanelProps): React.ReactElement {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedElementSummary = useMemo(
    () => buildSelectedElementSummary(selectedElement, selectedType),
    [selectedElement, selectedType]
  );
  const hasConversation = messages.length > 0 || isSending;

  const submitQuestion = async (questionOverride?: string) => {
    const question = (questionOverride ?? draft).trim();
    if (!question || isSending) return;

    setError(null);
    setIsSending(true);

    const previousMessages = messages;
    const nextMessages: ChatMessage[] = [...previousMessages, { role: "user", text: question }];
    setMessages(nextMessages);
    setDraft(questionOverride ? draft : "");

    try {
      const response = await fetch("/api/analyst", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName,
          model: DEFAULT_MODEL,
          selectedElementSummary,
          messages: nextMessages,
          vfdData,
        }),
      });

      const rawBody = await response.text();
      let responseJson: any = null;

      try {
        responseJson = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        responseJson = null;
      }

      if (!response.ok) {
        throw new Error(
          responseJson?.error ||
            rawBody ||
            `The request failed with status ${response.status}.`
        );
      }

      const assistantText = responseJson?.text;
      if (!assistantText) {
        throw new Error(rawBody || "No assistant text was returned.");
      }

      setMessages((current) => [...current, { role: "assistant", text: assistantText }]);
    } catch (err: any) {
      setError(err?.message || "The assistant could not answer the question.");
      setMessages(previousMessages);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 8 }}>
      <div
        style={{
          padding: hasConversation ? "10px 12px" : "14px",
          borderRadius: 16,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ fontSize: hasConversation ? 15 : 18, fontWeight: 800, color: "#0f172a", marginBottom: hasConversation ? 2 : 6 }}>
          Analyst AI
        </div>
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, marginBottom: hasConversation ? 6 : 10 }}>
          Ask about the process, the main issues, likely causes, or what to investigate next.
        </div>
        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: hasConversation ? 6 : 10 }}>
          Example Questions
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: hasConversation ? 6 : 8 }}>
          {EXAMPLE_QUESTIONS.map((question) => (
            <button
              key={question}
              onClick={() => {
                setDraft(question);
              }}
              style={{
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#334155",
                borderRadius: 999,
                padding: hasConversation ? "6px 10px" : "7px 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          overflow: "hidden",
          background: "#ffffff",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "10px 12px",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>
            Conversation
          </div>
          <button
            onClick={() => {
              setMessages([]);
              setError(null);
            }}
            style={{
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              borderRadius: 999,
              padding: "6px 10px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>

        <div style={{ padding: 12, display: "grid", gap: 10, overflowY: "auto", background: "#ffffff", flex: 1, minHeight: 0 }}>
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: message.role === "assistant" ? "#f8fafc" : "#0f172a",
                  color: message.role === "assistant" ? "#0f172a" : "#ffffff",
                  border: message.role === "assistant" ? "1px solid #e2e8f0" : "1px solid #0f172a",
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, opacity: 0.75 }}>
                  {message.role === "assistant" ? "Analyst AI" : "You"}
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.65, whiteSpace: message.role === "assistant" ? "normal" : "pre-wrap" }}>
                  {message.role === "assistant" ? renderMarkdown(message.text) : message.text}
                </div>
              </div>
            ))
          ) : null}
          {isSending ? (
            <div style={{ padding: "12px 14px", borderRadius: 14, background: "#f8fafc", color: "#64748b", fontSize: 12 }}>
              Analyst AI is thinking...
            </div>
          ) : null}
          {error ? (
            <div style={{ padding: "12px 14px", borderRadius: 14, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", fontSize: 12, lineHeight: 1.5 }}>
              {error}
            </div>
          ) : null}
        </div>

        <div style={{ borderTop: "1px solid #e2e8f0", padding: 12, background: "#f8fafc", flexShrink: 0 }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about the process, problems, likely causes, or next steps..."
            rows={3}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #cbd5e1",
              fontSize: 12,
              color: "#0f172a",
              background: "#ffffff",
              resize: "vertical",
              marginBottom: 10,
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => void submitQuestion()}
              disabled={isSending}
              style={{
                border: "1px solid #0f172a",
                background: isSending ? "#94a3b8" : "#0f172a",
                color: "#ffffff",
                borderRadius: 999,
                padding: "8px 12px",
                fontSize: 11,
                fontWeight: 700,
                cursor: isSending ? "default" : "pointer",
              }}
            >
              {isSending ? "Sending..." : "Ask Analyst AI"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

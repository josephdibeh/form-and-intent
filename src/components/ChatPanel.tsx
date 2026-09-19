import { useEffect, useRef } from "react";
import { ArrowUp, Square, ArrowUpRight, Sparkles } from "lucide-react";
import type { ChatReply } from "../ai/chat";
export type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  options?: ChatReply["options"];
  error?: boolean;
  retry?: string;
};
export function ChatPanel({
  messages,
  draft,
  onDraft,
  onSend,
  onCancel,
  busy,
  configured,
  context,
  onClearContext,
  onPreview,
  onImport,
  onExamples,
}: {
  messages: Message[];
  draft: string;
  onDraft: (s: string) => void;
  onSend: (s?: string) => void;
  onCancel: () => void;
  busy: boolean;
  configured: boolean;
  context?: string;
  onClearContext: () => void;
  onPreview: (option: ChatReply["options"][number]) => void;
  onImport: () => void;
  onExamples: () => void;
}) {
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);
  return (
    <aside className="chat-panel" aria-label="Design conversation">
      <div className="chat-heading">
        <div>
          <span className="eyebrow">DESIGN COMPANION</span>
          <h2>Let's work through it.</h2>
        </div>
        <Sparkles size={18} />
      </div>
      <div
        className="chat-messages"
        role="log"
        aria-label="Conversation"
        aria-live="polite"
        ref={log}
      >
        <div className="chat-message assistant">
          <span className="message-author">FORM & INTENT</span>
          <p>
            Start with a problem, an idea, or a question. We can explore this
            order screen together, using the components in our system.
          </p>
          <div className="chat-suggestions">
            {[
              "Make delivery instructions clearer",
              "Explore two different directions",
              "What could improve this screen?",
            ].map((text) => (
              <button
                key={text}
                onClick={() => onSend(text)}
                disabled={busy || !configured}
              >
                {text}
                <ArrowUpRight size={13} />
              </button>
            ))}
          </div>
        </div>
        {messages.map((m) => (
          <article
            className={`chat-message ${m.role} ${m.error ? "chat-error" : ""}`}
            key={m.id}
          >
            <span className="message-author">
              {m.role === "user" ? "YOU" : "FORM & INTENT"}
            </span>
            <p>{m.text}</p>
            {m.options?.map((option, i) => (
              <button
                className="proposal-card"
                key={i}
                onClick={() => onPreview(option)}
                aria-label={`Preview ${option.label}`}
              >
                <span>0{i + 1} / DESIGN PROPOSAL</span>
                <strong>{option.label}</strong>
                <small>
                  Preview design <ArrowUpRight size={13} />
                </small>
              </button>
            ))}
            {m.error && m.retry && (
              <button
                className="text-link"
                disabled={busy}
                onClick={() => onSend(m.retry)}
              >
                Retry message
              </button>
            )}
          </article>
        ))}
        {busy && (
          <div className="chat-progress" role="status">
            <span className="tiny-dot" />
            Working with your screen and system rules…
          </div>
        )}
      </div>
      <form
        className="chat-composer"
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
      >
        {context && (
          <div className="context-chip">
            Selected: {context}
            <button
              type="button"
              onClick={onClearContext}
              aria-label="Clear selected context"
            >
              ×
            </button>
          </div>
        )}
        <label className="sr-only" htmlFor="brief">
          Message the companion
        </label>
        <textarea
          id="brief"
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          placeholder="Ask, explore, or refine…"
          maxLength={2000}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              if (!busy) onSend();
            }
          }}
        />
        <div className="composer-bottom">
          <span>
            {configured
              ? "Gemini · system-guided"
              : "AI backend not configured"}
          </span>
          {busy ? (
            <button
              type="button"
              className="send-button"
              aria-label="Cancel generation"
              onClick={onCancel}
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              type="submit"
              className="send-button"
              aria-label="Send message"
              disabled={!configured || !draft.trim()}
            >
              <ArrowUp size={18} />
            </button>
          )}
        </div>
      </form>
      <div className="chat-utilities">
        <a className="mobile-chat-preview" href="#composition">
          View design ↓
        </a>
        <button onClick={onExamples}>Saved examples</button>
        <button onClick={onImport}>Use your own AI tool</button>
      </div>
    </aside>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  Copy,
  Layers,
  LoaderCircle,
  MoveUpRight,
  RotateCcw,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";
import { examples } from "./system/examples";
import {
  validateComposition,
  type Composition,
  type Locale,
} from "./system/contract";
import { CATALOG_VERSION } from "./system/catalog";
import { Button } from "./components/Button";
import { Preview } from "./components/Preview";
import { Inspector } from "./components/Inspector";
import { sendChat, type ChatReply } from "./ai/chat";
import { ChatPanel, type Message } from "./components/ChatPanel";
import { createPrompt } from "./ai/prompt";

function readExample(index: number) {
  const result = validateComposition(examples[index].composition);
  if (!result.success) throw new Error(result.error);
  return result.data;
}
type Snapshot = {
  composition: Composition;
  exampleId: string;
  brief: string;
  source: "saved" | "live" | "imported";
};
const initial: Snapshot = {
  composition: readExample(0),
  exampleId: examples[0].id,
  brief: examples[0].brief,
  source: "saved",
};

export default function App() {
  const [snapshot, setSnapshot] = useState<Snapshot>(initial);
  const [messages, setMessages] = useState<Message[]>([]);
  const [proposal, setProposal] = useState<ChatReply["options"][number]>();
  const [revisions, setRevisions] = useState<Snapshot[]>([initial]);
  const [useSelection, setUseSelection] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const examplesDialog = useRef<HTMLDialogElement>(null);
  const messageId = useRef(0);
  const [previous, setPrevious] = useState<Snapshot>();
  const [brief, setBrief] = useState("");
  const [locale, setLocale] = useState<Locale>("en");
  const [width, setWidth] = useState(390);
  const [selectedId, setSelectedId] = useState("delivery");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [copied, setCopied] = useState(false);
  const [revision, setRevision] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const notesDialog = useRef<HTMLDialogElement>(null);
  const importDialog = useRef<HTMLDialogElement>(null);
  const endpoint = import.meta.env.VITE_AI_ENDPOINT as string | undefined;
  const composition = proposal?.composition ?? snapshot.composition;

  useEffect(() => () => controller.current?.abort(), []);

  function stop() {
    requestId.current += 1;
    controller.current?.abort();
    setBusy(false);
  }
  function accept(next: Snapshot, preserveDraft = false) {
    stop();
    setPrevious(snapshot);
    setSnapshot(next);
    setProposal(undefined);
    setRevisions((items) => [...items, next]);
    if (!preserveDraft) setBrief("");
    setSelectedId(
      next.composition.blocks.find((block) => block.type === "DeliveryDetails")!
        .id,
    );
    setFeedback("");
    setRevision((value) => value + 1);
  }
  function undo() {
    if (!previous) return;
    stop();
    setSnapshot(previous);
    setBrief("");
    setProposal(undefined);
    setPrevious(undefined);
    setSelectedId(
      previous.composition.blocks.find(
        (block) => block.type === "DeliveryDetails",
      )!.id,
    );
    setFeedback("Previous composition restored.");
    setRevision((value) => value + 1);
  }
  function addMessage(message: Omit<Message, "id">) {
    setMessages((items) => [...items, { ...message, id: ++messageId.current }]);
  }
  async function generate(text = brief) {
    if (!endpoint || busy || !text.trim()) return;
    const sent = text.trim();
    const history = messages
      .filter((m) => !m.error)
      .slice(-12)
      .map((m) => ({ role: m.role, text: m.text }));
    stop();
    const id = requestId.current;
    const abort = new AbortController();
    controller.current = abort;
    addMessage({ role: "user", text: sent });
    if (text === brief) setBrief("");
    setBusy(true);
    setFeedback("");
    const timeout = window.setTimeout(() => abort.abort("timeout"), 30_000);
    try {
      const reply = await sendChat(
        endpoint,
        sent,
        composition,
        history,
        useSelection && composition.blocks.some((b) => b.id === selectedId)
          ? selectedId
          : undefined,
        abort.signal,
      );
      if (id !== requestId.current) return;
      addMessage({
        role: "assistant",
        text: reply.message,
        options: reply.options,
      });
    } catch (error) {
      if (id !== requestId.current) return;
      addMessage({
        role: "assistant",
        error: true,
        retry: sent,
        text: abort.signal.aborted
          ? "The response timed out. Your design is safe. Try a smaller change."
          : error instanceof Error
            ? error.message
            : "The request failed. Your design is safe.",
      });
    } finally {
      window.clearTimeout(timeout);
      if (id === requestId.current) setBusy(false);
    }
  }
  function exportComposition() {
    const blob = new Blob([JSON.stringify(composition, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "form-and-intent-composition.json";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback("Composition exported as JSON.");
  }
  function importComposition() {
    try {
      if (importText.length > 32_000)
        throw new Error("The composition is too large.");
      const parsed = validateComposition(JSON.parse(importText));
      if (!parsed.success) throw new Error(parsed.error);
      accept({
        composition: parsed.data,
        exampleId: "",
        brief,
        source: "imported",
      });
      setImportError("");
      importDialog.current?.close();
      setFeedback(
        "Imported composition validated. Its AI source and language quality are unverified.",
      );
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "Paste a valid JSON composition.",
      );
    }
  }
  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(createPrompt(brief, composition));
      setCopied(true);
    } catch {
      setImportError(
        "Clipboard unavailable. Select and copy the prompt below.",
      );
    }
  }

  return (
    <div className="app-shell">
      <a href="#brief" className="skip-link">
        Skip to your brief
      </a>
      <header className="app-header">
        <a className="brand" href="./" aria-label="Form and Intent home">
          <span className="brand-symbol" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>
            form <em>&</em> intent<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="header-center">
          <span className="nav-active">Workbench</span>
          <button
            type="button"
            onClick={() => notesDialog.current?.showModal()}
          >
            System notes <ArrowUpRight size={13} />
          </button>
        </div>
        <span className="signature">
          A SMALL EXPERIMENT BY <strong>JOSEPH DIBEH</strong>
        </span>
      </header>
      <main>
        <h1 className="sr-only">Design companion workbench</h1>
        <div
          className={`workbench conversation-workbench ${showInspector ? "with-inspector" : ""}`}
        >
          <ChatPanel
            messages={messages}
            draft={brief}
            onDraft={setBrief}
            onSend={generate}
            busy={busy}
            configured={!!endpoint}
            context={
              useSelection
                ? composition.blocks.find((b) => b.id === selectedId)?.type
                : undefined
            }
            onClearContext={() => setUseSelection(false)}
            onCancel={() => {
              stop();
              addMessage({
                role: "assistant",
                text: "Generation cancelled. Your layout is preserved.",
              });
            }}
            onPreview={(option) => {
              stop();
              setProposal(option);
              if (!option.composition.blocks.some((b) => b.id === selectedId))
                setUseSelection(false);
              setRevision((v) => v + 1);
            }}
            onImport={() => {
              setCopied(false);
              setImportError("");
              importDialog.current?.showModal();
            }}
            onExamples={() => examplesDialog.current?.showModal()}
          />
          <section
            id="composition"
            className="canvas-panel"
            aria-label="Composition workspace"
          >
            <div className="canvas-toolbar">
              <div>
                <span className="eyebrow">02 / THE FORM</span>
                <strong>
                  {examples.find((example) => example.id === snapshot.exampleId)
                    ?.name ?? "Your composition"}
                </strong>
              </div>
              <div className="toolbar-actions">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Inspect system"
                  title="Inspect system"
                  onClick={() => setShowInspector((v) => !v)}
                >
                  <Layers size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Undo"
                  title="Undo"
                  disabled={!previous}
                  onClick={undo}
                >
                  <Undo2 size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Reset"
                  title="Reset"
                  onClick={() => accept(initial)}
                >
                  <RotateCcw size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Export composition"
                  title="Export JSON"
                  onClick={exportComposition}
                >
                  <ArrowDownToLine size={16} />
                </Button>
              </div>
            </div>
            {proposal && (
              <div className="proposal-banner">
                <div>
                  <strong>{proposal.label}</strong>
                  <span>Draft proposal · not accepted</span>
                </div>
                <Button
                  variant="primary"
                  onClick={() => {
                    accept(
                      {
                        composition: proposal.composition,
                        exampleId: "",
                        brief: "",
                        source: "live",
                      },
                      true,
                    );
                    addMessage({
                      role: "assistant",
                      text: `Accepted “${proposal.label}”. You can refine it or restore an earlier revision.`,
                    });
                  }}
                >
                  Accept design
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    stop();
                    setProposal(undefined);
                    setRevision((v) => v + 1);
                  }}
                >
                  Dismiss
                </Button>
              </div>
            )}
            <div className="preview-controls">
              <div className="segmented" aria-label="Preview language">
                <button
                  type="button"
                  aria-label="English preview"
                  aria-pressed={locale === "en"}
                  onClick={() => setLocale("en")}
                >
                  EN
                </button>
                <button
                  type="button"
                  lang="ar"
                  aria-label="Arabic preview"
                  aria-pressed={locale === "ar"}
                  onClick={() => setLocale("ar")}
                >
                  عربي
                </button>
              </div>
              <div className="width-controls">
                <span className="annotation">WIDTH</span>
                {[320, 390].map((size) => (
                  <button
                    type="button"
                    key={size}
                    aria-label={`${size} pixel preview`}
                    aria-pressed={width === size}
                    onClick={() => setWidth(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div className="preview-stage">
              <Preview
                key={revision}
                composition={composition}
                locale={locale}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  setUseSelection(true);
                  setShowInspector(true);
                }}
                width={width}
              />
            </div>
            <details className="revision-history">
              <summary>Revision history · {revisions.length}</summary>
              <div>
                {revisions.map((item, i) => (
                  <button
                    key={i}
                    aria-label={`Restore revision ${i}`}
                    onClick={() => {
                      accept(item, true);
                      addMessage({
                        role: "assistant",
                        text: `Restored revision ${i}.`,
                      });
                    }}
                  >
                    Revision {i} ·{" "}
                    {item.source === "saved"
                      ? "Saved example"
                      : item.source === "live"
                        ? "Accepted design"
                        : "Imported design"}
                  </button>
                ))}
              </div>
            </details>
            <div className="canvas-caption">
              <span className="caption-line" />
              <span>Composition is flexible. The system is intentional.</span>
              <span className="caption-line" />
            </div>
            <div className="canvas-status">
              <span>
                <span className="tiny-dot" />
                {proposal
                  ? "Previewing a proposal"
                  : snapshot.source === "saved"
                    ? "Saved example · not a live AI result"
                    : snapshot.source === "live"
                      ? "Live AI composition · validated contract"
                      : "Imported composition · source unverified"}
              </span>
              <span>v{CATALOG_VERSION}</span>
            </div>
          </section>
          {showInspector && (
            <Inspector
              composition={composition}
              selectedId={selectedId}
              onClose={() => setShowInspector(false)}
            />
          )}
        </div>
        <div className="workspace-feedback" role="status">
          {feedback}
        </div>
        {composition.unsupported.length > 0 && (
          <div className="unsupported">
            <strong>Outside this system</strong>
            <ul>
              {composition.unsupported.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </main>
      <footer className="app-footer">
        <span>DESIGNED WITH INTENT. BUILT TO BE QUESTIONED.</span>
        <span>
          Independent prototype <span className="footer-slash">/</span>{" "}
          Synthetic content <span className="footer-slash">/</span> Arabic copy
          awaiting human review
        </span>
      </footer>
      <dialog
        ref={examplesDialog}
        className="notes-dialog"
        aria-label="Saved examples"
      >
        <div className="dialog-heading">
          <h2>Start from an example</h2>
          <Button
            aria-label="Close examples"
            onClick={() => examplesDialog.current?.close()}
          >
            Close
          </Button>
        </div>
        <div className="example-list">
          {examples.map((example, index) => (
            <button
              className="example-card"
              key={example.id}
              onClick={() => {
                accept({
                  composition: readExample(index),
                  exampleId: example.id,
                  brief: example.brief,
                  source: "saved",
                });
                examplesDialog.current?.close();
                addMessage({
                  role: "assistant",
                  text: `Loaded the ${example.short} saved example. What would you like to explore?`,
                });
              }}
            >
              <strong>{example.short}</strong>
              <small>{example.description}</small>
            </button>
          ))}
        </div>
      </dialog>
      <dialog
        ref={notesDialog}
        className="notes-dialog"
        aria-labelledby="system-notes-title"
      >
        <div className="dialog-heading">
          <span className="eyebrow">THE SYSTEM / v{CATALOG_VERSION}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close system notes"
            onClick={() => notesDialog.current?.close()}
          >
            <X size={19} />
          </Button>
        </div>
        <h2 id="system-notes-title">
          Small by choice.
          <br />
          Structured by design.
        </h2>
        <p>
          Form & Intent explores how an AI can compose useful interfaces from a
          system with clear boundaries.
        </p>
        <div className="notes-grid">
          <article>
            <span>01</span>
            <h3>The model proposes.</h3>
            <p>
              A brief becomes a structured composition: approved patterns,
              permitted variants, bilingual copy, and explicit rationale.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>The system constrains.</h3>
            <p>
              Code validates the composition. Components own their styling and
              semantic tokens. Arbitrary HTML and CSS never enter the renderer.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>The designer decides.</h3>
            <p>
              Inspect the rules, refine the intent, and undo a change.
              Unsupported requests remain visible instead of becoming invented
              capabilities.
            </p>
          </article>
        </div>
        <div className="notes-boundary">
          <CheckCheck size={20} />
          <p>
            Contract validation checks structure and allowed properties. It does
            not prove usability, translation quality, or WCAG conformance. This
            is a synthetic demonstration system, not Careem’s design system.
          </p>
        </div>
        <p className="annotation">
          Saved examples work locally. Live AI requires a separately configured
          endpoint. The frontend contains no model credentials.
        </p>
      </dialog>
      <dialog
        ref={importDialog}
        className="notes-dialog"
        aria-labelledby="import-title"
      >
        <div className="dialog-heading">
          <span className="eyebrow">BRING YOUR OWN RESPONSE</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close AI import"
            onClick={() => importDialog.current?.close()}
          >
            <X size={19} />
          </Button>
        </div>
        <h2 id="import-title">
          Your AI tool.
          <br />
          Our system rules.
        </h2>
        <p>
          Copy the brief and component contract into an AI tool you already use.
          Paste its JSON response here to validate and preview it. This manual
          workflow requires no API key.
        </p>
        <Button onClick={copyPrompt}>
          <Copy size={15} />
          {copied ? "Prompt copied" : "Copy system prompt + brief"}
        </Button>
        <details className="prompt-details">
          <summary>Read or manually copy the prompt</summary>
          <textarea
            readOnly
            aria-label="System prompt"
            value={createPrompt(brief, composition)}
          />
        </details>
        <label htmlFor="import-json">Paste the JSON response</label>
        <textarea
          id="import-json"
          className="import-textarea"
          value={importText}
          maxLength={32000}
          onChange={(event) => setImportText(event.target.value)}
          placeholder={'{ "catalogVersion": "1.0.0", … }'}
        />
        <p className="field-error" role="alert">
          {importError}
        </p>
        <Button
          variant="primary"
          disabled={!importText.trim()}
          onClick={importComposition}
        >
          Validate & preview <ArrowRight size={16} />
        </Button>
        <p className="annotation">
          Imported content is validated as data. Its source and language quality
          are not verified.
        </p>
      </dialog>
    </div>
  );
}

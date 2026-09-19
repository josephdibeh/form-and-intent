import { prepareScreenshot } from "./image";
import type { ScreenImage, LayoutArtifact } from "./contract";
import { starters } from "./starters";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  Columns3,
  Type,
  MessagesSquare,
  Plus,
  Square,
  Copy,
  Download,
  Check,
  History,
  X,
  ChevronRight,
  PanelLeft,
} from "lucide-react";
import { SystemCatalog } from "./SystemCatalog";
import { ArtifactView } from "./ArtifactView";
import { sendCompanion } from "./client";
import type { Artifact, CompanionRequest, Selection, Tool } from "./contract";
import {
  applyCopy,
  artifactText,
  emptySession,
  startSession,
  saveSession,
  type Session,
  type Message,
} from "./session";
import "./workspace.css";
const tools = [
  {
    id: "layout" as const,
    label: "Brainstorm layouts",
    short: "Layouts",
    icon: Columns3,
    heading: "Give your idea a little room.",
    description:
      "Explore two ways to organize a screen, with the reasoning behind each.",
    sample:
      "Design a home-cleaning service selection screen for busy parents. Help them compare a one-off clean with a weekly plan. Show duration, price and what is included. Explore two different information hierarchies.",
    hint: "Describe the screen, who it is for, and what matters most…",
  },
  {
    id: "copy" as const,
    label: "Write UI copy",
    short: "UI copy",
    icon: Type,
    heading: "Find the words that move it forward.",
    description:
      "Get three useful alternatives for a moment in your interface.",
    sample:
      "Write a payment error message for a service booking. The card was declined and no money was taken. Use calm, clear language, explain what happened, and offer a next step. Keep each option under 130 characters.",
    hint: "Describe the element, the situation, and the tone…",
  },
  {
    id: "feedback" as const,
    label: "Summarize feedback",
    short: "Feedback",
    icon: MessagesSquare,
    heading: "Turn what you heard into what comes next.",
    description:
      "Find themes in your notes, trace them to evidence, and decide what to improve.",
    sample:
      "Synthetic usability notes:\nP1: I only noticed the delivery fee at the last step.\nP2: I kept going back to check when the order would arrive.\nP3: The promo code box made me wonder whether I should search for a discount.\nP4: I could not tell whether the displayed price included delivery.\nP5: The final button was easy to find, but I wanted to check the address first.",
    hint: "Paste public or synthetic usability notes…",
  },
];
function id() {
  return crypto.randomUUID();
}
export default function CompanionApp() {
  const [session, setSession] = useState<Session>(startSession);
  const [screenshot, setScreenshot] = useState<ScreenImage | undefined>();
  const [imageLoading, setImageLoading] = useState(false);
  const imageSequence = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const nearBottom = useRef(true);
  const [unread, setUnread] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const [expandedImage, setExpandedImage] = useState<ScreenImage | null>(null);
  const imageDialog = useRef<HTMLDialogElement>(null);
  const [translation, setTranslation] = useState<{
    key: string;
    layout: LayoutArtifact;
  } | null>(null);
  const [translating, setTranslating] = useState(false);
  const translationAbort = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState(true);
  const [mobile, setMobile] = useState<"chat" | "result">("chat");
  const [locale, setLocale] = useState<"en" | "ar">("en");
  const [showAccepted, setShowAccepted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const abort = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const log = useRef<HTMLDivElement>(null);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const endpoint = import.meta.env.VITE_AI_ENDPOINT as string | undefined;
  const active = tools.find((t) => t.id === session.tool)!;
  const visualContext =
    session.tool === "feedback" &&
    (!!screenshot || session.messages.some((m) => m.image));
  const composerLabel = visualContext ? "Review a screen" : active.label;
  const composerHint = visualContext
    ? "Ask about this screen…"
    : session.tool === "feedback"
      ? "Paste feedback notes or add a screen…"
      : active.hint;
  useEffect(() => {
    const field = composer.current;
    if (!field) return;
    field.style.height = "auto";
    const minimum = parseFloat(getComputedStyle(field).lineHeight) * 3;
    field.style.height = `${Math.min(200, Math.max(minimum || 63, field.scrollHeight))}px`;
  }, [session.draft, session.tool]);
  useEffect(() => {
    if (expandedImage && !imageDialog.current?.open)
      imageDialog.current?.showModal();
  }, [expandedImage]);
  const result = showAccepted ? session.accepted : session.result;
  const resultKey = JSON.stringify(result);
  const translated =
    locale === "ar" && translation?.key === resultKey
      ? translation.layout
      : undefined;
  useEffect(() => {
    setLocale("en");
    translationAbort.current?.abort();
    setTranslating(false);
  }, [resultKey]);
  useEffect(() => () => translationAbort.current?.abort(), []);
  async function translateLayout() {
    if (locale === "ar") {
      setLocale("en");
      return;
    }
    if (translation?.key === resultKey) {
      setLocale("ar");
      return;
    }
    if (!endpoint || result?.kind !== "layout" || busy || translating) return;
    const controller = new AbortController();
    translationAbort.current = controller;
    setTranslating(true);
    setNotice("");
    try {
      const reply = await sendCompanion(
        endpoint,
        {
          tool: "layout",
          operation: "translate",
          brief:
            "Translate this layout into Arabic without changing structure or facts.",
          current: result,
          history: [],
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      if (reply.artifact?.kind !== "layout")
        throw new Error("The translation was not returned. Please retry.");
      setTranslation({ key: resultKey, layout: reply.artifact });
      setLocale("ar");
    } catch (error) {
      if (!controller.signal.aborted)
        setNotice(
          error instanceof Error
            ? error.message
            : "Translation failed. Please retry.",
        );
    } finally {
      if (translationAbort.current === controller) setTranslating(false);
    }
  }
  async function attachScreen(file?: File) {
    if (!file) return;
    const ticket = ++imageSequence.current;
    setImageLoading(true);
    setNotice("");
    try {
      const image = await prepareScreenshot(file);
      if (ticket === imageSequence.current) {
        setScreenshot(image);
        setSession((s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.error ? { ...m, retry: undefined } : m,
          ),
        }));
      }
    } catch (error) {
      if (ticket === imageSequence.current)
        setNotice(
          error instanceof Error ? error.message : "Cannot read this image.",
        );
    } finally {
      if (ticket === imageSequence.current) setImageLoading(false);
    }
  }
  const isAccepted =
    !!result &&
    JSON.stringify(result) === JSON.stringify(session.accepted) &&
    (showAccepted ||
      result.kind !== "layout" ||
      session.selectedDirection === session.acceptedDirection);
  const hasProposal =
    !!session.accepted &&
    (JSON.stringify(session.result) !== JSON.stringify(session.accepted) ||
      (session.result?.kind === "layout" &&
        session.selectedDirection !== session.acceptedDirection));
  useEffect(() => {
    setSaved(saveSession(session));
  }, [session]);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    if (nearBottom.current) {
      log.current?.scrollTo?.({
        top: log.current.scrollHeight,
        behavior: "smooth",
      });
      setUnread(false);
    } else if (session.messages.at(-1)?.role === "assistant") setUnread(true);
  }, [session.messages, busy]);
  useEffect(() => {
    if (!busy) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const timer = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - start) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [busy]);
  function stop() {
    sequence.current++;
    abort.current?.abort();
    setBusy(false);
  }
  function patch(values: Partial<Session>) {
    setSession((s) => ({ ...s, ...values }));
  }
  function switchTool(tool: Tool) {
    if (busy || session.messages.length > 0) return;
    patch({ tool });
    imageSequence.current++;
    setImageLoading(false);
    setScreenshot(undefined);
    setMobile("chat");
    setNotice("");
  }
  function addMessage(message: Omit<Message, "id">) {
    setSession((s) => ({
      ...s,
      messages: [...s.messages, { ...message, id: id() }].slice(-40),
    }));
  }
  async function generate(retry?: Message["retry"]) {
    const brief = (
      retry?.brief ??
      (session.draft ||
        (screenshot
          ? "Audit this screen. Identify visible usability issues and concrete improvements."
          : ""))
    ).trim();
    if (!endpoint || busy || imageLoading || !brief) return;
    const tool = retry?.tool ?? session.tool;
    const attachedImage =
      tool === "feedback"
        ? (retry?.image ??
          screenshot ??
          [...session.messages].reverse().find((m) => m.image)?.image)
        : undefined;
    const sourceNotes =
      tool === "feedback"
        ? (retry?.sourceNotes ?? (session.sourceNotes || brief))
        : undefined;
    const current =
      tool === "copy" && session.selection ? session.layout : result;
    const input: CompanionRequest = {
      tool,
      brief,
      history: session.messages
        .filter((m) => !m.error)
        .slice(-12)
        .map((m) => ({ role: m.role, text: m.text.slice(0, 4000) })),
      ...(current ? { current } : {}),
      ...(current?.kind === "layout"
        ? {
            selectedDirection: showAccepted
              ? session.acceptedDirection
              : session.selectedDirection,
          }
        : {}),
      ...(current?.kind === "copy"
        ? {
            selectedCopy: showAccepted
              ? session.acceptedCopy
              : session.selectedCopy,
          }
        : {}),
      ...(tool === "copy" && session.selection
        ? { selection: session.selection }
        : {}),
      ...(sourceNotes ? { sourceNotes } : {}),
      ...(attachedImage ? { image: attachedImage } : {}),
    };
    nearBottom.current = true;
    setUnread(false);
    stop();
    const requestId = sequence.current;
    const controller = new AbortController();
    abort.current = controller;
    const timer = window.setTimeout(() => controller.abort(), 55_000);
    setBusy(true);
    setNotice("");
    setShowAccepted(false);
    setScreenshot(undefined);
    setSession((s) => ({
      ...s,
      tool,
      draft: retry ? s.draft : "",
      sourceNotes: sourceNotes ?? s.sourceNotes,
      messages: [
        ...s.messages,
        {
          id: id(),
          role: "user",
          text: brief,
          tool,
          ...(retry?.image || screenshot
            ? { image: retry?.image ?? screenshot }
            : {}),
        } as Message,
      ].slice(-40),
    }));
    try {
      const reply = await sendCompanion(endpoint, input, controller.signal);
      if (sequence.current !== requestId) return;
      setSession((s) => ({
        ...s,
        result: reply.artifact ?? s.result,
        selectedCopy: reply.artifact ? undefined : s.selectedCopy,
        copyBase:
          reply.artifact?.kind === "copy" && current?.kind === "layout"
            ? current
            : s.copyBase,
        selectedDirection:
          reply.artifact?.kind === "layout" ? undefined : s.selectedDirection,
        selection: reply.artifact?.kind === "layout" ? undefined : s.selection,
        messages: [
          ...s.messages,
          {
            id: id(),
            role: "assistant",
            tool,
            text: reply.message,
            ...(reply.artifact ? { artifact: reply.artifact } : {}),
            ...(reply.artifact?.kind === "copy" && current?.kind === "layout"
              ? { layoutContext: current }
              : {}),
          } as Message,
        ].slice(-40),
      }));
      if (reply.artifact)
        setNotice("New proposal ready. Review it before accepting.");
    } catch (error) {
      if (sequence.current !== requestId) return;
      addMessage({
        role: "assistant",
        tool,
        error: true,
        retry: { brief, tool, sourceNotes, image: attachedImage },
        text: controller.signal.aborted
          ? "The request timed out. Your work is saved; retry when you are ready."
          : error instanceof Error
            ? error.message
            : "The request failed. Your work is preserved.",
      });
    } finally {
      window.clearTimeout(timer);
      if (sequence.current === requestId) setBusy(false);
    }
  }
  function record(
    artifact: Artifact,
    label: string,
    nextLayout = session.layout,
    direction = session.selectedDirection,
    copyIndex?: number,
  ) {
    setSession((s) => ({
      ...s,
      accepted: artifact,
      result: artifact,
      layout: nextLayout,
      selectedDirection: direction,
      acceptedDirection: direction,
      selectedCopy: copyIndex,
      acceptedCopy: copyIndex,
      selection: undefined,
      revisions: [
        ...s.revisions,
        { id: id(), label, artifact, layout: nextLayout, direction, copyIndex },
      ].slice(-12),
    }));
    setShowAccepted(false);
    setNotice(`${label} accepted. You can restore earlier revisions.`);
  }
  function accept() {
    if (!result || busy) return;
    record(
      result,
      result.kind === "layout"
        ? (result.options.find((o) => o.id === session.selectedDirection)
            ?.title ?? result.title)
        : result.title,
      result.kind === "layout" ? result : session.layout,
    );
  }
  function chooseCopy(index: number) {
    if (result?.kind !== "copy" || busy) return;
    const choice = result.alternatives[index];
    if (result.target) {
      if (
        !session.layout ||
        !session.copyBase ||
        JSON.stringify(session.layout) !== JSON.stringify(session.copyBase)
      ) {
        setNotice(
          "This copy was written for an earlier layout. Select the current component and generate fresh alternatives.",
        );
        return;
      }
      try {
        const next = applyCopy(session.layout, result.target, choice.text);
        record(next, "Copy update", next, result.target.directionId);
        addMessage({
          role: "assistant",
          tool: "copy",
          text: `Applied “${choice.text}” to the selected ${result.target.field}. Other content is unchanged.`,
        });
      } catch (e) {
        setNotice(e instanceof Error ? e.message : "Unable to apply copy.");
      }
    } else {
      record(
        result,
        `Copy option ${index + 1}: ${choice.tone}`,
        session.layout,
        session.selectedDirection,
        index,
      );
      setNotice(`Selected copy: ${choice.text}`);
    }
  }
  function select(selection: Selection) {
    if (result?.kind !== "layout" || busy) return;
    patch({
      layout: result,
      selection,
    });
    setNotice(
      "Component selected. Choose “Write its copy” to refine this field.",
    );
  }
  async function copyResult() {
    if (!result) return;
    try {
      const index = showAccepted ? session.acceptedCopy : session.selectedCopy;
      await navigator.clipboard.writeText(
        result.kind === "copy" && index !== undefined
          ? result.alternatives[index].text
          : artifactText(translated ?? result),
      );
      setNotice("Result copied as text.");
    } catch {
      setNotice(
        "Clipboard unavailable. Use Download JSON to keep your result.",
      );
    }
  }
  function download() {
    if (!result) return;
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              artifact: translated ?? result,
              selectedDirection: showAccepted
                ? session.acceptedDirection
                : session.selectedDirection,
              selectedCopy: showAccepted
                ? session.acceptedCopy
                : session.selectedCopy,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `form-and-intent-${result.kind}.json`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Result downloaded.");
  }
  const selectedSection = session.layout?.options
    .find((o) => o.id === session.selection?.directionId)
    ?.sections.find((s) => s.id === session.selection?.sectionId);
  return (
    <div className="companion-shell">
      <a className="skip-link" href="#companion-brief">
        Skip to message
      </a>
      <div className="companion-mobile-nav" aria-label="Workspace view">
        <button
          aria-pressed={mobile === "chat"}
          onClick={() => setMobile("chat")}
        >
          <PanelLeft size={16} />
          Conversation
        </button>
        <button
          aria-pressed={mobile === "result"}
          onClick={() => setMobile("result")}
        >
          Result {session.result && <span className="result-dot" />}
        </button>
      </div>
      <aside
        className={`companion-chat ${mobile === "chat" ? "is-mobile-active" : ""}`}
        aria-label="Design conversation"
      >
        <div className="companion-brand-row">
          <span className="companion-wordmark">
            form <i>&</i> intent<span>.</span>
          </span>
          <button
            className="companion-icon"
            aria-label="New conversation"
            title="New conversation"
            disabled={busy}
            onClick={() => resetDialog.current?.showModal()}
          >
            <Plus size={20} />
          </button>
        </div>
        <SystemCatalog />
        {session.messages.length > 0 ? (
          <div className="companion-task-label" aria-label="Conversation task">
            <active.icon size={16} />
            {active.short}
          </div>
        ) : (
          <div className="companion-tool-tabs" aria-label="Design tools">
            {tools.map((t) => (
              <button
                key={t.id}
                aria-label={t.label}
                aria-pressed={session.tool === t.id}
                onClick={() => switchTool(t.id)}
                disabled={busy}
              >
                <t.icon size={19} />
                <span>{t.short}</span>
              </button>
            ))}
          </div>
        )}
        <div
          className="companion-log"
          onScroll={(event) => {
            const element = event.currentTarget;
            nearBottom.current =
              element.scrollHeight - element.scrollTop - element.clientHeight <
              64;
            if (nearBottom.current) setUnread(false);
          }}
          ref={log}
          role="log"
          aria-label="Conversation"
          aria-live="polite"
        >
          {session.messages.length === 0 ? (
            <div className="companion-intro">
              <span className="companion-kicker">
                A LITTLE STRUCTURE. MORE POSSIBILITY.
              </span>
              <h1>
                Your thinking partner,
                <br />
                <em>from here to what if.</em>
              </h1>
              <p>
                Explore a layout. Find the right words. Make sense of what
                people told you.
              </p>
              <p>
                Choose a tool above, then bring a brief or use a sample to get
                started.
              </p>
              <div
                className="companion-starters"
                aria-label="Suggested messages"
              >
                <span className="companion-kicker">Synthetic examples</span>
                {starters
                  .filter((item) => item.tool === session.tool)
                  .map((item) => (
                    <button
                      type="button"
                      key={item.label}
                      onClick={() => {
                        patch({
                          draft: item.prompt,
                          ...(session.tool === "feedback"
                            ? { sourceNotes: "" }
                            : {}),
                        });
                        document.getElementById("companion-brief")?.focus();
                      }}
                    >
                      <span>{item.label}</span>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            session.messages.map((m) => (
              <article
                className={`companion-message ${m.role} ${m.error ? "is-error" : ""}`}
                key={m.id}
              >
                <div className="companion-message-meta">
                  <span>{m.role === "user" ? "YOU" : "FORM & INTENT"}</span>
                  <span>{tools.find((t) => t.id === m.tool)?.short}</span>
                </div>
                {m.image && (
                  <button
                    className="companion-image-open"
                    type="button"
                    aria-label="Enlarge attached screen"
                    onClick={() => setExpandedImage(m.image!)}
                  >
                    <img
                      className="companion-message-image"
                      src={`data:${m.image.mimeType};base64,${m.image.data}`}
                      alt="Attached screen"
                    />
                  </button>
                )}
                <p>{m.text}</p>
                {m.artifact && (
                  <button
                    className="companion-result-link"
                    disabled={busy}
                    onClick={() => {
                      patch({
                        result: m.artifact,
                        copyBase: m.layoutContext,
                        selectedCopy:
                          JSON.stringify(m.artifact) ===
                          JSON.stringify(session.accepted)
                            ? session.acceptedCopy
                            : undefined,
                        selection: undefined,
                        selectedDirection:
                          m.artifact?.kind === "layout"
                            ? JSON.stringify(m.artifact) ===
                              JSON.stringify(session.accepted)
                              ? session.acceptedDirection
                              : undefined
                            : session.selectedDirection,
                      });
                      setShowAccepted(false);
                      setMobile("result");
                    }}
                  >
                    <span>{m.artifact.title}</span>
                    <ArrowUpRight size={16} />
                  </button>
                )}
                {m.error && m.retry && (
                  <button
                    className="companion-text-button"
                    disabled={busy}
                    onClick={() => generate(m.retry)}
                  >
                    Retry message
                  </button>
                )}
              </article>
            ))
          )}
          {busy && (
            <div className="companion-progress" role="status">
              <span className="tiny-dot" />
              Waiting for Gemini · {elapsed}s
              <span>Your result will appear here.</span>
            </div>
          )}
        </div>
        {unread && (
          <button
            className="companion-unread"
            onClick={() => {
              nearBottom.current = true;
              setUnread(false);
              log.current?.scrollTo?.({
                top: log.current.scrollHeight,
                behavior: "smooth",
              });
            }}
          >
            New response ↓
          </button>
        )}
        <form
          className={`companion-composer ${dragging ? "is-dragging" : ""}`}
          onDragEnter={(event) => {
            if (
              session.tool !== "feedback" ||
              busy ||
              imageLoading ||
              !event.dataTransfer.types.includes("Files")
            )
              return;
            event.preventDefault();
            dragDepth.current++;
            setDragging(true);
          }}
          onDragOver={(event) => {
            if (
              session.tool === "feedback" &&
              event.dataTransfer.types.includes("Files")
            ) {
              event.preventDefault();
              event.dataTransfer.dropEffect =
                busy || imageLoading ? "none" : "copy";
            }
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            dragDepth.current = Math.max(0, dragDepth.current - 1);
            if (!dragDepth.current) setDragging(false);
          }}
          onDrop={(event) => {
            if (session.tool !== "feedback") return;
            event.preventDefault();
            dragDepth.current = 0;
            setDragging(false);
            if (busy || imageLoading) return;
            if (event.dataTransfer.files.length !== 1) {
              setNotice("Add one screen at a time.");
              return;
            }
            void attachScreen(event.dataTransfer.files[0]);
          }}
          onPaste={(event) => {
            if (session.tool !== "feedback" || busy || imageLoading) return;
            const files = Array.from(event.clipboardData.items).filter(
              (item) => item.kind === "file",
            );
            if (!files.length) return;
            event.preventDefault();
            if (files.length !== 1) {
              setNotice("Add one screen at a time.");
              return;
            }
            void attachScreen(files[0].getAsFile() ?? undefined);
          }}
          onSubmit={(e) => {
            e.preventDefault();
            void generate();
          }}
        >
          {session.selection && selectedSection && (
            <div className="companion-context">
              Editing {selectedSection.component} · {session.selection.field}
              <button
                type="button"
                aria-label="Clear selected component"
                disabled={busy}
                onClick={() => patch({ selection: undefined })}
              >
                <X size={14} />
              </button>
              <select
                aria-label="Copy field"
                disabled={busy}
                value={session.selection.field}
                onChange={(e) =>
                  patch({
                    selection: {
                      ...session.selection!,
                      field: e.target.value as "title" | "body",
                    },
                  })
                }
              >
                <option value="title">Title</option>
                <option value="body">Body</option>
              </select>
            </div>
          )}
          {session.tool === "feedback" && screenshot && (
            <div className="companion-image-preview">
              <img
                src={`data:${screenshot.mimeType};base64,${screenshot.data}`}
                alt="Screen ready to attach"
              />
              <button
                type="button"
                aria-label="Remove screenshot"
                disabled={busy}
                onClick={() => {
                  imageSequence.current++;
                  setScreenshot(undefined);
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}
          {session.tool === "feedback" &&
            !screenshot &&
            !session.messages.some((m) => m.image) &&
            session.sourceNotes && (
              <div className="companion-context">
                Using supplied notes
                <button
                  type="button"
                  className="companion-text-button"
                  disabled={busy}
                  onClick={() => patch({ sourceNotes: "" })}
                >
                  Replace notes
                </button>
              </div>
            )}
          <div className="companion-composer-label">
            <label htmlFor="companion-brief">
              {dragging ? "Drop your screen here" : composerLabel}
            </label>
          </div>
          <textarea
            ref={composer}
            rows={3}
            id="companion-brief"
            aria-label="Message the companion"
            value={session.draft}
            onChange={(e) => patch({ draft: e.target.value })}
            placeholder={composerHint}
            maxLength={12000}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing &&
                session.tool !== "feedback"
              ) {
                e.preventDefault();
                if (!busy) void generate();
              }
            }}
          />
          <div className="companion-composer-actions">
            <span>
              {endpoint
                ? "Gemini · free-tier prototype"
                : "AI endpoint not configured"}
            </span>
            <div className="companion-send-controls">
              {session.tool === "feedback" && (
                <>
                  <input
                    ref={fileInput}
                    hidden
                    type="file"
                    aria-label="Upload screenshot"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={busy || imageLoading}
                    onChange={(event) => {
                      void attachScreen(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    className="companion-attach"
                    aria-label={
                      imageLoading
                        ? "Preparing screenshot"
                        : "Attach screenshot"
                    }
                    title="Add image"
                    disabled={busy || imageLoading}
                    onClick={() => fileInput.current?.click()}
                  >
                    <Plus size={22} strokeWidth={1.75} />
                  </button>
                </>
              )}
              {busy ? (
                <button
                  className="companion-send"
                  type="button"
                  aria-label="Cancel generation"
                  onClick={() => {
                    stop();
                    addMessage({
                      role: "assistant",
                      tool: session.tool,
                      text: "Request cancelled. Your previous work is preserved.",
                    });
                  }}
                >
                  <Square size={15} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="companion-send"
                  aria-label="Send message"
                  disabled={
                    !endpoint ||
                    imageLoading ||
                    (!session.draft.trim() && !screenshot)
                  }
                >
                  <ArrowUp size={20} />
                </button>
              )}
            </div>
          </div>
        </form>
        <div className="companion-privacy">
          Public or dummy data only · prompts sent to Gemini.
          <br />
          {saved
            ? "New conversation on reload · download results to keep them"
            : "Browser storage unavailable — download your work."}
        </div>
      </aside>
      <main
        className={`companion-workspace ${mobile === "result" ? "is-mobile-active" : ""}`}
      >
        <header className="companion-toolbar">
          <div>
            <strong>
              {result ? result.title : "A place for possibilities"}
            </strong>
          </div>
          <div className="companion-toolbar-actions">
            {result && (
              <>
                {hasProposal && (
                  <button
                    disabled={busy}
                    onClick={() => {
                      setShowAccepted((v) => !v);
                      patch({ selection: undefined });
                    }}
                  >
                    {showAccepted ? "Show proposal" : "Compare accepted"}
                  </button>
                )}
                {result.kind === "layout" && (
                  <button
                    aria-pressed={locale === "ar"}
                    disabled={busy || translating || !endpoint}
                    onClick={translateLayout}
                  >
                    {translating
                      ? "Translating…"
                      : locale === "ar"
                        ? "English"
                        : "العربية"}
                  </button>
                )}
                {result.kind === "feedback" && !showAccepted && !isAccepted && (
                  <button
                    className="companion-primary"
                    disabled={busy}
                    onClick={accept}
                  >
                    <Check size={15} />
                    Accept review
                  </button>
                )}
              </>
            )}
            {result && (
              <>
                <button
                  className="companion-icon"
                  title="Copy result as text"
                  aria-label="Copy result as text"
                  onClick={copyResult}
                >
                  <Copy size={17} />
                </button>
                <button
                  className="companion-icon"
                  title="Download JSON"
                  aria-label="Download JSON"
                  onClick={download}
                >
                  <Download size={17} />
                </button>
              </>
            )}
            <details className="companion-history">
              <summary aria-label="Revision history">
                <History size={17} />
                <span>{session.revisions.length}</span>
              </summary>
              <div>
                <strong>Accepted revisions</strong>
                {session.revisions.length === 0 ? (
                  <p>Accept a result to start a history.</p>
                ) : (
                  session.revisions.map((r, i) => (
                    <button
                      key={r.id}
                      disabled={busy}
                      onClick={() => {
                        patch({
                          result: r.artifact,
                          accepted: r.artifact,
                          layout: r.layout,
                          selectedDirection: r.direction,
                          acceptedDirection: r.direction,
                          selectedCopy: r.copyIndex,
                          acceptedCopy: r.copyIndex,
                          copyBase: r.layout,
                          selection: undefined,
                        });
                        setShowAccepted(false);
                        setNotice(`Restored revision ${i + 1}.`);
                      }}
                    >
                      {" "}
                      {i + 1}. {r.label}
                    </button>
                  ))
                )}
              </div>
            </details>
          </div>
        </header>
        {result ? (
          <>
            <div className="companion-result-scroll">
              <ArtifactView
                artifact={translated ?? result}
                selectedDirection={
                  showAccepted
                    ? session.acceptedDirection
                    : session.selectedDirection
                }
                selectedCopy={
                  showAccepted ? session.acceptedCopy : session.selectedCopy
                }
                selection={session.selection ?? null}
                onClearSelection={() => patch({ selection: undefined })}
                onDirection={
                  busy
                    ? undefined
                    : (value) => {
                        if (result.kind === "layout")
                          record(
                            result,
                            result.options.find((o) => o.id === value)!.title,
                            result,
                            value,
                          );
                      }
                }
                onSelect={busy ? undefined : select}
                onChooseCopy={busy ? undefined : chooseCopy}
                locale={translated ? "ar" : "en"}
              />
            </div>
            <div className="companion-next-step">
              <span>
                Next with this{" "}
                {result.kind === "layout" ? "design" : result.kind}
              </span>
              {(result.kind === "layout"
                ? [
                    {
                      label: "Refine hierarchy",
                      tool: "layout" as Tool,
                      prompt:
                        "Refine the selected direction: strengthen information hierarchy and keep every supplied fact unchanged.",
                    },
                    {
                      label: "Write its copy",
                      tool: "copy" as Tool,
                      prompt:
                        "Improve the copy for this design. Keep the intent and all supplied facts. Give three concise alternatives.",
                    },
                  ]
                : result.kind === "copy"
                  ? [
                      {
                        label: "Make it shorter",
                        tool: "copy" as Tool,
                        prompt:
                          "Shorten the selected copy without changing its meaning or losing essential information.",
                      },
                      {
                        label: "Adjust tone",
                        tool: "copy" as Tool,
                        prompt:
                          "Adapt the selected copy to a warmer, clearer tone. Preserve all facts and the intended action.",
                      },
                    ]
                  : [
                      {
                        label: "Explore a fix",
                        tool: "layout" as Tool,
                        prompt:
                          "Use the findings in this feedback to propose a layout improvement. Identify the finding addressed and separate evidence from assumptions.",
                      },
                    ]
              ).map((action) => (
                <button
                  key={action.label}
                  disabled={
                    busy ||
                    (result.kind === "layout" &&
                      !(showAccepted
                        ? session.acceptedDirection
                        : session.selectedDirection))
                  }
                  onClick={() => {
                    if (action.tool !== session.tool) {
                      setSession({
                        ...emptySession(),
                        tool: action.tool,
                        result,
                        layout:
                          result.kind === "layout" ? result : session.layout,
                        selectedDirection: showAccepted
                          ? session.acceptedDirection
                          : session.selectedDirection,
                        selectedCopy: showAccepted
                          ? session.acceptedCopy
                          : session.selectedCopy,
                        revisions: session.revisions,
                        messages: [
                          {
                            id: id(),
                            role: "assistant",
                            tool: action.tool,
                            text: `New ${action.tool === "copy" ? "UI copy" : "layout"} conversation, using “${result.title}” as context.`,
                            artifact: translated ?? result,
                          },
                        ],
                      });
                      setShowAccepted(false);
                      setNotice(
                        "New conversation started with the selected result as context.",
                      );
                    }
                    if (action.tool === "copy" && result.kind === "layout") {
                      const direction = result.options.find(
                        (o) =>
                          o.id ===
                          (showAccepted
                            ? session.acceptedDirection
                            : session.selectedDirection),
                      );
                      const heading = direction?.sections.find(
                        (s) => s.component === "Heading",
                      );
                      patch({
                        draft: session.selection
                          ? action.prompt
                          : "Write three stronger headings for the selected design. Preserve the intent and all supplied facts.",
                        layout: result,
                        selection:
                          session.selection ??
                          (direction && heading
                            ? {
                                directionId: direction.id,
                                sectionId: heading.id,
                                field: "title",
                              }
                            : undefined),
                      });
                    } else patch({ draft: action.prompt });
                    setMobile("chat");
                    document.getElementById("companion-brief")?.focus();
                  }}
                >
                  {action.label}
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="companion-empty">
            <div className="companion-empty-content">
              <div className="companion-line-art" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <span className="companion-kicker">
                {active.label.toUpperCase()}
              </span>
              <h2>{active.heading}</h2>
              <p>{active.description}</p>
              <p className="companion-scope">
                {session.tool === "layout"
                  ? "Visual previews: service selection and booking review. Other screen types receive a written concept."
                  : session.tool === "copy"
                    ? "Use it on its own, or select a component in a layout to write in context."
                    : "Every quoted excerpt must match the notes you provide. Recommendations remain design judgments."}
              </p>
            </div>
            <span className="companion-signature">
              AN EXPERIMENT BY JOSEPH DIBEH
            </span>
          </div>
        )}
        <div className="companion-notice" role="status">
          {notice}
        </div>
      </main>
      <dialog
        ref={imageDialog}
        className="companion-image-dialog"
        aria-label="Attached screen preview"
        onClose={() => setExpandedImage(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget)
            imageDialog.current?.close();
        }}
      >
        <button
          type="button"
          aria-label="Close image preview"
          onClick={() => imageDialog.current?.close()}
        >
          <X size={20} />
        </button>
        {expandedImage && (
          <img
            src={`data:${expandedImage.mimeType};base64,${expandedImage.data}`}
            alt="Enlarged attached screen"
          />
        )}
      </dialog>
      <dialog
        ref={resetDialog}
        className="companion-reset"
        aria-labelledby="reset-title"
      >
        <h2 id="reset-title">Start a new conversation?</h2>
        <p>
          This clears the conversation and saved revisions in this browser.
          Download any results you want to keep first.
        </p>
        <div>
          <button onClick={() => resetDialog.current?.close()}>
            Keep working
          </button>
          <button
            className="companion-primary"
            onClick={() => {
              stop();
              nearBottom.current = true;
              setUnread(false);
              setSession(emptySession());
              imageSequence.current++;
              setScreenshot(undefined);
              setImageLoading(false);
              setMobile("chat");
              setShowAccepted(false);
              setNotice("New conversation started.");
              resetDialog.current?.close();
            }}
          >
            Start new
          </button>
        </div>
      </dialog>
    </div>
  );
}

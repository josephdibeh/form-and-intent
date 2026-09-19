import { TeamSection } from "./TeamSection";
import { teamSystem, primitiveMappings } from "./team-system";
import { useEffect, useId, useState } from "react";
import type { Artifact } from "./contract";
import { componentCatalog, storyUrl, tokenDetails } from "./catalog";
import "./artifacts.css";

type Layout = Extract<Artifact, { kind: "layout" }>;
export type LayoutOption = Layout["options"][number];
export type PreviewSectionData = LayoutOption["sections"][number];
export type ArtifactSelection = {
  directionId: string;
  sectionId: string;
  field: "title" | "body";
};
export interface ArtifactViewProps {
  artifact: Artifact;
  selectedDirection?: string;
  selectedCopy?: number;
  selection?: ArtifactSelection | null;
  onClearSelection?: () => void;
  onDirection?: (id: string) => void;
  onSelect?: (selection: ArtifactSelection) => void;
  onChooseCopy?: (index: number) => void;
  locale?: "en" | "ar";
}

export const PreviewSection = TeamSection;

export function LayoutPreview({
  option,
  selectedSection,
  onInspect,
  locale = "en",
}: {
  option: LayoutOption;
  selectedSection?: string;
  onInspect?: (section: PreviewSectionData) => void;
  locale?: "en" | "ar";
}) {
  const hasSummary = option.sections.some(
    (section) => section.component === "Summary",
  );
  const ordered =
    option.arrangement === "summary-first"
      ? [
          ...option.sections.filter((s) => s.component === "Heading"),
          ...option.sections.filter((s) => s.component === "Summary"),
          ...option.sections.filter(
            (s) => s.component !== "Summary" && s.component !== "Heading",
          ),
        ]
      : option.sections;
  const renderSection = (section: PreviewSectionData) => (
    <PreviewSection
      key={section.id}
      rtl={locale === "ar"}
      section={section}
      selected={selectedSection === section.id}
      onInspect={() => onInspect?.(section)}
    />
  );
  return (
    <div
      className="av-preview-frame team-preview"
      dir={locale === "ar" ? "rtl" : "ltr"}
      lang={locale}
    >
      <div className="av-preview-top">
        <span>
          {locale === "ar"
            ? option.family === "service-selection"
              ? "اختر خدمة"
              : "راجع حجزك"
            : option.family === "service-selection"
              ? "Discover a service"
              : "Review your booking"}
        </span>
        <span className="team-brand-mark">
          {locale === "ar"
            ? "نموذج تجريبي مستوحى من كريم"
            : "Careem-inspired · demo"}
        </span>
      </div>
      <div
        className={`av-preview av-arrangement-${option.arrangement} ${option.arrangement === "split" && !hasSummary ? "av-split-comparison" : ""}`}
      >
        {option.arrangement === "split" ? (
          <>
            {ordered
              .filter((section) => section.component === "Heading")
              .map(renderSection)}
            <div className="av-split-main">
              {ordered
                .filter(
                  (section) =>
                    !["Heading", "Summary", "Action"].includes(
                      section.component,
                    ),
                )
                .map(renderSection)}
            </div>
            {hasSummary && (
              <div className="av-split-summary">
                {ordered
                  .filter((section) => section.component === "Summary")
                  .map(renderSection)}
              </div>
            )}
            {ordered
              .filter((section) => section.component === "Action")
              .map(renderSection)}
          </>
        ) : (
          ordered.map(renderSection)
        )}
      </div>
    </div>
  );
}

export function ArtifactView({
  artifact,
  selectedDirection,
  selectedCopy,
  selection: controlledSelection,
  onClearSelection,
  onDirection,
  onSelect,
  onChooseCopy,
  locale = "en",
}: ArtifactViewProps) {
  const [comparing, setComparing] = useState(false);
  useEffect(
    () => setComparing(false),
    [artifact, selectedDirection, selectedCopy],
  );
  const focused =
    !comparing &&
    (artifact.kind === "layout"
      ? !!selectedDirection
      : artifact.kind === "copy" && selectedCopy !== undefined);
  const [localSelection, setSelection] = useState<ArtifactSelection | null>(
    null,
  );
  const selection =
    controlledSelection === undefined
      ? localSelection
      : !onSelect && localSelection
        ? localSelection
        : controlledSelection;
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [detailsOpen, setDetailsOpen] = useState(!!controlledSelection);
  useEffect(() => {
    if (controlledSelection) setDetailsOpen(true);
  }, [controlledSelection?.directionId, controlledSelection?.sectionId]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetailsOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const id = useId();
  const inspect = (
    directionId: string,
    sectionId: string,
    field: "title" | "body" = "title",
  ) => {
    const next = { directionId, sectionId, field };
    setSelection(next);
    setDetailsOpen(true);
    onSelect?.(next);
  };
  const inspected =
    artifact.kind === "layout"
      ? artifact.options
          .find((o) => o.id === selection?.directionId)
          ?.sections.find((s) => s.id === selection?.sectionId)
      : undefined;
  return (
    <div
      className={`av-root ${artifact.kind === "feedback" ? "av-feedback" : ""}`}
    >
      <div className="av-canvas-controls">
        {artifact.kind === "layout" && (
          <>
            <div
              role="group"
              aria-label="Preview size"
              className="av-viewport-controls"
            >
              <button
                aria-pressed={viewport === "desktop"}
                onClick={() => setViewport("desktop")}
              >
                Desktop
              </button>
              <button
                aria-pressed={viewport === "mobile"}
                onClick={() => setViewport("mobile")}
              >
                Mobile
              </button>
            </div>
            <button
              className="av-outline-button"
              aria-expanded={detailsOpen}
              aria-controls={`${id}-details`}
              onClick={() => setDetailsOpen((v) => !v)}
            >
              Design details
            </button>
          </>
        )}
        {((selectedDirection && artifact.kind === "layout") ||
          (selectedCopy !== undefined && artifact.kind === "copy")) && (
          <button
            className="av-outline-button av-change"
            onClick={() => setComparing((v) => !v)}
          >
            {comparing
              ? "Back to selection"
              : artifact.kind === "layout"
                ? "Change direction"
                : "Change copy"}
          </button>
        )}
      </div>
      {artifact.kind === "layout" && (
        <>
          <div
            className={`av-layout-workspace ${detailsOpen ? "av-details-open" : ""}`}
          >
            <div className="av-design-canvas" data-viewport={viewport}>
              <div className={`av-directions ${focused ? "av-focused" : ""}`}>
                {artifact.options.map(
                  (option, index) =>
                    (!focused || option.id === selectedDirection) && (
                      <article
                        key={option.id}
                        className={`av-direction ${selectedDirection === option.id ? "av-direction-selected" : ""}`}
                      >
                        {!focused && (
                          <header>
                            <span className="av-kicker">
                              Direction {String(index + 1).padStart(2, "0")} ·{" "}
                              {option.arrangement.replaceAll("-", " ")}
                            </span>
                            <h3>{option.title}</h3>
                          </header>
                        )}
                        <LayoutPreview
                          option={option}
                          selectedSection={
                            selection?.directionId === option.id
                              ? selection.sectionId
                              : undefined
                          }
                          locale={locale}
                          onInspect={(section) =>
                            inspect(option.id, section.id)
                          }
                        />
                        {onDirection && !focused && (
                          <button
                            type="button"
                            className="av-outline-button"
                            aria-pressed={selectedDirection === option.id}
                            onClick={() => {
                              setComparing(false);
                              onDirection(option.id);
                            }}
                          >
                            {selectedDirection === option.id
                              ? "Selected direction"
                              : `Choose direction ${index + 1}`}
                          </button>
                        )}
                      </article>
                    ),
                )}
              </div>
            </div>
            {detailsOpen && (
              <aside
                id={`${id}-details`}
                className="av-details-panel"
                aria-label="Design details"
              >
                <header className="av-details-heading">
                  <strong>Design details</strong>
                  <button
                    className="av-text-button"
                    onClick={() => setDetailsOpen(false)}
                  >
                    Close panel
                  </button>
                </header>
                <section>
                  <h3>Recommendation</h3>
                  <p>{artifact.recommendation}</p>
                </section>
                <section>
                  <h3>Working assumptions</h3>
                  {artifact.assumptions.length ? (
                    <ul>
                      {artifact.assumptions.map((text, i) => (
                        <li key={i}>{text}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No assumptions listed.</p>
                  )}
                </section>
                {artifact.options
                  .filter((o) => !focused || o.id === selectedDirection)
                  .map((option) => (
                    <section key={option.id}>
                      <h3>{option.title}</h3>
                      <p>{option.rationale}</p>
                      <p>
                        <strong>Tradeoff:</strong> {option.tradeoff}
                      </p>
                    </section>
                  ))}
                <p className="av-hint">
                  Inspect a preview component to see its tokens and Storybook
                  reference.
                  {locale === "ar"
                    ? " Arabic translation · right-to-left layout."
                    : ""}
                </p>
                {inspected && selection && (
                  <section
                    className="av-system-details"
                    aria-label="Component details"
                  >
                    <header>
                      <span className="av-kicker">
                        {teamSystem.name} · {teamSystem.foundation}
                      </span>
                      <button
                        type="button"
                        className="av-text-button"
                        onClick={() => {
                          setSelection(null);
                          onClearSelection?.();
                        }}
                      >
                        Close details
                      </button>
                    </header>
                    <h3>{inspected.component}</h3>
                    <p>{componentCatalog[inspected.component].usage}</p>
                    <div className="av-field-buttons">
                      <button
                        type="button"
                        aria-pressed={selection.field === "title"}
                        onClick={() =>
                          inspect(
                            selection.directionId,
                            selection.sectionId,
                            "title",
                          )
                        }
                      >
                        Select title copy
                      </button>
                      <button
                        type="button"
                        aria-pressed={selection.field === "body"}
                        onClick={() =>
                          inspect(
                            selection.directionId,
                            selection.sectionId,
                            "body",
                          )
                        }
                      >
                        Select body copy
                      </button>
                    </div>
                    <dl className="av-token-list">
                      {tokenDetails(inspected.component).map((token) => (
                        <div key={token.role}>
                          <dt>
                            {token.role}
                            <code>{token.css}</code>
                          </dt>
                          <dd>{token.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <p>
                      Base Web:{" "}
                      {primitiveMappings[inspected.component].primitives}
                    </p>
                    <a
                      href={primitiveMappings[inspected.component].docs}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Base Web documentation ↗
                    </a>
                    <a
                      href={storyUrl(inspected.component)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open {inspected.component} in Storybook
                    </a>
                  </section>
                )}
              </aside>
            )}
          </div>
        </>
      )}
      {artifact.kind === "copy" && (
        <>
          <p className="av-context">{artifact.context}</p>
          <ol className="av-copy-list">
            {artifact.alternatives.map(
              (option, index) =>
                (!focused || index === selectedCopy) && (
                  <li key={index}>
                    <span className="av-kicker">
                      Option {String(index + 1).padStart(2, "0")} ·{" "}
                      {option.tone}
                    </span>
                    <p className="av-copy-text">{option.text}</p>
                    <p className="av-muted">{option.rationale}</p>
                    <button
                      type="button"
                      className="av-outline-button"
                      onClick={() => {
                        setComparing(false);
                        onChooseCopy?.(index);
                      }}
                      disabled={!onChooseCopy}
                      aria-pressed={selectedCopy === index}
                    >
                      {selectedCopy === index
                        ? "Selected copy"
                        : `Choose option ${index + 1}`}
                    </button>
                  </li>
                ),
            )}
          </ol>
        </>
      )}
      {artifact.kind === "feedback" && (
        <>
          <p className="av-context">
            {artifact.evidenceType === "visual"
              ? "Visual audit of the supplied screenshot. Findings are design judgments, not observed user behavior."
              : "A synthesis of the supplied notes. Interpretations and proposed changes are judgments to test."}
          </p>
          <div className="av-themes">
            {artifact.themes.map((theme, index) => (
              <article key={theme.id} id={`${id}-${theme.id}`}>
                <span className="av-kicker">
                  Theme {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{theme.title}</h3>
                <span className="av-evidence-label">
                  {artifact.evidenceType === "visual"
                    ? "Visible observation"
                    : "Summary of notes"}
                </span>
                {theme.location && (
                  <p className="av-location">Location: {theme.location}</p>
                )}
                <p>{theme.observation}</p>
                {theme.quotes.map((quote, i) => (
                  <blockquote key={i}>{quote}</blockquote>
                ))}
                <span className="av-evidence-label">Interpretation</span>
                <p>{theme.interpretation}</p>
              </article>
            ))}
          </div>
          <section className="av-improvements">
            <h3>Prioritized improvements</h3>
            <ol>
              {artifact.improvements.map((item, index) => (
                <li key={index}>
                  <span className="av-kicker">{item.priority} priority</span>
                  <h4>{item.title}</h4>
                  <p>{item.reason}</p>
                  <div className="av-evidence-links">
                    Evidence:{" "}
                    {item.themeIds.map((themeId) => (
                      <a key={themeId} href={`#${id}-${themeId}`}>
                        {artifact.themes.find((t) => t.id === themeId)?.title ||
                          themeId}
                      </a>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section className="av-limitations">
            <h3>What this evidence cannot tell us</h3>
            <ul>
              {artifact.limitations.map((text, i) => (
                <li key={i}>{text}</li>
              ))}
            </ul>
          </section>
          <details className="av-source-notes">
            <summary>Read supplied notes</summary>
            <p>{artifact.sourceNotes}</p>
          </details>
        </>
      )}
    </div>
  );
}

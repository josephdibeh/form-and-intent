import { useRef, useState } from "react";
import { componentCatalog, storyUrl, type ComponentName } from "./catalog";
import { PreviewSection } from "./ArtifactView";
import { teamSystem, primitiveMappings } from "./team-system";
import "./catalog.css";

// Only real, renderer-backed systems belong in this registry.
export const designSystems = [
  { ...teamSystem, components: componentCatalog },
] as const;
export function SystemCatalog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<"components" | "tokens">("components");
  const system = designSystems[0];
  return (
    <>
      <button
        className="system-launch"
        aria-label={`Design system ${system.name} v${system.version}`}
        onClick={() => dialog.current?.showModal()}
      >
        <span>Design system</span>
        <strong>
          {system.name} <small>v{system.version}</small>
        </strong>
        <span aria-hidden="true">↗</span>
      </button>
      <dialog
        className="system-dialog"
        ref={dialog}
        aria-labelledby="system-title"
      >
        <header>
          <div>
            <span className="av-kicker">The source of your designs</span>
            <h2 id="system-title">Design system catalog</h2>
          </div>
          <button
            aria-label="Close catalog"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </header>
        <div className="system-controls">
          <label>
            Active system{" "}
            <select
              value={system.id}
              aria-label="Active design system"
              onChange={() => {}}
            >
              {designSystems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · v{s.version}
                </option>
              ))}
            </select>
          </label>
          <p>
            Example team library · Base Web foundation. Separate from the
            companion interface.
          </p>
        </div>
        <nav aria-label="Catalog sections">
          <button
            aria-pressed={tab === "components"}
            onClick={() => setTab("components")}
          >
            Components · {Object.keys(system.components).length}
          </button>
          <button
            aria-pressed={tab === "tokens"}
            onClick={() => setTab("tokens")}
          >
            Tokens · {Object.keys(system.tokens.semantic).length}
          </button>
        </nav>
        <div className="system-grid">
          {tab === "components"
            ? (Object.keys(system.components) as ComponentName[]).map(
                (name) => (
                  <article key={name}>
                    <div className="system-specimen av-root">
                      <PreviewSection
                        section={{
                          id: name,
                          component: name,
                          title:
                            name === "Action"
                              ? "Continue"
                              : name === "Choices"
                                ? "Choose your service"
                                : name === "Summary"
                                  ? "Booking details"
                                  : name === "Heading"
                                    ? "A little help at home"
                                    : "Make an informed choice",
                          body:
                            name === "Action"
                              ? ""
                              : "Clear information, at the moment you need it.",
                          items:
                            name === "Choices"
                              ? [
                                  {
                                    label: "One-off cleaning",
                                    detail: "QAR 160 · 3 hours",
                                  },
                                  {
                                    label: "Weekly cleaning",
                                    detail: "QAR 120 · 2 hours",
                                  },
                                ]
                              : name === "Summary"
                                ? [
                                    {
                                      label: "Service",
                                      detail: "Home cleaning",
                                    },
                                    { label: "Total", detail: "QAR 160" },
                                  ]
                                : [],
                          emphasis: false,
                        }}
                      />
                    </div>
                    <h3>{name}</h3>
                    <p>{system.components[name].usage}</p>
                    <p>Base Web: {primitiveMappings[name].primitives}</p>
                    <a
                      href={primitiveMappings[name].docs}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Source component ↗
                    </a>
                    <div className="system-tags">
                      {system.components[name].tokens.map((t) => (
                        <code key={t}>{t}</code>
                      ))}
                    </div>
                    <a href={storyUrl(name)} target="_blank" rel="noreferrer">
                      Open Storybook ↗
                    </a>
                  </article>
                ),
              )
            : Object.entries(system.tokens.semantic).map(([name, ref]) => {
                const value =
                  system.tokens.reference[
                    ref as keyof typeof system.tokens.reference
                  ];
                return (
                  <article key={name}>
                    <div className="token-specimen">
                      {value.startsWith("#") ? (
                        <span
                          className="token-color"
                          style={{ background: value }}
                        />
                      ) : name.startsWith("space.") ? (
                        <span
                          className="token-space"
                          style={{ width: value }}
                        />
                      ) : name.startsWith("radius.") ? (
                        <span
                          className="token-radius"
                          style={{ borderRadius: value }}
                        />
                      ) : (
                        <span style={{ fontFamily: value }}>Aa · 0123</span>
                      )}
                    </div>
                    <h3>{name}</h3>
                    <code>{value}</code>
                    <p>Reference: {ref}</p>
                  </article>
                );
              })}
        </div>
        <footer>
          {teamSystem.description}{" "}
          <a href={teamSystem.sources.color} target="_blank" rel="noreferrer">
            Careem colors
          </a>{" "}
          ·{" "}
          <a
            href={teamSystem.sources.typography}
            target="_blank"
            rel="noreferrer"
          >
            Typography
          </a>{" "}
          ·{" "}
          <a href={teamSystem.sources.code} target="_blank" rel="noreferrer">
            Base Web source
          </a>
          . Semantic mappings, spacing and radii are demo decisions. Sample
          content is synthetic.
        </footer>
      </dialog>
    </>
  );
}

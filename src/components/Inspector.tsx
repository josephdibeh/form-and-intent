import { Check, ArrowUpRight, Layers, Info } from "lucide-react";
import { catalog, rules, tokensForBlock } from "../system/catalog";
import { resolveToken, type Composition } from "../system/contract";

export function Inspector({
  composition,
  selectedId,
  onClose,
}: {
  composition: Composition;
  selectedId: string;
  onClose?: () => void;
}) {
  const block =
    composition.blocks.find((item) => item.id === selectedId) ??
    composition.blocks[0];
  const definition = catalog[block.type];
  const tokenRoles = tokensForBlock(block);
  const decisions = composition.decisions.filter(
    (decision) => decision.blockId === block.id,
  );
  const storyBase = import.meta.env.VITE_STORYBOOK_URL as string | undefined;
  const storyNames = {
    ScreenHeader: "screen-header",
    DeliveryDetails:
      block.variant === "emphasis" ? "delivery-emphasis" : "delivery-details",
    OrderItems: block.variant === "compact" ? "compact-items" : "order-items",
    PromoCode: "promo-code",
    PriceSummary: "price-summary",
    PrimaryAction: "primary-action",
  };
  const storyUrl =
    storyBase && /^https?:\/\//.test(storyBase)
      ? `${storyBase.replace(/\/$/, "")}/?path=/story/design-system-patterns--${storyNames[block.type]}`
      : undefined;
  return (
    <aside className="inspector" aria-label="System inspector">
      <div className="panel-heading">
        <span className="eyebrow">UNDER THE SURFACE</span>
        <button
          className="text-link"
          onClick={onClose}
          aria-label="Close inspector"
        >
          Close
        </button>
      </div>
      <h2>System inspector</h2>
      <p className="inspector-intro">
        Select a component in the preview to see what holds it together.
      </p>
      <div className="component-heading">
        <span className="mini-cross">+</span>
        <span className="eyebrow">SELECTED COMPONENT</span>
      </div>
      <h3>{definition.name}</h3>
      <code className="component-id">
        {block.type} <span>/ {block.variant}</span>
      </code>
      <p className="component-description">{definition.description}</p>
      <div className="inspector-section">
        <h4>
          Semantic tokens <span>{tokenRoles.length}</span>
        </h4>
        {tokenRoles.map((role) => {
          const token = resolveToken(role);
          return (
            <div className="token-row" key={role}>
              <span
                className="token-swatch"
                style={
                  token.value.startsWith("#")
                    ? { background: token.value }
                    : undefined
                }
              >
                {!token.value.startsWith("#") && "↔"}
              </span>
              <div>
                <code>{role}</code>
                <small>{token.reference}</small>
              </div>
              <ArrowUpRight size={12} aria-hidden="true" />
            </div>
          );
        })}
      </div>
      <div className="inspector-section">
        <h4>Usage rule</h4>
        <code className="rule-id">{definition.rule}</code>
        <p className="rule-copy">{rules[definition.rule]}</p>
      </div>
      <div className="decision-note">
        <span className="eyebrow">COMPOSITION NOTE</span>
        <p>
          {decisions[0]?.explanation ??
            "This component follows its catalog rule. No additional composition rationale was supplied."}
        </p>
        <span className="annotation">Explanation, not a verified check.</span>
      </div>
      <details className="component-reference">
        <summary>Component reference</summary>
        <p>Implemented React component · catalog v1.0.0</p>
        <p>Variants: {definition.variants.join(", ")}</p>
        <pre>{JSON.stringify(block, null, 2)}</pre>
        {storyUrl && (
          <a
            className="text-link"
            href={storyUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open in Storybook <ArrowUpRight size={13} />
          </a>
        )}
        <p>Editable Figma export is not connected yet.</p>
      </details>
      <div className="checks">
        <h4>Contract checks</h4>
        {[
          "Approved component IDs",
          "Valid variants & properties",
          "Required screen structure",
        ].map((check) => (
          <div key={check}>
            <Check size={14} />
            <span>{check}</span>
          </div>
        ))}
        <p>
          <Info size={12} /> These checks do not certify accessibility.
        </p>
      </div>
    </aside>
  );
}

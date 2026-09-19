import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  MapPin,
  Scan,
  ShoppingBag,
  UtensilsCrossed,
  GlassWater,
} from "lucide-react";
import type { Block, Composition, Locale } from "../system/contract";
import { calculateTotal } from "../system/contract";
import { Button } from "./Button";

export function Preview({
  composition,
  locale,
  selectedId,
  onSelect,
  width,
}: {
  composition: Composition;
  locale: Locale;
  selectedId: string;
  onSelect: (id: string) => void;
  width: number;
}) {
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState(false);
  const [promoError, setPromoError] = useState(false);
  const [expanded, setExpanded] = useState(() =>
    composition.blocks.some(
      (block) =>
        block.type === "DeliveryDetails" && block.variant === "emphasis",
    ),
  );
  const [ordered, setOrdered] = useState(false);
  const arabic = locale === "ar";
  const text = (en: string, ar: string) => (arabic ? ar : en);
  const money = (amount: number) =>
    arabic
      ? new Intl.NumberFormat("ar-QA", {
          style: "currency",
          currency: "QAR",
        }).format(amount / 100)
      : `QAR ${(amount / 100).toFixed(2)}`;
  const totals = calculateTotal(composition, applied);

  function renderBlock(block: Block) {
    switch (block.type) {
      case "ScreenHeader":
        return (
          <>
            <div className="food-brand">
              <span className="food-mark">
                <UtensilsCrossed size={17} />
              </span>
              <span>
                good noon<span className="brand-period">.</span>
              </span>
              <ShoppingBag size={18} className="bag-icon" />
            </div>
            <div className="eyebrow food-eyebrow">{block.eyebrow[locale]}</div>
            <h2>{composition.title[locale]}</h2>
            <p className="food-subtitle">{block.subtitle[locale]}</p>
          </>
        );
      case "DeliveryDetails":
        return (
          <div
            className={`delivery-card ${block.variant === "emphasis" ? "delivery-emphasis" : ""}`}
          >
            <div className="delivery-top">
              <MapPin size={17} />
              <div>
                <span className="micro-label">
                  {text("DELIVERING TO", "التوصيل إلى")}
                </span>
                <strong>{block.address[locale]}</strong>
              </div>
              <span className="eta">{block.eta[locale]}</span>
            </div>
            <button
              type="button"
              className="instructions-toggle"
              aria-expanded={expanded}
              onClick={() => setExpanded(!expanded)}
            >
              {text("Delivery instructions", "تعليمات التوصيل")}
              <ChevronDown size={14} />
            </button>
            {expanded && (
              <p className="instructions-copy">{block.instructions[locale]}</p>
            )}
          </div>
        );
      case "OrderItems":
        return (
          <div
            className={`order-items ${block.variant === "compact" ? "items-compact" : ""}`}
          >
            <div className="section-caption">
              <span>{text("A GOOD CHOICE", "اختيار موفق")}</span>
              <span>
                {block.items.length} {text("ITEMS", "أصناف")}
              </span>
            </div>
            {block.items.map((item, index) => (
              <div className="food-item" key={index}>
                <div
                  className={`food-illustration illustration-${index % 2}`}
                  aria-hidden="true"
                >
                  {index % 2 === 0 ? (
                    <UtensilsCrossed size={24} strokeWidth={1.3} />
                  ) : (
                    <GlassWater size={24} strokeWidth={1.3} />
                  )}
                </div>
                <div className="food-item-copy">
                  <strong>{item.name[locale]}</strong>
                  <p>{item.detail[locale]}</p>
                  <div className="item-meta">
                    <span className="quantity">
                      {text("Qty", "الكمية")} {item.quantity}
                    </span>
                    <bdi>{money(item.unitPrice * item.quantity)}</bdi>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case "PromoCode":
        return (
          <form
            className="promo"
            onSubmit={(event) => {
              event.preventDefault();
              const valid = promo.trim().toUpperCase() === "STUDIO10";
              setPromoError(!valid);
              if (valid) setApplied(true);
            }}
          >
            <label htmlFor="promo-code">
              {text("Promo code", "رمز الخصم")}
            </label>
            <div className="promo-field">
              <input
                id="promo-code"
                value={promo}
                onChange={(event) => {
                  setPromo(event.target.value);
                  setPromoError(false);
                }}
                placeholder={text("Try STUDIO10", "جرّب STUDIO10")}
                disabled={applied}
                aria-invalid={promoError}
                aria-describedby="promo-hint"
              />
              <Button type="submit" size="small" disabled={applied}>
                {applied ? <Check size={15} /> : text("Apply", "تطبيق")}
              </Button>
            </div>
            <p
              id="promo-hint"
              className={promoError ? "field-error" : "field-hint"}
            >
              {promoError
                ? text(
                    "Use STUDIO10 to try the demo discount.",
                    "استخدم STUDIO10 لتجربة الخصم.",
                  )
                : applied
                  ? text(
                      "10% demo discount applied.",
                      "تم تطبيق خصم تجريبي بنسبة ١٠٪.",
                    )
                  : text(
                      "A little something off. Demo codes only.",
                      "خصم بسيط. رموز تجريبية فقط.",
                    )}
            </p>
          </form>
        );
      case "PriceSummary":
        return (
          <div className="price-summary">
            <div>
              <span>{text("Subtotal", "المجموع الفرعي")}</span>
              <bdi>{money(totals.subtotal)}</bdi>
            </div>
            <div>
              <span>{text("Delivery", "التوصيل")}</span>
              <bdi>{money(totals.delivery)}</bdi>
            </div>
            {totals.discount > 0 && (
              <div className="discount">
                <span>{text("Demo discount", "خصم تجريبي")}</span>
                <bdi>−{money(totals.discount)}</bdi>
              </div>
            )}
            <div className="total">
              <strong>{text("Total", "الإجمالي")}</strong>
              <strong>
                <bdi>{money(totals.total)}</bdi>
              </strong>
            </div>
          </div>
        );
      case "PrimaryAction":
        return (
          <>
            <Button
              className="place-order"
              variant="primary"
              onClick={() => setOrdered(true)}
            >
              <span>{block.label[locale]}</span>
              <ArrowRight size={17} className="directional" />
            </Button>
            <p className="checkout-note">
              {text(
                "Made for the demo. No real checkout.",
                "واجهة تجريبية. لا توجد عملية شراء فعلية.",
              )}
            </p>
            <p
              role="status"
              className={`order-status ${ordered ? "is-visible" : ""}`}
            >
              {ordered
                ? text(
                    "Demo only. No order or payment was submitted.",
                    "تجربة فقط. لم يتم إرسال أي طلب أو دفعة.",
                  )
                : ""}
            </p>
          </>
        );
    }
  }

  return (
    <section
      aria-label="Order preview"
      className="phone-preview"
      lang={locale}
      dir={arabic ? "rtl" : "ltr"}
      style={{ width }}
    >
      <div className="preview-content">
        {composition.blocks.map((block) => (
          <section
            key={block.id}
            className={`preview-block block-${block.type} ${selectedId === block.id ? "is-selected" : ""}`}
            data-block-id={block.id}
          >
            <button
              type="button"
              className="inspect-trigger"
              aria-label={`Inspect ${block.type}`}
              aria-pressed={selectedId === block.id}
              onClick={() => onSelect(block.id)}
            >
              <Scan size={13} />
              <span>{block.type}</span>
            </button>
            {renderBlock(block)}
          </section>
        ))}
      </div>
    </section>
  );
}

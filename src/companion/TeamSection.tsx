import { useId, useState, type ReactNode } from "react";
import { ThemeProvider, createTheme, LightTheme } from "baseui";
import { Provider as StyletronProvider } from "styletron-react";
import { Client } from "styletron-engine-atomic";
import { Button } from "baseui/button";
import { RadioGroup, Radio } from "baseui/radio";
import { Card, hasThumbnail } from "baseui/card";
import {
  HeadingSmall,
  ParagraphSmall,
  LabelMedium,
  LabelSmall,
} from "baseui/typography";
import "@fontsource-variable/inter";
import { teamSystem } from "./team-system";
import type { PreviewSectionData } from "./ArtifactView";
import "./team-system.css";

const engine = new Client();
const palette = teamSystem.tokens.reference;
export const careemTheme = createTheme({
  typography: Object.fromEntries(
    Object.entries(LightTheme.typography).map(([key, value]) => [
      key,
      { ...value, fontFamily: palette["font.ui"] },
    ]),
  ),
  colors: {
    contentPrimary: palette["color.midnight"],
    contentSecondary: palette["color.forest"],
    backgroundPrimary: palette["color.offWhite"],
    backgroundSecondary: palette["color.lightGreen"],
    buttonPrimaryFill: palette["color.green"],
    buttonPrimaryText: palette["color.forest"],
    buttonPrimaryHover: palette["color.lightGreen"],
    buttonPrimaryActive: palette["color.lightGreen"],
    tickFillSelected: palette["color.forest"],
    tickMarkFill: palette["color.white"],
    borderSelected: palette["color.forest"],
  },
  borders: { radius200: "12px", radius300: "16px" },
});
export function TeamProvider({
  children,
  rtl = false,
}: {
  children: ReactNode;
  rtl?: boolean;
}) {
  return (
    <StyletronProvider value={engine}>
      <ThemeProvider
        theme={rtl ? { ...careemTheme, direction: "rtl" } : careemTheme}
      >
        {children}
      </ThemeProvider>
    </StyletronProvider>
  );
}
export function TeamSection({
  section,
  selected = false,
  onInspect,
  rtl = false,
}: {
  section: PreviewSectionData;
  selected?: boolean;
  onInspect?: () => void;
  rtl?: boolean;
}) {
  const [choice, setChoice] = useState("");
  const [notice, setNotice] = useState("");
  const name = useId();
  return (
    <TeamProvider rtl={rtl}>
      <section
        className={`team-section av-${section.component.toLowerCase()} ${selected ? "team-inspected" : ""}`}
        data-system={teamSystem.id}
      >
        {onInspect && (
          <button
            type="button"
            className="team-inspect"
            aria-label={`Inspect ${section.component}: ${section.title}`}
            aria-pressed={selected}
            onClick={onInspect}
          >
            Inspect {section.component}
          </button>
        )}
        {section.component === "Heading" ? (
          <>
            <HeadingSmall
              marginTop="0"
              marginBottom="12px"
              overrides={{
                Block: { props: { role: "heading", "aria-level": 4 } },
              }}
            >
              {section.title}
            </HeadingSmall>
            {section.body && (
              <ParagraphSmall marginTop="0" marginBottom="0">
                {section.body}
              </ParagraphSmall>
            )}
          </>
        ) : section.component === "Action" ? (
          <>
            <Button
              onClick={() => {
                setNotice("Preview only — no booking is submitted.");
              }}
              overrides={{
                BaseButton: {
                  style: {
                    width: "100%",
                    borderRadius: "12px",
                    fontWeight: 700,
                  },
                },
              }}
            >
              {section.title}
            </Button>
            {section.body && <ParagraphSmall>{section.body}</ParagraphSmall>}
            {notice && (
              <p role="status" className="team-preview-notice">
                {notice}
              </p>
            )}
          </>
        ) : section.component === "Summary" ? (
          <Card
            hasThumbnail={hasThumbnail}
            overrides={{
              Title: { props: { $as: "div" } },
              Root: {
                style: {
                  borderTopWidth: "0",
                  borderRightWidth: "0",
                  borderBottomWidth: "0",
                  borderLeftWidth: "0",
                  borderRadius: "16px",
                  backgroundColor: palette["color.lightGreen"],
                  width: "100%",
                },
              },
              Contents: {
                style: {
                  marginTop: "20px",
                  marginRight: "20px",
                  marginBottom: "20px",
                  marginLeft: "20px",
                },
              },
            }}
            title={<LabelMedium>{section.title}</LabelMedium>}
          >
            {section.body && <ParagraphSmall>{section.body}</ParagraphSmall>}
            <dl className="team-facts">
              {section.items.map((item, i) => (
                <div key={i}>
                  <dt>
                    <LabelSmall>{item.label}</LabelSmall>
                  </dt>
                  <dd>{item.detail}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ) : (
          <>
            <LabelMedium>{section.title}</LabelMedium>
            {section.body && (
              <ParagraphSmall marginTop="8px" marginBottom="16px">
                {section.body}
              </ParagraphSmall>
            )}
            {section.component === "Choices" ? (
              <RadioGroup
                name={name}
                aria-label={section.title}
                value={choice}
                onChange={(e) => setChoice(e.currentTarget.value)}
                overrides={{
                  RadioGroupRoot: { props: { className: "team-options" } },
                }}
              >
                {section.items.map((item, i) => (
                  <Radio
                    key={i}
                    value={String(i)}
                    overrides={{
                      Input: { props: { "aria-label": item.label } },
                      Root: {
                        style: {
                          marginTop: "0",
                          marginBottom: "0",
                          paddingTop: "16px",
                          paddingBottom: "16px",
                          paddingLeft: "16px",
                          paddingRight: "16px",
                          borderTopWidth: "1px",
                          borderRightWidth: "1px",
                          borderBottomWidth: "1px",
                          borderLeftWidth: "1px",
                          borderTopStyle: "solid",
                          borderRightStyle: "solid",
                          borderBottomStyle: "solid",
                          borderLeftStyle: "solid",
                          borderTopColor:
                            choice === String(i)
                              ? palette["color.forest"]
                              : palette["color.lightGreen"],
                          borderRightColor:
                            choice === String(i)
                              ? palette["color.forest"]
                              : palette["color.lightGreen"],
                          borderBottomColor:
                            choice === String(i)
                              ? palette["color.forest"]
                              : palette["color.lightGreen"],
                          borderLeftColor:
                            choice === String(i)
                              ? palette["color.forest"]
                              : palette["color.lightGreen"],
                          borderRadius: "16px",
                          backgroundColor:
                            choice === String(i)
                              ? palette["color.lightGreen"]
                              : palette["color.white"],
                          alignItems: "flex-start",
                        },
                      },
                      Label: {
                        style: { fontWeight: 600, overflowWrap: "anywhere" },
                      },
                      Description: {
                        style: { lineHeight: "1.6", overflowWrap: "anywhere" },
                      },
                    }}
                  >
                    <span className="team-option-copy">
                      <strong>{item.label}</strong>
                      <span>{item.detail}</span>
                    </span>
                  </Radio>
                ))}
              </RadioGroup>
            ) : (
              section.items.map((item, i) => (
                <ParagraphSmall key={i}>
                  <strong>{item.label}</strong> {item.detail}
                </ParagraphSmall>
              ))
            )}
          </>
        )}
      </section>
    </TeamProvider>
  );
}

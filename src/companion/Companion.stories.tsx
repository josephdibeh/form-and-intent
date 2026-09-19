import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  PreviewSection,
  LayoutPreview,
  type PreviewSectionData,
  type LayoutOption,
} from "./ArtifactView";

const heading: PreviewSectionData = {
  id: "heading",
  component: "Heading",
  title: "A little help at home",
  body: "Choose a service that fits your day.",
  items: [],
  emphasis: false,
};
const text: PreviewSectionData = {
  id: "text",
  component: "Text",
  title: "A time that works for you",
  body: "Choose your preferred time after selecting a service.",
  items: [],
  emphasis: false,
};
const choices: PreviewSectionData = {
  id: "choices",
  component: "Choices",
  title: "Choose your service",
  body: "Every service includes supplies.",
  items: [
    { label: "Home cleaning", detail: "From QAR 140" },
    { label: "Deep cleaning", detail: "From QAR 240" },
  ],
  emphasis: false,
};
const summary: PreviewSectionData = {
  id: "summary",
  component: "Summary",
  title: "Your estimate",
  body: "Final price is confirmed before booking.",
  items: [
    { label: "Home cleaning", detail: "QAR 140" },
    { label: "Service fee", detail: "QAR 10" },
    { label: "Estimated total", detail: "QAR 150" },
  ],
  emphasis: true,
};
const action: PreviewSectionData = {
  id: "action",
  component: "Action",
  title: "Choose a time",
  body: "No payment yet",
  items: [],
  emphasis: false,
};
const option: LayoutOption = {
  id: "guided",
  family: "service-selection",
  arrangement: "stacked",
  title: "A guided choice",
  rationale: "One decision at a time.",
  tradeoff: "More scrolling.",
  sections: [heading, choices, text, summary, action],
};
const meta = {
  title: "Companion/Components",
  component: PreviewSection,
  args: { section: heading, onInspect: () => {} },
  decorators: [
    (Story) => (
      <div
        className="av-root"
        style={{
          width: "min(420px, 90vw)",
          padding: 24,
          background: "var(--surface-page)",
        }}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "The same semantic sections used by live layout artifacts. Click a preview section in the app to select its copy and inspect token values.",
      },
    },
  },
} satisfies Meta<typeof PreviewSection>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Heading: Story = { args: { section: heading } };
export const Text: Story = { args: { section: text } };
export const Choices: Story = { args: { section: choices } };
export const Summary: Story = { args: { section: summary } };
export const Action: Story = { args: { section: action } };
export const Stacked: Story = {
  render: () => <LayoutPreview option={option} />,
};
export const Split: Story = {
  render: () => <LayoutPreview option={{ ...option, arrangement: "split" }} />,
};
export const SplitComparison: Story = {
  render: () => (
    <LayoutPreview
      option={{
        ...option,
        arrangement: "split",
        sections: [heading, choices, action],
      }}
    />
  ),
};
export const SummaryFirst: Story = {
  render: () => (
    <LayoutPreview option={{ ...option, arrangement: "summary-first" }} />
  ),
};
export const RtlLayout: Story = {
  render: () => (
    <>
      <p style={{ fontSize: 12, marginBottom: 16 }}>
        RTL layout preview · English content
      </p>
      <LayoutPreview option={{ ...option, arrangement: "split" }} locale="ar" />
    </>
  ),
};

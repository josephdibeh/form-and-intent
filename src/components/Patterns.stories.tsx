import type { Meta, StoryObj } from "@storybook/react-vite";
import { Preview } from "./Preview";
import { examples } from "../system/examples";
import { compositionSchema } from "../system/contract";
const meta = {
  title: "Design system/Patterns",
  component: Preview,
  args: {
    composition: compositionSchema.parse(examples[0].composition),
    locale: "en",
    width: 390,
    onSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        component:
          "Production components shown in their order-summary context. Selected pattern is outlined.",
      },
    },
  },
} satisfies Meta<typeof Preview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ScreenHeader: Story = { args: { selectedId: "header" } };
export const DeliveryDetails: Story = { args: { selectedId: "delivery" } };
export const DeliveryEmphasis: Story = {
  args: {
    selectedId: "delivery",
    composition: compositionSchema.parse(examples[1].composition),
  },
};
export const OrderItems: Story = { args: { selectedId: "items" } };
export const CompactItems: Story = {
  args: {
    selectedId: "items",
    composition: compositionSchema.parse(examples[2].composition),
  },
};
export const PromoCode: Story = { args: { selectedId: "promo" } };
export const PriceSummary: Story = { args: { selectedId: "total" } };
export const PrimaryAction: Story = { args: { selectedId: "action" } };
export const Arabic: Story = { args: { selectedId: "delivery", locale: "ar" } };

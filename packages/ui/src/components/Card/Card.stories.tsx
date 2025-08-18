import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./Card";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: <p>Ini adalah konten di dalam card.</p>,
  },
};

export const WithCustomPadding: Story = {
  args: {
    className: "p-10",
    children: <p>Card dengan padding lebih besar</p>,
  },
};

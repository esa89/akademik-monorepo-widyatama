import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";
import { Check, Trash2, Settings } from "lucide-react";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "destructive",
        "destructive-secondary",
        "white",
        "outline",
        "ghost"
      ],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: "Button",
    variant: "primary",
    size: "md",
  },
};

export const WithIconLeft: Story = {
  args: {
    children: "Save",
    iconLeft: <Check size={16} />,
    variant: "primary",
    size: "md",
  },
};

export const WithIconRight: Story = {
  args: {
    children: "Delete",
    iconRight: <Trash2 size={16} />,
    variant: "destructive",
    size: "md",
  },
};

export const IconOnly: Story = {
  args: {
    iconRight: <Settings size={18} />,
    variant: "white",
    size: "md",
    "aria-label": "settings",
  },
};

export const Disabled: Story = {
  args: {
    children: "Can't click",
    variant: "primary",
    size: "md",
    disabled: true,
  },
};

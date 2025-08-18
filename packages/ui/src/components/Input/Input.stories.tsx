// src/components/input/Input.stories.tsx

import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    label: "Title",
    placeholder: "Input text",
  },
};

export const WithError: Story = {
  args: {
    label: "Email",
    placeholder: "example@email.com",
    error: "This field is required",
  },
};

export const Disabled: Story = {
  args: {
    label: "Nama",
    placeholder: "Tidak bisa diisi",
    disabled: true,
  },
};


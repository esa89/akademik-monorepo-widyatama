import type { Meta, StoryObj } from "@storybook/react";
import { Breadcrumb } from "./Breadcrumb";

const meta: Meta<typeof Breadcrumb> = {
  title: "Components/Breadcrumb",
  component: Breadcrumb,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  args: {
    items: [
      { label: "Dashboard", href: "#" },
      { label: "Kehadiran", href: "#" },
      { label: "Detail", href: undefined }, // Last breadcrumb (no href)
    ],
  },
};

export const CustomClass: Story = {
  args: {
    items: [
      { label: "Beranda", href: "#" },
      { label: "Data", href: "#" },
      { label: "Mahasiswa" },
    ],
    className: "text-red-500", // Will apply to nav element
  },
};

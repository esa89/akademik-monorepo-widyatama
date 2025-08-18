import { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DatePicker } from "./Datepicker";

const meta: Meta<typeof DatePicker> = {
  title: "Components/DatePicker",
  component: DatePicker,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState<Date | null>(new Date());
    return <DatePicker selected={selected} onChange={setSelected} />;
  },
};

export const WithLabel: Story = {
  render: () => {
    const [selected, setSelected] = useState<Date | null>(new Date());
    return <DatePicker label="Tanggal Lahir" selected={selected} onChange={setSelected} />;
  },
};

export const CustomClass: Story = {
  render: () => {
    const [selected, setSelected] = useState<Date | null>(null);
    return (
      <DatePicker
        selected={selected}
        onChange={setSelected}
        label="Tanggal Event"
        className="max-w-xs"
      />
    );
  },
};

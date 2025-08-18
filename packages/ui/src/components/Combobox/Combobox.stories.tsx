import { Meta, StoryObj } from "@storybook/react";
import { Combobox, type ComboboxProps } from "./Combobox";
import { useState } from "react";

const meta: Meta<typeof Combobox> = {
  title: "Components/Combobox",
  component: Combobox,
};
export default meta;

const options = [
  { label: "List Item Name", value: "1" },
  { label: "List Item Name", value: "2" },
  { label: "List Item Name", value: "3" },
  { label: "List Item Name", value: "4" },
  { label: "List Item Name", value: "5" },
  { label: "List Item Name", value: "6" },
];

// Komponen pembungkus dengan state internal
function StatefulCombobox(args: Partial<ComboboxProps>) {
  const [value, setValue] = useState(args.value ?? "");

  return (
    <div className="w-72">
      <Combobox
        {...args}
        value={value}
        onChange={(val) => setValue(val)}
        options={args.options ?? options}
      />
    </div>
  );
}

// Story
export const Default: StoryObj = {
  render: () => (
    <StatefulCombobox placeholder="Dropdown text" />
  ),
};

export const WithLabel: StoryObj = {
  render: () => (
    <StatefulCombobox label="Default" placeholder="Dropdown text" />
  ),
};

export const Error: StoryObj = {
  render: () => (
    <StatefulCombobox
      label="Error"
      placeholder="Dropdown text"
      error
    />
  ),
};

export const Success: StoryObj = {
  render: () => (
    <StatefulCombobox
      label="Success"
      placeholder="Dropdown text"
      success
    />
  ),
};

export const Disabled: StoryObj = {
  render: () => (
    <StatefulCombobox
      label="Disabled"
      placeholder="Dropdown text"
      disabled
    />
  ),
};

export const Focused: StoryObj = {
  render: () => (
    <StatefulCombobox
      label="Focus"
      placeholder="Dropdown text"
    />
  ),
};

export const Preselected: StoryObj = {
  render: () => (
    <StatefulCombobox
      label="Active"
      placeholder="Dropdown Text"
      value="2"
    />
  ),
};

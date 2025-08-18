import { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Switch } from "./Switch";

const meta: Meta<typeof Switch> = {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "radio" },
      options: ["sm", "md", "lg"],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Switch>;

const Template = (args: any) => {
  const [checked, setChecked] = useState(args.checked ?? false);
  return (
    <Switch
      {...args}
      checked={checked}
      onCheckedChange={(val) => {
        setChecked(val);
        args.onCheckedChange?.(val);
      }}
    />
  );
};

export const Default: Story = {
  render: () => <Template />,
};

export const Sizes: Story = {
  render: () => {
    const [val, setVal] = useState(true);
    return (
      <div className="flex items-center gap-6">
        <div className="space-x-2">
          <Switch size="lg" checked={val} onCheckedChange={setVal} />
          <span>Large</span>
        </div>
        <div className="space-x-2">
          <Switch size="md" checked={val} onCheckedChange={setVal} />
          <span>Medium</span>
        </div>
        <div className="space-x-2">
          <Switch size="sm" checked={val} onCheckedChange={setVal} />
          <span>Small</span>
        </div>
      </div>
    );
  },
};

export const States: Story = {
  render: () => {
    const [val, setVal] = useState(true);
    return (
      <div className="flex items-center gap-6">
        <div className="space-x-2">
          <Switch checked={false} onCheckedChange={() => {}} />
          <span>Regular</span>
        </div>
        <div className="space-x-2">
          <div className="hover:bg-gray-200 inline-block p-1 rounded">
            <Switch checked={false} onCheckedChange={() => {}} />
          </div>
          <span>Hover</span>
        </div>
        <div className="space-x-2">
          <Switch checked={true} onCheckedChange={() => {}} />
          <span>Enabled</span>
        </div>
        <div className="space-x-2">
          <Switch checked={false} onCheckedChange={() => {}} disabled />
          <span>Disabled</span>
        </div>
      </div>
    );
  },
};

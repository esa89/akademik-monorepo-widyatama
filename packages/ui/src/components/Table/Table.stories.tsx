import type { Meta, StoryObj } from "@storybook/react";
import { Table, Column } from "./Table";

type Item = {
  name: string;
  age: number;
};

const data: Item[] = [
  { name: "Andi", age: 25 },
  { name: "Budi", age: 30 },
  { name: "Citra", age: 28 },
];

const columns: Column<Item>[] = [
  { label: "No", render: (_, i) => i + 1 },
  { label: "Name", render: (item) => item.name },
  { label: "Age", render: (item) => item.age },
];

const meta: Meta<typeof Table<Item>> = {
  title: "Components/Table",
  component: Table<Item>,
  tags: ["autodocs"],
  render: (args) => <Table {...args} />,
};

export default meta;
type Story = StoryObj<typeof Table<Item>>;

export const Default: Story = {
  args: {
    data,
    columns,
  },
};

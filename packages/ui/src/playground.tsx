import React from "react";
import ReactDOM from "react-dom/client";
import { Button } from "./components/Button/Button";
import "./index.css";
import { Check, Trash2, Settings } from "lucide-react";

const VARIANTS = [
  "primary",
  "secondary",
  "destructive",
  "destructive-secondary",
  "white",
] as const;

const SIZES = ["sm", "md", "lg"] as const;

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-10 text-gray-800 font-sans">
      {SIZES.map((size) => (
        <div key={size} className="mb-10">
          <h2 className="text-xl font-semibold mb-4 capitalize">{size} Buttons</h2>
          <div className="grid grid-cols-5 gap-4 items-center">
            {VARIANTS.map((variant) => (
              <div key={variant} className="flex flex-col items-start gap-2">
                <div className="text-sm font-medium capitalize">{variant}</div>
                <Button variant={variant} size={size}>Button</Button>
                <Button variant={variant} size={size} iconLeft={<Check size={16} />}>Button</Button>
                <Button variant={variant} size={size} iconRight={<Trash2 size={16} />}>Button</Button>
                <Button variant={variant} size={size} iconRight={<Settings size={16} />} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

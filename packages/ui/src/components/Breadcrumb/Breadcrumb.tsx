import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

type BreadcrumbItem = {
  label: ReactNode;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center space-x-1">
            {item.href && !isLast ? (
              <a href={item.href} className="text-blue-600 hover:underline">
                {item.label}
              </a>
            ) : (
              <span className="text-gray-700">{item.label}</span>
            )}
            {!isLast && <ChevronRight className="w-4 h-4 text-gray-400" />}
          </div>
        );
      })}
    </nav>
  );
}

import { Breadcrumb } from '@widyatama/ui';
import { Button } from '@widyatama/ui';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: ReactNode };
  breadcrumb?: { label: string; href?: string }[];
}

export function PageHeader({ title, description, action, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="mb-3">
          <Breadcrumb items={breadcrumb.map((b) => ({ label: b.label, href: b.href }))} />
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
        {action && (
          <Button variant="primary" iconLeft={action.icon} onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}

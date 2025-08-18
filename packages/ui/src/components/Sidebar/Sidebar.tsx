import React from "react";
import { clsx } from "clsx";

type MenuItem = {
  key: string;
  label: string;
  icon?: React.ReactElement<{ size?: number }>;
};

type MenuGroup = {
  group: string;
  items: MenuItem[];
};

type SidebarProps = {
  title: string;
  titleIcon?: React.ReactElement<{ size?: number }>;
  menu: MenuGroup[];
  activeKey?: string;
  onMenuClick?: (key: string) => void;
  iconSize?: number;
  showFooter?: boolean;
  footerLabel?: string;
  footerIcon?: React.ReactElement<{ size?: number }>;
  onFooterClick?: () => void;
};

export const Sidebar: React.FC<SidebarProps> = ({
  title,
  titleIcon,
  menu,
  activeKey,
  onMenuClick,
  iconSize = 18,
  showFooter = false,
  footerLabel = "Logout",
  footerIcon,
  onFooterClick,
}) => {
  return (
    <aside className="h-screen w-60 bg-[#373B85] text-white flex flex-col justify-between">
      {/* HEADER */}
      <div>
        <div className="h-16 flex items-center gap-2 text-xl font-bold border-b border-white/20 px-4">
          {titleIcon &&
            React.isValidElement(titleIcon) &&
            React.cloneElement(titleIcon, { size: iconSize + 2 })}
          <span>{title}</span>
        </div>

        {/* MENU */}
        <nav className="mt-4 px-4 flex flex-col gap-6 text-sm">
          {menu.map((section) => (
            <div key={section.group}>
              <p className="uppercase text-xs text-white/60 mb-2 tracking-wide">
                {section.group}
              </p>
              <ul className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const isActive = item.key === activeKey;
                  return (
                    <li
                      key={item.key}
                      onClick={() => onMenuClick?.(item.key)}
                      className={clsx(
                        "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition",
                        isActive
                          ? "bg-[#F79009] text-white"
                          : "hover:bg-white/10 text-white/80"
                      )}
                    >
                      {item.icon &&
                        React.isValidElement(item.icon) &&
                        React.cloneElement(item.icon, { size: iconSize })}
                      <span>{item.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* FOOTER */}
      {showFooter && (
        <div className="p-4 border-t border-white/20">
          <button
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm"
            onClick={onFooterClick}
          >
            {footerIcon &&
              React.isValidElement(footerIcon) &&
              React.cloneElement(footerIcon, { size: iconSize })}
            {footerLabel}
          </button>
        </div>
      )}
    </aside>
  );
};

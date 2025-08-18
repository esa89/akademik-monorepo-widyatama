import React from "react";
import { Bell, ChevronDown } from "lucide-react";
import { clsx } from "clsx";

type MenuItem = {
  key: string;
  label: string;
  icon?: React.ReactNode;
};

type TopbarProps = {
  menus?: MenuItem[];
  activeMenu?: string;
  onChangeMenu?: (key: string) => void;
  userName?: string;
  avatarUrl?: string;
  showNotification?: boolean;
  onNotificationClick?: () => void;
  profileMenu?: { label: string; onClick: () => void }[];
};

export const Topbar: React.FC<TopbarProps> = ({
  menus = [],
  activeMenu,
  onChangeMenu,
  userName = "User",
  avatarUrl,
  showNotification = true,
  onNotificationClick,
  profileMenu = [],
}) => {
  const [showDropdown, setShowDropdown] = React.useState(false);

  return (
    <header className="w-full h-16 bg-white shadow-sm border-b flex items-center justify-between px-6 relative">
      {/* Menus */}
      <nav className="flex gap-6">
        {menus.map((item) => {
          const isActive = item.key === activeMenu;
          return (
            <button
              key={item.key}
              onClick={() => onChangeMenu?.(item.key)}
              className={clsx(
                "flex items-center gap-2 pb-1 border-b-2 text-sm font-medium transition-all",
                isActive
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right Section */}
      <div className="flex items-center gap-4 ml-auto relative">
        {showNotification && (
          <button
            onClick={onNotificationClick}
            className="relative text-gray-600 hover:text-gray-800"
          >
            <Bell size={20} />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
          </button>
        )}

        <button
          onClick={() => setShowDropdown((prev) => !prev)}
          className="flex items-center gap-2 text-sm font-medium text-gray-800 hover:text-primary"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300" />
          )}
          <span>{userName}</span>
          <ChevronDown size={16} />
        </button>

        {showDropdown && (
          <div className="absolute top-14 right-0 bg-white shadow-md border rounded-md w-40 z-50">
            {profileMenu.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  item.onClick();
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

import React from "react";

type TabItem = {
  key: string;
  label: string;
  icon?: React.ReactNode;
};

type HeaderProps = {
  tabs: TabItem[];
  currentTab: string;
  onTabChange: (key: string) => void;
  user: {
    name: string;
    icon?: React.ReactNode;
  };
};

const Header: React.FC<HeaderProps> = ({ tabs, currentTab, onTabChange, user }) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm">
      <nav className="flex space-x-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              currentTab === tab.key
                ? "text-secondary border-b-2 border-secondary"
                : "text-gray-500 hover:text-primary"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {user.icon}
        <span className="text-sm font-medium text-gray-800">{user.name}</span>
      </div>
    </header>
  );
};

export default Header;

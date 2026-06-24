import { UserMenu } from "@/components/auth/UserMenu";

export default function Header() {
  return (
    <header className="flex items-center justify-end px-6 py-4 bg-white border-b shadow-sm">
      <UserMenu />
    </header>
  );
}

import { UserButton } from "@clerk/nextjs";
import NavLink from "./NavLink";

const navItems = [
  { href: "/overview", label: "Overview" },
  { href: "/decisions", label: "Decisions" },
  { href: "/goals", label: "Goals" },
  { href: "/settings", label: "Financial Inputs" },
];

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[220px_1fr]">
      <aside className="border-b border-gray-200 p-4 md:border-b-0 md:border-r">
        <h2 className="mb-4 text-lg font-semibold">FinLife</h2>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <p className="text-sm text-gray-600">MVP Scaffold</p>
          <UserButton afterSignOutUrl="/" />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

import Link from "next/link";

const actions = [
  {
    href: "/decisions/new",
    title: "Evaluate a financial decision",
    description: "See how a purchase, loan, or life change affects your plan",
    primary: true,
  },
  {
    href: "/goals",
    title: "Set a goal",
    description: "Define savings targets and track progress",
    primary: false,
  },
  {
    href: "/settings",
    title: "Refine your inputs",
    description: "Add detail to your income, expenses, and assets",
    primary: false,
  },
];

export default function NextActions() {
  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        What&apos;s next?
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`rounded-lg border p-5 transition hover:shadow-md ${
              action.primary
                ? "border-blue-200 bg-blue-50 hover:border-blue-400"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <p
              className={`font-semibold ${action.primary ? "text-blue-900" : "text-gray-900"}`}
            >
              {action.title}
            </p>
            <p className="mt-1 text-sm text-gray-500">{action.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

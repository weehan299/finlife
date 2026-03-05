"use client";

const intents = [
  {
    id: "understand",
    title: "Understand my finances",
    description: "Get a clear picture of where you stand today",
  },
  {
    id: "decision",
    title: "Check a financial decision",
    description: "See how a big purchase or change would affect you",
  },
  {
    id: "goals",
    title: "Track progress toward goals",
    description: "Set savings targets and monitor your journey",
  },
] as const;

interface IntentSelectorProps {
  onSelect: (intent: string) => void;
}

export default function IntentSelector({ onSelect }: IntentSelectorProps) {
  return (
    <div className="mx-auto max-w-2xl py-12">
      <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">
        What would you like to do today?
      </h1>
      <p className="mb-8 text-center text-gray-500">
        We&apos;ll start with a quick setup, then show you your financial
        picture.
      </p>
      <div className="space-y-4">
        {intents.map((intent) => (
          <button
            key={intent.id}
            onClick={() => onSelect(intent.id)}
            className="w-full rounded-lg border border-gray-200 bg-white p-6 text-left transition hover:border-blue-400 hover:shadow-md"
          >
            <p className="text-lg font-semibold text-gray-900">
              {intent.title}
            </p>
            <p className="mt-1 text-sm text-gray-500">{intent.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

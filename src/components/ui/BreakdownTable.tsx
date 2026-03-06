import { formatCurrency } from "@/lib/format";

export interface BreakdownItem {
  label: string;
  category?: string;
  amount: number;
  extra?: string;
}

interface BreakdownTableProps {
  title: string;
  items: BreakdownItem[];
  total: number;
}

export default function BreakdownTable({ title, items, total }: BreakdownTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-2 pr-4 font-medium">{title}</th>
            <th className="pb-2 pr-4 font-medium">Category</th>
            <th className="pb-2 text-right font-medium">Amount</th>
            {items.some((i) => i.extra) && (
              <th className="pb-2 pl-4 text-right font-medium">Details</th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.label} className="border-b border-gray-100">
              <td className="py-2 pr-4 text-gray-900">{item.label}</td>
              <td className="py-2 pr-4 text-gray-500">{item.category ?? "--"}</td>
              <td className="py-2 text-right text-gray-900">
                {formatCurrency(item.amount)}
              </td>
              {items.some((i) => i.extra) && (
                <td className="py-2 pl-4 text-right text-gray-500">
                  {item.extra ?? ""}
                </td>
              )}
            </tr>
          ))}
          <tr className="border-t border-gray-300">
            <td className="pt-2 pr-4 font-semibold text-gray-900" colSpan={2}>
              Total
            </td>
            <td className="pt-2 text-right font-semibold text-gray-900">
              {formatCurrency(total)}
            </td>
            {items.some((i) => i.extra) && <td />}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

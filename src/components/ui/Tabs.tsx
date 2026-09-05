"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  content: React.ReactNode;
}

export function Tabs({ items, defaultValue }: { items: TabItem[]; defaultValue?: string }) {
  const [active, setActive] = useState(defaultValue ?? items[0]?.value);

  return (
    <div>
      <div className="flex space-x-6 border-b border-gray-200 px-6">
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setActive(item.value)}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              active === item.value
                ? "border-wine-700 text-wine-700"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="p-6">{items.find((item) => item.value === active)?.content}</div>
    </div>
  );
}

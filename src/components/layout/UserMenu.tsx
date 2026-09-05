"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import Image from "next/image";
import { useClerk } from "@clerk/nextjs";
import { ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link as LocaleLink } from "@/i18n/navigation";

interface UserMenuLabels {
  myPanel: string;
  signOut: string;
  roleAdmin: string;
  roleStudent: string;
}

interface UserMenuProps {
  name: string;
  email: string;
  imageUrl: string | null;
  role: "ADMIN" | "STUDENT";
  labels: UserMenuLabels;
}

export function UserMenu({ name, email, imageUrl, role, labels }: UserMenuProps) {
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const roleLabel = role === "ADMIN" ? labels.roleAdmin : labels.roleStudent;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-2.5 transition-colors hover:bg-gray-50"
      >
        <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-wine-100">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill sizes="32px" className="object-cover" />
          ) : (
            <User className="h-4 w-4 text-wine-700" />
          )}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-medium text-gray-900">{name}</span>
          <span className="block text-xs text-gray-500">{email}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-medium text-gray-900">{name}</p>
            <p className="truncate text-xs text-gray-500">{email}</p>
            <span className="mt-2 inline-flex items-center rounded-full bg-wine-100 px-2.5 py-0.5 text-xs font-medium text-wine-800">
              {roleLabel}
            </span>
          </div>
          {role === "ADMIN" ? (
            // /admin vive fuera del esquema de locale (next-intl) — link plano, sin prefijo.
            <NextLink
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <LayoutDashboard className="h-4 w-4 text-gray-500" />
              {labels.myPanel}
            </NextLink>
          ) : (
            <LocaleLink
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <LayoutDashboard className="h-4 w-4 text-gray-500" />
              {labels.myPanel}
            </LocaleLink>
          )}
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/" })}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            {labels.signOut}
          </button>
        </div>
      )}
    </div>
  );
}

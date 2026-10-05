"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type ItemMenu = { href: string; texto: string };

function Enlaces({ items, alElegir }: { items: ItemMenu[]; alElegir?: () => void }) {
  const ruta = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const activo = item.href === "/" ? ruta === "/" : ruta.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={alElegir}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
              activo && "bg-muted font-medium",
            )}
          >
            {item.texto}
          </Link>
        );
      })}
    </nav>
  );
}

// Menú lateral en computadora; en celular, un botón que lo abre como panel.
export function Navegacion({ items, pie }: { items: ItemMenu[]; pie: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
        <span className="font-semibold">WildSalud</span>
        <Sheet open={abierto} onOpenChange={setAbierto}>
          <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Abrir menú" />}>
            <MenuIcon />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4">
            <SheetTitle className="px-3">WildSalud</SheetTitle>
            <Enlaces items={items} alElegir={() => setAbierto(false)} />
            <div className="mt-auto">{pie}</div>
          </SheetContent>
        </Sheet>
      </header>

      <aside className="hidden w-60 shrink-0 flex-col gap-4 border-r p-4 md:flex">
        <span className="px-3 text-lg font-semibold">WildSalud</span>
        <Enlaces items={items} />
        <div className="mt-auto">{pie}</div>
      </aside>
    </>
  );
}

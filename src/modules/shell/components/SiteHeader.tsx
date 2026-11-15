import { Clapperboard } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ThemeToggle } from "@/modules/preferences";
import { HeaderSearch, HeaderSearchFallback } from "@/modules/search";
import { APP_NAME } from "@/shared/config/app";
import { routes } from "@/shared/config/routes";
import { MainNav } from "./MainNav";
import { MobileNav } from "./MobileNav";
import { UserMenu } from "./UserMenu";

/**
 * Layout (brand + primary nav left, search center, utilities right):
 *   md+:    [logo] [Home Browse]  [ search ]  [theme] [user]
 *   mobile: [menu] [logo]               [theme] [user]
 *           [ search (full width)                    ]
 * The search field is rendered once (it syncs with the URL) and moves to its own row on
 * mobile via flex-wrap + order, so there is never a second, competing instance.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex flex-wrap items-center gap-x-2 gap-y-3 px-4 py-3 md:flex-nowrap md:gap-x-6">
        <MobileNav />
        <Link href={routes.home()} className="flex shrink-0 items-center gap-2 font-semibold">
          <Clapperboard className="size-6 text-primary" aria-hidden />
          <span>{APP_NAME}</span>
        </Link>
        <MainNav />

        <div className="order-last w-full md:order-none md:mx-auto md:max-w-md md:flex-1">
          {/* The search field reads `?q=` (useSearchParams), which needs a Suspense boundary. */}
          <Suspense fallback={<HeaderSearchFallback />}>
            <HeaderSearch />
          </Suspense>
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

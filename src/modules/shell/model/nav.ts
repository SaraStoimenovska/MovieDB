/** `/movies/123` is active for "Movies"; "Home" (`/`) only matches exactly. */
export const isNavItemActive = (pathname: string, href: string): boolean =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

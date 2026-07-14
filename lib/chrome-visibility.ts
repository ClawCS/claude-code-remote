export function shouldHideLegacyChrome(pathname: string): boolean {
  return pathname === "/" || pathname === "/nl" || pathname.startsWith("/nl/");
}

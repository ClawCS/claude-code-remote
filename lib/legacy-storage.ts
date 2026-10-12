/** Retired local data only; no catalog, price, contact or operational imports. */
export function removeLegacyPersonalData(storage: Pick<Storage, "removeItem">): void {
  for (const key of ["trinkgut-bestellungen", "gewinnspiel-teilnahmen", "trinkgut-community-id", "trinkgut-community-name", "trinkgut-community", "trinkgut-last-visit", "cookie-consent"]) storage.removeItem(key);
}

import ShoppingState from "./ShoppingState";
import ShoppingDrawers from "./ShoppingDrawers";

/** Statically bind state to its real route consumers, never to public chrome. */
export default function ShoppingLayout({ children }: { children: React.ReactNode }) {
  return <ShoppingState>{children}<ShoppingDrawers /></ShoppingState>;
}

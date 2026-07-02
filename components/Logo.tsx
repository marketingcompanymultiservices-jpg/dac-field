import { AppBrand } from "@/components/AppBrand";

export function Logo({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) {
  return <AppBrand compact={compact} inverted={inverted} />;
}

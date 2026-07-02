"use client";

import { AppLogo } from "@/components/AppLogo";

type AppBrandProps = {
  compact?: boolean;
  inverted?: boolean;
  showMotto?: boolean;
};

export function AppBrand({ compact = false, inverted = false, showMotto = false }: AppBrandProps) {
  const titleColor = inverted ? "text-white" : "text-dac-primary";
  const mutedColor = inverted ? "text-white/75" : "text-dac-text/70";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <AppLogo compact={compact} inverted={inverted} />
      <div className="min-w-0">
        <p className={titleColor + " block text-base font-black leading-tight sm:hidden"}>DAC</p>
        {!compact && (
          <>
            <p className={titleColor + " hidden truncate text-base font-black leading-tight sm:block sm:text-lg"}>Doble Altura Control</p>
            <p className={mutedColor + " hidden text-sm sm:block"}>Sistema Integral de Gestion de Obras</p>
            {showMotto && (
              <p className={mutedColor + " mt-2 hidden max-w-xl text-sm leading-6 lg:block"}>
                Construimos informacion con la misma precision con la que construimos obras.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

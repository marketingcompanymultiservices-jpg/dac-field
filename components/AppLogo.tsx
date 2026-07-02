"use client";

import { useEffect, useState } from "react";

type AppLogoProps = {
  compact?: boolean;
  inverted?: boolean;
  className?: string;
};

export function AppLogo({ compact = false, inverted = false, className = "" }: AppLogoProps) {
  const [source, setSource] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;

    async function detectLogo() {
      const sources = ["/branding/logo.svg", "/branding/logo.png"];

      for (const nextSource of sources) {
        try {
          const response = await fetch(nextSource, { method: "HEAD" });
          if (response.ok) {
            if (active) {
              setSource(nextSource);
              setChecked(true);
            }
            return;
          }
        } catch {
          // Continue with the next available logo format.
        }
      }

      if (active) {
        setSource(null);
        setChecked(true);
      }
    }

    detectLogo();
    return () => {
      active = false;
    };
  }, []);

  if (!checked || !source) {
    return (
      <div className={(inverted ? "bg-white text-dac-primary" : "bg-dac-primary text-white") + " grid h-11 w-11 shrink-0 place-items-center rounded-md text-lg font-black shadow-panel " + className}>
        DA
      </div>
    );
  }

  return (
    <span className={(inverted ? "bg-white p-2" : "") + " inline-flex shrink-0 items-center justify-center rounded-md " + className}>
      <img
        src={source}
        alt="Doble Altura Construcciones"
        className={(compact ? "h-10 w-10 object-contain" : "h-12 w-auto max-w-[220px] object-contain sm:h-14") + " block"}
        onError={() => setSource(null)}
      />
    </span>
  );
}

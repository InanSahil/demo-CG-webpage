import { useEffect, useState, type ReactNode } from "react";

import logoImg from "../assets/logo.png";
import { useTheme } from "../context/ThemeContext";

interface StartupTransitionProps {
  children: ReactNode;
}

type HighlightColor = "red" | "green" | "blue";

export default function StartupTransition({
  children,
}: StartupTransitionProps) {
  const { theme } = useTheme();

  // Animation lifecycle phases: 'popout' -> 'submerge' -> 'done'
  const [phase, setPhase] = useState<"popout" | "submerge" | "done">("popout");

  // Pick a random highlight color each time the site loads / reloads
  const [highlightColor] = useState<HighlightColor>(() => {
    const colors: HighlightColor[] = ["red", "green", "blue"];
    return colors[Math.floor(Math.random() * colors.length)];
  });

  useEffect(() => {
    // Phase 1: Logo pops out forward (stays prominent until 1250ms)
    const popoutTimer = window.setTimeout(() => {
      // Phase 2: Logo submerges into the background to reveal the home page
      setPhase("submerge");
    }, 1250);

    // Phase 3: Transition finishes and leaves DOM
    const doneTimer = window.setTimeout(() => {
      setPhase("done");
    }, 2050);

    return () => {
      window.clearTimeout(popoutTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  if (phase === "done") {
    return <>{children}</>;
  }

  return (
    <>
      <div
        className={`startup-transition-overlay startup-transition-${theme} startup-${phase} startup-highlight-${highlightColor}`}
        aria-hidden="true"
      >
        <div className={`startup-backdrop-glow glow-${highlightColor}`} />

        <div className={`startup-logo-container startup-logo-${phase}`}>
          <div className={`startup-logo-frame frame-${highlightColor}`}>
            <img
              src={logoImg}
              alt="CyberGuard Shield"
              className="startup-shield-img"
            />
          </div>

          <div className="startup-brand-text">
            <strong>CYBERGUARD</strong>
            <span className={`text-${highlightColor}`}>INITIALIZING DEFENSE SYSTEMS</span>
          </div>
        </div>
      </div>

      <div
        className={`startup-page-underlay ${
          phase === "submerge" ? "startup-page-revealing" : ""
        }`}
      >
        {children}
      </div>
    </>
  );
}
import { useEffect, useState, useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  const [displayedContent, setDisplayedContent] = useState<ReactNode>(children);
  const [transitionPhase, setTransitionPhase] = useState<
    "idle" | "submerging" | "popping-out"
  >("idle");

  const isInitialMount = useRef(true);
  const activeLocationRef = useRef(location.pathname);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (activeLocationRef.current === location.pathname) {
      return;
    }

    activeLocationRef.current = location.pathname;

    // Step 1: Current page submerges with the background in 0.5 sec (500ms)
    setTransitionPhase("submerging");

    const submergeTimer = window.setTimeout(() => {
      // Step 2: Swap content and start popping out the new page in 2.0 sec (2000ms)
      setDisplayedContent(children);
      setTransitionPhase("popping-out");

      const popOutTimer = window.setTimeout(() => {
        setTransitionPhase("idle");
      }, 2000);

      return () => window.clearTimeout(popOutTimer);
    }, 500);

    return () => {
      window.clearTimeout(submergeTimer);
    };
  }, [location.pathname, children]);

  return (
    <div
      className={`page-transition-wrapper phase-${transitionPhase}`}
      data-phase={transitionPhase}
    >
      {displayedContent}
    </div>
  );
}
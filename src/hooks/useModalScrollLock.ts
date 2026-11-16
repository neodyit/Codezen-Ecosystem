import { useEffect } from "react";
import { useLenis } from "lenis/react";

/**
 * Universal hook to lock background scrolling (both window/body and Lenis smooth scroll)
 * while a popup/modal is open, ensuring only the modal content scrolls.
 *
 * @param isOpen boolean indicating whether the modal or popup is currently visible
 */
export function useModalScrollLock(isOpen: boolean) {
  const lenis = useLenis();

  useEffect(() => {
    if (!isOpen) return;

    // 1. Pause Lenis smooth scrolling so mouse wheel & gestures don't scroll background
    try {
      lenis?.stop();
    } catch {
      // ignore
    }

    // 2. Lock body and html scroll
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      // Restore Lenis smooth scrolling
      try {
        lenis?.start();
      } catch {
        // ignore
      }

      // Restore body and html scroll
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isOpen, lenis]);
}


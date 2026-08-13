import { useEffect, useRef } from "react";
import "./HomepageSearchAdaptivePanel.css";

type ScrollSnapshot = {
  scrollY: number;
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyRight: string;
  bodyWidth: string;
  bodyOverflow: string;
  bodyPaddingRight: string;
  htmlOverflow: string;
  htmlOverscrollBehavior: string;
};

export function HomepageSearchAdaptivePanel() {
  const lockedRef = useRef(false);
  const snapshotRef = useRef<ScrollSnapshot | null>(null);

  useEffect(() => {
    const lockPage = () => {
      if (lockedRef.current) return;

      const body = document.body;
      const html = document.documentElement;
      const scrollY = window.scrollY;
      const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);

      snapshotRef.current = {
        scrollY,
        bodyPosition: body.style.position,
        bodyTop: body.style.top,
        bodyLeft: body.style.left,
        bodyRight: body.style.right,
        bodyWidth: body.style.width,
        bodyOverflow: body.style.overflow,
        bodyPaddingRight: body.style.paddingRight,
        htmlOverflow: html.style.overflow,
        htmlOverscrollBehavior: html.style.overscrollBehavior,
      };

      lockedRef.current = true;
      body.classList.add("pc-search-page-locked");
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
      if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
      html.style.overflow = "hidden";
      html.style.overscrollBehavior = "none";
    };

    const unlockPage = () => {
      if (!lockedRef.current) return;

      const body = document.body;
      const html = document.documentElement;
      const snapshot = snapshotRef.current;

      lockedRef.current = false;
      body.classList.remove("pc-search-page-locked");

      if (!snapshot) return;

      body.style.position = snapshot.bodyPosition;
      body.style.top = snapshot.bodyTop;
      body.style.left = snapshot.bodyLeft;
      body.style.right = snapshot.bodyRight;
      body.style.width = snapshot.bodyWidth;
      body.style.overflow = snapshot.bodyOverflow;
      body.style.paddingRight = snapshot.bodyPaddingRight;
      html.style.overflow = snapshot.htmlOverflow;
      html.style.overscrollBehavior = snapshot.htmlOverscrollBehavior;

      window.scrollTo(0, snapshot.scrollY);
      snapshotRef.current = null;
    };

    const sync = () => {
      const searchOpen = Boolean(document.querySelector(".pc-stable-search"));
      if (searchOpen) lockPage();
      else unlockPage();
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    sync();

    return () => {
      observer.disconnect();
      unlockPage();
    };
  }, []);

  return null;
}

import { useCallback, useRef, type RefObject } from 'react';

/**
 * The on-screen keyboard and page scrolling on iPhone.
 *
 * Pi Browser on iOS is a WKWebView, which has a long-standing bug: when the
 * page scrolls while the keyboard is closing, it can stay scrolled past its
 * own end once the keyboard is gone. The whole screen is then blank — only
 * the browser's address bar is left — until the user drags it. Recorded on a
 * real iPhone: tapping Send closed the keyboard, the new message scrolled the
 * chat to its end, and the chat stayed blank for 12 seconds, which looked like
 * the app loading forever.
 */

export const IS_IOS =
  typeof navigator !== 'undefined' &&
  (/iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    // iPadOS reports itself as a Mac
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

/** How far down the page can scroll. */
export function pageScrollEnd(): number {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

/**
 * Scrolls the page to its end. Not animated on iOS: an animated scroll that
 * outlives a closing keyboard is what leaves the page stranded.
 */
export function scrollPageToEnd() {
  window.scrollTo({ top: pageScrollEnd(), behavior: IS_IOS ? 'auto' : 'smooth' });
}

function isTextField(el: Element | null) {
  return !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || (el as HTMLElement).isContentEditable);
}

/**
 * Once the keyboard has closed, puts back a page left scrolled past its end.
 * Scrolling to where the page already is also makes WKWebView repaint a
 * screen it left blank, so this runs every time, not only when it is off.
 */
export function watchIosKeyboard() {
  if (!IS_IOS) return;
  let timer: number | undefined;
  const settle = () => {
    window.clearTimeout(timer);
    // After the keyboard's closing animation.
    timer = window.setTimeout(() => {
      if (isTextField(document.activeElement)) return; // the keyboard is open again
      window.scrollTo(0, Math.min(window.scrollY, pageScrollEnd()));
    }, 350);
  };
  document.addEventListener('focusout', settle);
  window.visualViewport?.addEventListener('resize', settle);
}

/**
 * Props for a Send button next to a text field: tapping it no longer takes the
 * focus away, so the keyboard stays open as in any messenger instead of
 * closing under the newly sent message.
 */
export function useKeepKeyboardOpen(field: RefObject<HTMLElement | null>) {
  const hadFocus = useRef(false);
  const onPointerDown = useCallback(() => { hadFocus.current = document.activeElement === field.current; }, [field]);
  const onMouseDown = useCallback((e: { preventDefault(): void }) => e.preventDefault(), []);
  /** Call after sending: some iOS versions blur the field anyway. */
  const refocus = useCallback(() => {
    if (hadFocus.current && document.activeElement !== field.current) field.current?.focus();
  }, [field]);
  return { onPointerDown, onMouseDown, refocus };
}

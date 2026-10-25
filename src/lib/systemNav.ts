/**
 * Android's navigation bar (◁ ○ □) and the page: on Android 15+ Pi Browser
 * draws the page underneath it (edge-to-edge), on older Android the page ends
 * above it. Pinning the tab bar, the chat input and sheet buttons to the
 * bottom puts them under the system buttons in the first case, where taps go
 * to Android instead of the app.
 *
 * Everything at the bottom pads by `--safe-bottom` (index.css), which is the
 * larger of the browser's own safe-area inset and `--sysnav-bottom` set here.
 * Recent WebViews report the bar as env(safe-area-inset-bottom) once the page
 * asks for viewport-fit=cover; older ones report 0, so the overlap is also
 * worked out from how much of the screen the page gets.
 */

// A 3-button bar is 48dp; gesture navigation needs less, but a few spare
// pixels are better than buttons under the system ones.
const NAV_BAR = 48;
// When the page runs under the navigation bar, all that separates its height
// from the screen's is the status bar plus Pi Browser's own top bar: 73 CSS px
// measured on Android 15 (screen 935, page 862), up to ~105 with the tallest
// status bars. A 3-button bar outside the page adds 48 more (121+). Gesture
// navigation outside the page can land under the line and get a spare 48px,
// which is the cheaper mistake.
const UNDER_NAV_MAX_GAP = 110;

export function bottomOverlap(screenHeight: number, viewportWidth: number, viewportHeight: number): number {
  if (viewportWidth > viewportHeight) return 0; // landscape: the bar moves to the side
  return screenHeight - viewportHeight < UNDER_NAV_MAX_GAP ? NAV_BAR : 0;
}

export function watchAndroidNavBar() {
  const root = document.documentElement;
  const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (viewport && !viewport.content.includes('viewport-fit')) {
    viewport.content += ', viewport-fit=cover';
  }

  let largest = 0;
  const update = () => {
    // The keyboard shrinks the page, which reads as "not under the bar";
    // judge by the tallest the page has been instead.
    largest = Math.max(largest, window.innerHeight);
    const overlap = bottomOverlap(window.screen.height, window.innerWidth, largest);
    root.style.setProperty('--sysnav-bottom', `${overlap}px`);
  };
  update();
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', () => { largest = 0; setTimeout(update, 300); });
}

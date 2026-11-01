import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRef } from 'react';
import { render, fireEvent, act } from '@testing-library/react';

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

function setPage(scrollHeight: number, innerHeight: number, scrollY: number) {
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: scrollHeight });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: innerHeight });
  Object.defineProperty(window, 'scrollY', { configurable: true, value: scrollY });
}

async function load(ua: string) {
  vi.resetModules();
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua);
  return import('./keyboard');
}

describe('page scrolling around the iPhone keyboard', () => {
  let scrollTo: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.useFakeTimers();
    scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('scrolls to the real end of the page, not past it', async () => {
    const { pageScrollEnd } = await load(IPHONE_UA);
    setPage(2400, 800, 0);
    expect(pageScrollEnd()).toBe(1600);
    setPage(500, 800, 0);
    expect(pageScrollEnd()).toBe(0);
  });

  it('does not animate the scroll to the newest message on iPhone', async () => {
    const { scrollPageToEnd } = await load(IPHONE_UA);
    setPage(2400, 800, 0);
    scrollPageToEnd();
    expect(scrollTo).toHaveBeenCalledWith({ top: 1600, behavior: 'auto' });
  });

  it('still animates it elsewhere', async () => {
    const { scrollPageToEnd } = await load('Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130 Mobile');
    setPage(2400, 800, 0);
    scrollPageToEnd();
    expect(scrollTo).toHaveBeenCalledWith({ top: 1600, behavior: 'smooth' });
  });

  it('brings back a page left scrolled past its end once the keyboard has closed', async () => {
    const { watchIosKeyboard } = await load(IPHONE_UA);
    watchIosKeyboard();
    setPage(2400, 800, 1950); // the blank screen: 350px below the last pixel
    document.dispatchEvent(new FocusEvent('focusout'));
    vi.advanceTimersByTime(400);
    expect(scrollTo).toHaveBeenLastCalledWith(0, 1600);
  });

  it('leaves the page alone while the keyboard is open again', async () => {
    const { watchIosKeyboard } = await load(IPHONE_UA);
    watchIosKeyboard();
    const field = document.createElement('textarea');
    document.body.appendChild(field);
    setPage(2400, 800, 1950);
    document.dispatchEvent(new FocusEvent('focusout'));
    field.focus();
    vi.advanceTimersByTime(400);
    expect(scrollTo).not.toHaveBeenCalled();
    field.remove();
  });
});

describe('useKeepKeyboardOpen', () => {
  function Composer({ onSend }: { onSend: () => void }) {
    const ref = useRef<HTMLTextAreaElement>(null);
    return <ComposerInner fieldRef={ref} onSend={onSend} />;
  }
  let useKeepKeyboardOpen: typeof import('./keyboard').useKeepKeyboardOpen;
  function ComposerInner({ fieldRef, onSend }: { fieldRef: React.RefObject<HTMLTextAreaElement | null>; onSend: () => void }) {
    const keep = useKeepKeyboardOpen(fieldRef);
    return (
      <>
        <textarea ref={fieldRef} data-testid="field" />
        <button
          data-testid="send"
          onPointerDown={keep.onPointerDown}
          onMouseDown={keep.onMouseDown}
          onClick={() => { onSend(); keep.refocus(); }}
        />
      </>
    );
  }
  beforeEach(async () => {
    ({ useKeepKeyboardOpen } = await import('./keyboard'));
  });

  it('keeps the text field focused when Send is tapped, so the keyboard stays open', () => {
    const onSend = vi.fn();
    const { getByTestId } = render(<Composer onSend={onSend} />);
    const field = getByTestId('field');
    act(() => field.focus());
    const send = getByTestId('send');
    fireEvent.pointerDown(send);
    const allowed = fireEvent.mouseDown(send);
    expect(allowed).toBe(false); // the tap's focus change was cancelled
    field.blur(); // some iOS versions blur anyway
    fireEvent.click(send);
    expect(onSend).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(field);
  });

  it('does not open the keyboard when it was closed before Send was tapped', () => {
    const { getByTestId } = render(<Composer onSend={() => {}} />);
    const field = getByTestId('field');
    const send = getByTestId('send');
    fireEvent.pointerDown(send);
    fireEvent.mouseDown(send);
    fireEvent.click(send);
    expect(document.activeElement).not.toBe(field);
  });
});

// Emergency Pi re-init fix for cached HTML
var _isPiBrowser = /PiBrowser/i.test(navigator.userAgent);
if (typeof Pi !== 'undefined') {
  try {
    var cfg = { version: "2.0" };
    if (!_isPiBrowser) cfg.sandbox = true;
    console.log('[PI-FIX] Re-init with', JSON.stringify(cfg));
    Pi.init(cfg);
    console.log('[PI-FIX] Re-init OK');
  } catch(e) {
    console.error('[PI-FIX] Re-init failed:', e.message);
  }
}

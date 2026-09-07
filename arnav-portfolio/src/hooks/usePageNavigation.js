import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const readLocation = () => ({
  pathname: window.location.pathname.replace(/\/+$/, '') || '/',
  hash: window.location.hash,
});

// A small history router for the portfolio's two pages. Content changes only
// at the shutter midpoint; loading and cursor state stay in the shared shell.
export function usePageNavigation(ready) {
  const [location, setLocation] = useState(readLocation);
  const [active, setActive] = useState(false);
  const pending = useRef(null);
  const queued = useRef(null);
  const running = useRef(false);

  const start = useCallback(target => {
    if (running.current) {
      queued.current = target;
      return;
    }
    running.current = true;
    pending.current = target;
    setActive(true);
  }, []);

  const navigate = useCallback(href => {
    const url = new URL(href.startsWith('#') ? `/${href}` : href, window.location.origin);
    start({ href: `${url.pathname}${url.hash}`, history: 'push' });
  }, [start]);

  const runTransition = useCallback(action => start({ action }), [start]);

  const onMidpoint = useCallback(beforeNavigate => {
    const target = pending.current;
    if (!target) return;
    if (target.action) target.action();
    if (target.href) {
      beforeNavigate?.();
      if (target.history === 'push' && target.href !== `${window.location.pathname}${window.location.hash}`) {
        window.history.pushState(null, '', target.href);
      }
      const url = new URL(target.href, window.location.origin);
      setLocation({ pathname: url.pathname.replace(/\/+$/, '') || '/', hash: url.hash });
    }
  }, []);

  const onComplete = useCallback(() => {
    running.current = false;
    pending.current = null;
    setActive(false);
  }, []);

  useEffect(() => {
    if (active || !queued.current) return;
    const frame = requestAnimationFrame(() => {
      const next = queued.current;
      queued.current = null;
      if (next) start(next);
    });
    return () => cancelAnimationFrame(frame);
  }, [active, start]);

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    const onPopState = () => start({ href: `${window.location.pathname}${window.location.hash}`, history: 'pop' });
    window.addEventListener('popstate', onPopState);
    return () => {
      window.history.scrollRestoration = previousRestoration;
      window.removeEventListener('popstate', onPopState);
    };
  }, [start]);

  useLayoutEffect(() => {
    if (!ready) return;
    document.title = location.pathname === '/works' ? 'Works | Arnav Rai' : 'Arnav Rai | Creative Portfolio';
    const target = location.hash ? document.getElementById(location.hash.slice(1)) : null;
    if (target) target.scrollIntoView({ behavior: 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
    const focusTarget = target || document.querySelector('#works-heading, #section-hero');
    if (focusTarget) {
      focusTarget.setAttribute('tabindex', '-1');
      focusTarget.focus({ preventScroll: true });
    }
  }, [location, ready]);

  return { location, active, navigate, runTransition, onMidpoint, onComplete };
}

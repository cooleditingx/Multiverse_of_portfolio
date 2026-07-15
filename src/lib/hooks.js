import { useEffect, useState, useRef } from 'react';
import { SITE_URL } from './site';

/* hreflang variants emitted for every indexable page. The site is
   English-only, so each page self-references as "en" plus the required
   "x-default" fallback — trivially reciprocal. When a translation ships,
   add its ISO 639-1 code (plus optional ISO 3166-1 alpha-2 region, e.g.
   "en-GB") mapped to a path-builder for that locale's URL. */
const HREFLANG_VARIANTS = {
  en: (path) => new URL(path, SITE_URL).href,
  'x-default': (path) => new URL(path, SITE_URL).href,
};

/** Sets the page's document title, meta description, canonical URL and
 *  hreflang alternates, restoring the previous values on unmount.
 *
 *  - description: unique per page, 120–160 characters — not a ranking factor,
 *    but the copy searchers read before deciding to click.
 *  - canonicalPath: the page's own clean route ('/tech'), emitted as an
 *    absolute self-referencing <link rel="canonical"> so URL variations
 *    (query strings, hashes, stray casing) all index as one page, plus one
 *    <link rel="alternate" hreflang> per entry in HREFLANG_VARIANTS. Omit it
 *    on pages that shouldn't be indexed (404) — the tags are removed there. */
export function usePageTitle(title, description, canonicalPath) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute('content') ?? null;
    if (description) {
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }

    let link = document.querySelector('link[rel="canonical"]');
    const prevHref = link?.getAttribute('href') ?? null;
    if (canonicalPath) {
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', new URL(canonicalPath, SITE_URL).href);
    } else if (link) {
      link.remove();
      link = null;
    }

    // hreflang alternates: replace whatever the previous page declared with
    // this page's own set (or none, on unindexed pages like the 404)
    const prevAlts = Array.from(
      document.querySelectorAll('link[rel="alternate"][hreflang]'),
      (l) => ({ hreflang: l.getAttribute('hreflang'), href: l.getAttribute('href') })
    );
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((l) => l.remove());
    if (canonicalPath) {
      for (const [code, toHref] of Object.entries(HREFLANG_VARIANTS)) {
        const alt = document.createElement('link');
        alt.setAttribute('rel', 'alternate');
        alt.setAttribute('hreflang', code);
        alt.setAttribute('href', toHref(canonicalPath));
        document.head.appendChild(alt);
      }
    }

    return () => {
      document.title = prev;
      if (description && meta && prevDesc !== null) meta.setAttribute('content', prevDesc);
      if (prevHref !== null) {
        if (!link) {
          link = document.createElement('link');
          link.setAttribute('rel', 'canonical');
          document.head.appendChild(link);
        }
        link.setAttribute('href', prevHref);
      } else if (link) {
        link.remove();
      }
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((l) => l.remove());
      for (const { hreflang, href } of prevAlts) {
        const alt = document.createElement('link');
        alt.setAttribute('rel', 'alternate');
        alt.setAttribute('hreflang', hreflang);
        alt.setAttribute('href', href);
        document.head.appendChild(alt);
      }
    };
  }, [title, description, canonicalPath]);
}

/** Injects the page's JSON-LD structured data as a <script type="application/ld+json">
 *  in <head>, removed on unmount. Pass a plain schema.org object; reference the
 *  shared Person entity as { '@id': `${SITE_URL}/#person` } (defined in index.html). */
export function useJsonLd(data) {
  const json = data ? JSON.stringify(data) : null;
  useEffect(() => {
    if (!json) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = json;
    document.head.appendChild(script);
    return () => script.remove();
  }, [json]);
}

/** True when the user prefers reduced motion. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** Ref + boolean: has the element scrolled into view (fires once)? */
export function useInViewOnce(threshold = 0.35) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/** Element size via ResizeObserver. */
export function useSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, size];
}

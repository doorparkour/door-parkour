# Lessons Learned

Architectural decisions, gotchas, and hard-won knowledge specific to this project.

---

## Zustand v5 — never use object selectors without `useShallow`

**Date:** 2026-03-13  
**Symptom:** React error #185 ("getSnapshot should return a stable value") causing a full client-side crash on `/merch`.  
**Root cause:** `useCart((s) => ({ addItem: s.addItem, items: s.items }))` returns a new `{}` on every call. React 18+ `useSyncExternalStore` requires a stable snapshot reference — a fresh object literal always fails `===`, so React detects an infinite tearing loop and throws.  
**Fix:** Use separate selectors instead of returning an object:
```ts
// ❌ crashes
const { addItem, items } = useCart((s) => ({ addItem: s.addItem, items: s.items }));

// ✅ correct
const addItem = useCart((s) => s.addItem);
const items   = useCart((s) => s.items);
```
If you genuinely need one selector, use `useShallow` from `zustand/react/shallow`.

---

## Next.js App Router — `onError` misses images that fail before hydration

**Date:** 2026-03-13  
**Symptom:** Image shows broken alt text on hard reload even though `onError` fallback is set.  
**Root cause:** `onError` is a React event handler — it only attaches after client hydration. If the image URL 404s or DNS-fails fast (e.g. `https://test.com`), the browser fires the error event before React has hydrated, so the handler is never called.  
**Fix:** Use a ref + `useEffect` to catch images that already failed pre-hydration:
```tsx
const [imgSrc, setImgSrc] = useState(src || FALLBACK);
const imgRef = useRef<HTMLImageElement>(null);

useEffect(() => {
  const img = imgRef.current;
  if (img && img.complete && img.naturalWidth === 0) setImgSrc(FALLBACK);
}, []);

<img ref={imgRef} src={imgSrc} onError={() => setImgSrc(FALLBACK)} />
```
`onError` still handles the client-navigation case; the `useEffect` handles the hard-reload case.

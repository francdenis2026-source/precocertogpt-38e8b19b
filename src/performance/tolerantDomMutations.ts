// Several UX helper components inject/remove nodes inside React-managed
// containers (suggestion panels, hero radar list, product modal, price labels).
// When React later reconciles those containers it can try to remove a node that
// is no longer its child, throwing NotFoundError and blanking the whole app.
//
// We make removeChild/insertBefore tolerant instead of fatal.

const GLOBAL_KEY = "__precocerto_tolerant_dom__";
const CACHE_RESET_KEY = "precocerto:published-cache-reset";
const CACHE_RESET_VERSION = "2026-08-13-v1";

type GuardedWindow = Window & typeof globalThis & { [GLOBAL_KEY]?: boolean };

const guardedWindow = window as GuardedWindow;

if (!guardedWindow[GLOBAL_KEY]) {
  guardedWindow[GLOBAL_KEY] = true;

  const originalRemoveChild = Node.prototype.removeChild;
  const originalInsertBefore = Node.prototype.insertBefore;

  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (child.parentNode) child.parentNode.removeChild(child);
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  Node.prototype.insertBefore = function <T extends Node>(node: T, reference: Node | null): T {
    if (reference && reference.parentNode !== this) {
      this.appendChild(node);
      return node;
    }
    return originalInsertBefore.call(this, node, reference) as T;
  };
}

// Production cache recovery: old published versions may have left a Service
// Worker or Cache Storage entries controlling the live origin. The current app
// does not register a Service Worker, so stale registrations are safe to remove.
if (localStorage.getItem(CACHE_RESET_KEY) !== CACHE_RESET_VERSION) {
  void (async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      }

      localStorage.setItem(CACHE_RESET_KEY, CACHE_RESET_VERSION);
    } catch (error) {
      console.warn("PreçoCerto: limpeza de cache legado incompleta.", error);
    }
  })();
}

export {};

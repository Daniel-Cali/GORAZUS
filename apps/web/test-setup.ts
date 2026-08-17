import '@testing-library/jest-dom/vitest';

/**
 * Configuración global mínima de Vitest — solo lo que jsdom no implementa y
 * que los componentes de `ui-kit` basados en Radix (Dialog/Popover/Select,
 * usados por DatePicker/ConfirmDialog/etc.) necesitan para no tirar en
 * tiempo de test. Nada de lógica de negocio acá.
 */
if (!('ResizeObserver' in window)) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

if (!('matchMedia' in window)) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

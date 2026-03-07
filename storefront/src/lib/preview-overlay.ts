/**
 * Preview Overlay System
 *
 * Pure DOM overlay for the Visual Component Designer. Activates only in preview
 * mode (inside Storefront Control iframe with ?preview). NO React — just DOM
 * manipulation to avoid hydration issues.
 *
 * Features:
 * - Hover highlighting of [data-cd] components
 * - Click-to-select with PostMessage to admin
 * - Admin-initiated highlight + scroll
 * - Homepage section drag handles for reordering
 */

// --- Types ---

interface RegistryEntry {
  configKey: string;
  label: string;
}

// --- State ---

let overlayRoot: HTMLDivElement | null = null;
let hoverBox: HTMLDivElement | null = null;
let hoverLabel: HTMLDivElement | null = null;
let selectedBox: HTMLDivElement | null = null;
let selectedKey: string | null = null;
let enabled = true;
let elementMap = new Map<string, Element>();
let registryLabels = new Map<string, string>();
let observer: MutationObserver | null = null;
let rescanTimer: ReturnType<typeof setInterval> | null = null;
let sectionsReorderedCallback: ((order: string[]) => void) | null = null;
let dragHandlesContainer: HTMLDivElement | null = null;
let overrideDotsContainer: HTMLDivElement | null = null;
let overriddenConfigKeys = new Set<string>();
let rafId: number | null = null;

// --- Helpers ---

/** data-cd value (hyphen) → config key (dot): replace first hyphen only */
function cdToConfigKey(cd: string): string {
  const idx = cd.indexOf("-");
  if (idx === -1) return cd;
  return cd.slice(0, idx) + "." + cd.slice(idx + 1);
}

/** config key (dot) → data-cd value (hyphen): replace first dot only */
function configKeyToCd(key: string): string {
  const idx = key.indexOf(".");
  if (idx === -1) return key;
  return key.slice(0, idx) + "-" + key.slice(idx + 1);
}

function getLabelForCd(cd: string): string {
  const configKey = cdToConfigKey(cd);
  return registryLabels.get(configKey) || cd;
}

// --- DOM Creation ---

function createOverlayRoot(): HTMLDivElement {
  const el = document.createElement("div");
  el.id = "cd-overlay-root";
  Object.assign(el.style, {
    position: "fixed",
    inset: "0",
    pointerEvents: "none",
    zIndex: "99998",
    overflow: "visible",
  });
  document.body.appendChild(el);
  return el;
}

function createHighlightBox(type: "hover" | "selected"): HTMLDivElement {
  const box = document.createElement("div");
  Object.assign(box.style, {
    position: "fixed",
    pointerEvents: "none",
    opacity: "0",
    transition: "opacity 150ms ease, top 60ms ease, left 60ms ease, width 60ms ease, height 60ms ease",
    zIndex: type === "selected" ? "99999" : "99998",
    boxSizing: "border-box",
  });

  if (type === "hover") {
    Object.assign(box.style, {
      border: "2px dashed #3b82f6",
      backgroundColor: "rgba(59,130,246,0.08)",
      borderRadius: "4px",
    });
  } else {
    Object.assign(box.style, {
      border: "2px solid #3b82f6",
      boxShadow: "0 0 0 3px rgba(59,130,246,0.3)",
      borderRadius: "4px",
    });
  }

  return box;
}

function createHoverLabel(): HTMLDivElement {
  const label = document.createElement("div");
  Object.assign(label.style, {
    position: "fixed",
    pointerEvents: "none",
    opacity: "0",
    transition: "opacity 150ms ease",
    zIndex: "100000",
    backgroundColor: "#3b82f6",
    color: "#fff",
    fontSize: "11px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontWeight: "600",
    padding: "2px 8px",
    borderRadius: "3px 3px 0 0",
    whiteSpace: "nowrap",
    lineHeight: "18px",
  });
  return label;
}

function positionBoxOnElement(
  box: HTMLDivElement,
  el: Element,
  label?: HTMLDivElement,
) {
  const rect = el.getBoundingClientRect();
  Object.assign(box.style, {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    opacity: "1",
  });

  if (label) {
    const labelHeight = 22;
    const labelTop = rect.top - labelHeight;
    // Flip label below element if near viewport top
    if (labelTop < 4) {
      Object.assign(label.style, {
        top: `${rect.bottom + 2}px`,
        left: `${rect.left}px`,
        opacity: "1",
        borderRadius: "0 0 3px 3px",
      });
    } else {
      Object.assign(label.style, {
        top: `${labelTop}px`,
        left: `${rect.left}px`,
        opacity: "1",
        borderRadius: "3px 3px 0 0",
      });
    }
  }
}

function hideBox(box: HTMLDivElement, label?: HTMLDivElement) {
  box.style.opacity = "0";
  if (label) label.style.opacity = "0";
}

// --- Element Scanner ---

function scanElements() {
  const els = document.querySelectorAll("[data-cd]");
  elementMap.clear();
  els.forEach((el) => {
    const cd = el.getAttribute("data-cd");
    if (cd) elementMap.set(cd, el);
  });
}

function startScanner() {
  scanElements();

  observer = new MutationObserver(() => {
    scanElements();
    updateDragHandles();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  rescanTimer = setInterval(() => {
    scanElements();
    updateDragHandles();
  }, 2000);
}

// --- Event Handlers ---

function onMouseMove(e: MouseEvent) {
  if (!enabled || !hoverBox || !hoverLabel) return;

  const target = (e.target as Element).closest("[data-cd]");
  if (!target) {
    hideBox(hoverBox, hoverLabel);
    return;
  }

  const cd = target.getAttribute("data-cd");
  if (!cd) return;

  // Don't show hover on selected element
  if (cd === selectedKey) {
    hideBox(hoverBox, hoverLabel);
    return;
  }

  hoverLabel.textContent = getLabelForCd(cd);
  positionBoxOnElement(hoverBox, target, hoverLabel);
}

function onClick(e: MouseEvent) {
  if (!enabled) return;

  const target = (e.target as Element).closest("[data-cd]");
  if (!target) return;

  e.preventDefault();
  e.stopPropagation();

  const cd = target.getAttribute("data-cd");
  if (!cd) return;

  selectComponent(cd);

  const configKey = cdToConfigKey(cd);
  window.parent.postMessage(
    {
      type: "storefront-control:component-selected",
      payload: { configKey },
    },
    "*",
  );
}

function selectComponent(cd: string) {
  selectedKey = cd;

  if (!selectedBox || !overlayRoot) return;

  const el = elementMap.get(cd);
  if (!el) {
    hideBox(selectedBox);
    return;
  }

  positionBoxOnElement(selectedBox, el);

  // Hide hover if it's on the same element
  if (hoverBox) hideBox(hoverBox, hoverLabel ?? undefined);
}

// --- Position Recalculation ---

function recalcPositions() {
  if (!enabled) return;

  // Update selected box position
  if (selectedKey && selectedBox) {
    const el = elementMap.get(selectedKey);
    if (el) {
      positionBoxOnElement(selectedBox, el);
    } else {
      hideBox(selectedBox);
    }
  }

  // Update drag handles and override dots
  updateDragHandlePositions();
  updateOverrideDots();

  rafId = null;
}

function onScrollOrResize() {
  if (rafId) return;
  rafId = requestAnimationFrame(recalcPositions);
}

// --- Homepage Section Drag Handles ---

function isHomepage(): boolean {
  return document.querySelectorAll("[data-homepage-section]").length > 0;
}

function createDragHandle(sectionId: string, label: string): HTMLDivElement {
  const handle = document.createElement("div");
  handle.dataset.handleFor = sectionId;
  Object.assign(handle.style, {
    position: "fixed",
    pointerEvents: "auto",
    backgroundColor: "rgba(59,130,246,0.9)",
    color: "#fff",
    fontSize: "12px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "default",
    zIndex: "100001",
    transition: "opacity 150ms ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  });

  // Grip icon
  const grip = document.createElement("span");
  grip.textContent = "\u2807"; // vertical ellipsis as grip
  grip.style.opacity = "0.7";
  grip.style.fontSize = "14px";
  handle.appendChild(grip);

  // Label
  const labelSpan = document.createElement("span");
  labelSpan.textContent = label;
  handle.appendChild(labelSpan);

  // Spacer
  const spacer = document.createElement("span");
  spacer.style.flex = "1";
  handle.appendChild(spacer);

  // Up button
  const upBtn = document.createElement("button");
  upBtn.textContent = "\u25B2";
  Object.assign(upBtn.style, {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: "3px",
    fontSize: "10px",
    lineHeight: "1",
  });
  upBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    moveSectionUp(sectionId);
  });
  handle.appendChild(upBtn);

  // Down button
  const downBtn = document.createElement("button");
  downBtn.textContent = "\u25BC";
  Object.assign(downBtn.style, {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: "3px",
    fontSize: "10px",
    lineHeight: "1",
  });
  downBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    moveSectionDown(sectionId);
  });
  handle.appendChild(downBtn);

  return handle;
}

function getSectionElements(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>("[data-homepage-section]"),
  );
}

function getCurrentSectionOrder(): string[] {
  return getSectionElements().map(
    (el) => el.dataset.homepageSection!,
  );
}

function moveSectionUp(sectionId: string) {
  const sections = getSectionElements();
  const idx = sections.findIndex(
    (el) => el.dataset.homepageSection === sectionId,
  );
  if (idx <= 0) return;

  const el = sections[idx];
  const prev = sections[idx - 1];
  prev.parentNode!.insertBefore(el, prev);

  notifySectionReorder();
}

function moveSectionDown(sectionId: string) {
  const sections = getSectionElements();
  const idx = sections.findIndex(
    (el) => el.dataset.homepageSection === sectionId,
  );
  if (idx === -1 || idx >= sections.length - 1) return;

  const el = sections[idx];
  const next = sections[idx + 1];
  next.parentNode!.insertBefore(next, el);

  notifySectionReorder();
}

function notifySectionReorder() {
  const order = getCurrentSectionOrder();
  if (sectionsReorderedCallback) {
    sectionsReorderedCallback(order);
  }
  // Recalc after DOM change
  setTimeout(() => {
    updateDragHandles();
    recalcPositions();
  }, 50);
}

function updateDragHandles() {
  if (!enabled || !dragHandlesContainer) return;

  if (!isHomepage()) {
    dragHandlesContainer.innerHTML = "";
    return;
  }

  const sections = getSectionElements();
  const existingHandles = new Set<string>();

  // Remove handles for sections that no longer exist
  const currentHandles = dragHandlesContainer.querySelectorAll<HTMLElement>("[data-handle-for]");
  currentHandles.forEach((h) => {
    const id = h.dataset.handleFor!;
    if (!sections.some((s) => s.dataset.homepageSection === id)) {
      h.remove();
    } else {
      existingHandles.add(id);
    }
  });

  // Create handles for new sections
  sections.forEach((section) => {
    const id = section.dataset.homepageSection!;
    if (!existingHandles.has(id)) {
      const label = getLabelForCd("homepage-" + id) || id;
      const handle = createDragHandle(id, label);
      dragHandlesContainer!.appendChild(handle);
    }
  });

  updateDragHandlePositions();
}

function updateDragHandlePositions() {
  if (!dragHandlesContainer) return;

  const handles = dragHandlesContainer.querySelectorAll<HTMLElement>("[data-handle-for]");
  handles.forEach((handle) => {
    const sectionId = handle.dataset.handleFor!;
    const section = document.querySelector<HTMLElement>(
      `[data-homepage-section="${sectionId}"]`,
    );
    if (!section) return;

    const rect = section.getBoundingClientRect();
    Object.assign(handle.style, {
      top: `${rect.top + 4}px`,
      left: `${rect.left + 4}px`,
    });
  });
}

// --- Override Indicator Dots ---

function updateOverrideDots() {
  if (!overrideDotsContainer || !enabled || overriddenConfigKeys.size === 0) {
    if (overrideDotsContainer) overrideDotsContainer.innerHTML = "";
    return;
  }

  overrideDotsContainer.innerHTML = "";

  for (const configKey of overriddenConfigKeys) {
    const cd = configKeyToCd(configKey);
    const el = elementMap.get(cd);
    if (!el) continue;

    // Skip hidden elements
    if (!(el as HTMLElement).offsetParent && (el as HTMLElement).style.display !== "fixed") continue;

    const rect = el.getBoundingClientRect();
    const dot = document.createElement("div");
    Object.assign(dot.style, {
      position: "fixed",
      top: `${rect.top + 4}px`,
      right: `${window.innerWidth - rect.right + 4}px`,
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      backgroundColor: "#3b82f6",
      border: "1.5px solid white",
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      pointerEvents: "none",
      zIndex: "99999",
      transition: "opacity 150ms ease",
    });
    overrideDotsContainer.appendChild(dot);
  }
}

// --- Public API ---

export function initOverlay(): void {
  if (overlayRoot) return; // Already initialized

  overlayRoot = createOverlayRoot();

  hoverBox = createHighlightBox("hover");
  hoverLabel = createHoverLabel();
  selectedBox = createHighlightBox("selected");

  overlayRoot.appendChild(hoverBox);
  overlayRoot.appendChild(hoverLabel);
  overlayRoot.appendChild(selectedBox);

  // Override indicator dots container
  overrideDotsContainer = document.createElement("div");
  Object.assign(overrideDotsContainer.style, {
    position: "fixed",
    inset: "0",
    pointerEvents: "none",
    zIndex: "99999",
  });
  overlayRoot.appendChild(overrideDotsContainer);

  // Drag handles container (needs pointer-events: auto on children)
  dragHandlesContainer = document.createElement("div");
  Object.assign(dragHandlesContainer.style, {
    position: "fixed",
    inset: "0",
    pointerEvents: "none",
    zIndex: "100001",
  });
  overlayRoot.appendChild(dragHandlesContainer);

  startScanner();

  document.addEventListener("mousemove", onMouseMove, { passive: true });
  document.addEventListener("click", onClick, true); // capture phase
  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize, { passive: true });

  // Initial drag handles
  setTimeout(updateDragHandles, 500);
}

export function destroyOverlay(): void {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("click", onClick, true);
  window.removeEventListener("scroll", onScrollOrResize);
  window.removeEventListener("resize", onScrollOrResize);

  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (rescanTimer) {
    clearInterval(rescanTimer);
    rescanTimer = null;
  }
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (overlayRoot) {
    overlayRoot.remove();
    overlayRoot = null;
  }

  hoverBox = null;
  hoverLabel = null;
  selectedBox = null;
  selectedKey = null;
  dragHandlesContainer = null;
  overrideDotsContainer = null;
  overriddenConfigKeys.clear();
  elementMap.clear();
  registryLabels.clear();
  sectionsReorderedCallback = null;
}

export function setRegistryLabels(
  components: Array<{ configKey: string; label: string }>,
): void {
  registryLabels.clear();
  for (const c of components) {
    registryLabels.set(c.configKey, c.label);
  }
  // Refresh drag handles with new labels
  if (dragHandlesContainer) {
    dragHandlesContainer.innerHTML = "";
    updateDragHandles();
  }
}

export function highlightComponent(configKey: string): void {
  const cd = configKeyToCd(configKey);
  const el = elementMap.get(cd);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "center" });

  // Select after scroll settles
  setTimeout(() => {
    selectComponent(cd);
  }, 300);
}

export function setOverlayEnabled(newEnabled: boolean): void {
  enabled = newEnabled;
  if (!overlayRoot) return;

  if (!enabled) {
    if (hoverBox) hideBox(hoverBox, hoverLabel ?? undefined);
    if (selectedBox) hideBox(selectedBox);
    overlayRoot.style.display = "none";
  } else {
    overlayRoot.style.display = "";
    updateDragHandles();
  }
}

export function setOverriddenKeys(keys: string[]): void {
  overriddenConfigKeys = new Set(keys);
  updateOverrideDots();
}

export function handleSectionsReordered(
  callback: (order: string[]) => void,
): void {
  sectionsReorderedCallback = callback;
}

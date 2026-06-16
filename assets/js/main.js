const menuButton = document.querySelector("[data-menu-button]");
const nav = document.querySelector("[data-site-nav]");

document.querySelectorAll('a[href*="results.html"]').forEach((link) => {
  const url = new URL(link.href, window.location.href);
  url.searchParams.set("v", "results-current-2");
  link.href = url.href;
});

if (menuButton && nav) {
  const menuDebugEnabled = new URLSearchParams(window.location.search).get("menu-debug") === "1";
  let isMenuOpen = false;
  let lastMenuToggleAt = 0;
  let menuCloseLockedUntil = 0;
  let backdropUnlockTimer = 0;
  const duplicateTapWindow = 1200;
  const menuBackdrop = document.createElement("button");
  let debugPanel;
  let debugLines;

  const describeTarget = (target) => {
    if (!(target instanceof Element)) return String(target);
    const name = target.getAttribute("aria-label") || target.textContent?.trim().slice(0, 24) || "";
    const classes = target.classList.length ? `.${Array.from(target.classList).join(".")}` : "";
    return `${target.tagName.toLowerCase()}${target.id ? `#${target.id}` : ""}${classes}${name ? ` [${name}]` : ""}`;
  };

  const menuDebug = (message, event) => {
    if (!menuDebugEnabled) return;
    const details = event
      ? ` target=${describeTarget(event.target)} phase=${event.eventPhase} pointer=${event.pointerType || "-"}`
      : "";
    const line = `${new Date().toISOString().slice(11, 23)} ${message}${details}`;
    console.log(`[MENU DEBUG] ${line}`);
    if (debugLines) {
      debugLines.textContent += `${line}\n`;
      debugLines.scrollTop = debugLines.scrollHeight;
    }
  };

  if (!nav.id) nav.id = "site-navigation";
  menuButton.setAttribute("aria-controls", nav.id);
  menuBackdrop.className = "menu-backdrop";
  menuBackdrop.type = "button";
  menuBackdrop.tabIndex = -1;
  menuBackdrop.setAttribute("aria-label", "メニューを閉じる");
  document.body.append(menuBackdrop);

  if (menuDebugEnabled) {
    debugPanel = document.createElement("aside");
    debugPanel.className = "menu-debug-panel";
    debugPanel.setAttribute("aria-live", "polite");
    debugPanel.innerHTML = '<strong>MENU DEBUG / close disabled</strong><pre></pre>';
    debugLines = debugPanel.querySelector("pre");
    document.body.append(debugPanel);

    ["touchstart", "touchend", "pointerdown", "pointerup", "click"].forEach((type) => {
      document.addEventListener(type, (event) => menuDebug(`${type} capture`, event), true);
      document.addEventListener(type, (event) => menuDebug(`${type} bubble`, event));
    });

    window.addEventListener("resize", () => {
      menuDebug(`resize width=${window.innerWidth} visual=${window.visualViewport?.width || "-"} nav=${getComputedStyle(nav).display}`);
    });

    window.visualViewport?.addEventListener("resize", () => {
      menuDebug(`visualViewport resize width=${window.visualViewport?.width || "-"} nav=${getComputedStyle(nav).display}`);
    });
  }

  const setMenuOpen = (nextOpen, source = "unknown") => {
    if (menuDebugEnabled && !nextOpen) {
      menuDebug(`menu close attempted source=${source}`);
      menuDebug(`menu close BLOCKED source=${source}`);
      return;
    }

    isMenuOpen = nextOpen;
    nav.classList.toggle("is-open", isMenuOpen);
    menuBackdrop.classList.toggle("is-open", isMenuOpen);
    menuButton.setAttribute("aria-expanded", String(isMenuOpen));
    menuDebug(`${isMenuOpen ? "menu open" : "menu close"} source=${source}`);

    window.clearTimeout(backdropUnlockTimer);
    menuBackdrop.classList.remove("is-interactive");

    if (isMenuOpen) {
      menuCloseLockedUntil = Date.now() + duplicateTapWindow;
      backdropUnlockTimer = window.setTimeout(() => {
        if (isMenuOpen) menuBackdrop.classList.add("is-interactive");
      }, duplicateTapWindow);
    } else {
      menuCloseLockedUntil = 0;
    }
  };

  menuButton.addEventListener("click", (event) => {
    menuDebug("menu button click handler", event);
    event.preventDefault();
    event.stopPropagation();

    const now = Date.now();
    if (now - lastMenuToggleAt < duplicateTapWindow) {
      menuDebug("duplicate click ignored", event);
      return;
    }
    if (isMenuOpen && now < menuCloseLockedUntil) {
      menuDebug("close lock active", event);
      return;
    }

    lastMenuToggleAt = now;
    setMenuOpen(menuDebugEnabled ? true : !isMenuOpen, "menu-button");
  });

  nav.addEventListener("click", (event) => {
    event.stopPropagation();

    if (event.target instanceof Element && event.target.closest("a")) {
      setMenuOpen(false, "nav-link");
    }
  });

  menuBackdrop.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (Date.now() < menuCloseLockedUntil) return;
    setMenuOpen(false, "backdrop");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isMenuOpen) return;

    setMenuOpen(false, "escape-key");
    menuButton.focus();
  });

  if (menuDebugEnabled) {
    new MutationObserver(() => {
      menuDebug(`mutation expanded=${menuButton.getAttribute("aria-expanded")} navClass=${nav.className} navDisplay=${getComputedStyle(nav).display}`);
    }).observe(nav, { attributes: true, attributeFilter: ["class", "style"] });

    new MutationObserver(() => {
      menuDebug(`mutation button expanded=${menuButton.getAttribute("aria-expanded")}`);
    }).observe(menuButton, { attributes: true, attributeFilter: ["aria-expanded", "class", "style"] });

    menuDebug(`debug ready width=${window.innerWidth} visual=${window.visualViewport?.width || "-"}`);
  }

}

document.querySelectorAll(".faq__button").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq__item");
    const expanded = button.getAttribute("aria-expanded") === "true";

    document.querySelectorAll(".faq__item.is-open").forEach((openItem) => {
      if (openItem === item) return;
      openItem.classList.remove("is-open");
      openItem.querySelector(".faq__button")?.setAttribute("aria-expanded", "false");
    });

    button.setAttribute("aria-expanded", String(!expanded));
    item?.classList.toggle("is-open", !expanded);
  });
});

document.querySelectorAll("[data-application-url]").forEach((link) => {
  const applicationUrl = link.dataset.applicationUrl?.trim();
  if (!applicationUrl) return;

  link.href = applicationUrl;
  link.dataset.status = "open";
  link.removeAttribute("aria-disabled");
  link.removeAttribute("tabindex");
});

document.querySelectorAll(".meiden-gallery").forEach((gallery) => {
  const viewport = gallery.querySelector(".meiden-gallery__viewport");
  const rail = gallery.querySelector(".meiden-gallery__rail");
  const firstSet = gallery.querySelector(".meiden-gallery__set");

  if (!viewport || !rail || !firstSet) return;

  const clone = firstSet.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  clone.querySelectorAll("img").forEach((img) => {
    img.loading = "eager";
    img.decoding = "sync";
    img.setAttribute("fetchpriority", "high");
  });
  rail.append(clone);

  let animationFrame = 0;
  let lastTime = 0;
  let resumeTimer = 0;
  let setWidth = 0;
  let pixelsPerSecond = 90;
  const loopSeconds = 160;

  const measureSetWidth = () => {
    const firstSetRect = firstSet.getBoundingClientRect();
    const railStyles = window.getComputedStyle(rail);
    const gap = Number(String(railStyles.columnGap || railStyles.gap || "0").replace("px", "")) || 0;
    setWidth = firstSetRect.width + gap;
    pixelsPerSecond = setWidth / loopSeconds;
  };

  const normalizePosition = () => {
    if (!setWidth) return;
    while (viewport.scrollLeft >= setWidth) {
      viewport.scrollLeft -= setWidth;
    }
  };

  const tick = (time) => {
    if (!setWidth) measureSetWidth();

    if (lastTime) {
      const delta = Math.min(time - lastTime, 64);
      viewport.scrollLeft += (pixelsPerSecond * delta) / 1000;
      normalizePosition();
    }

    lastTime = time;
    animationFrame = window.requestAnimationFrame(tick);
  };

  const start = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    window.cancelAnimationFrame(animationFrame);
    measureSetWidth();
    normalizePosition();
    lastTime = 0;
    animationFrame = window.requestAnimationFrame(tick);
  };

  const pause = () => {
    window.cancelAnimationFrame(animationFrame);
    window.clearTimeout(resumeTimer);
  };

  const resumeSoon = () => {
    pause();
    resumeTimer = window.setTimeout(start, 1800);
  };

  window.addEventListener("resize", () => {
    measureSetWidth();
    normalizePosition();
  });

  viewport.addEventListener("pointerdown", pause, { passive: true });
  viewport.addEventListener("pointerup", resumeSoon, { passive: true });
  viewport.addEventListener("pointercancel", resumeSoon, { passive: true });
  viewport.addEventListener("touchend", resumeSoon, { passive: true });
  viewport.addEventListener("scroll", normalizePosition, { passive: true });

  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start, { once: true });
  }
});

window.addEventListener("load", () => {
  if (!window.location.hash) return;

  const target = document.querySelector(window.location.hash);
  target?.scrollIntoView({ block: "start" });
});

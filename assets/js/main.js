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

const titleRevealTargets = document.querySelectorAll("[data-title-reveal]");

if (titleRevealTargets.length) {
  const reduceTitleMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reduceTitleMotion.matches || !("IntersectionObserver" in window)) {
    titleRevealTargets.forEach((target) => target.classList.add("is-title-visible"));
  } else {
    document.documentElement.classList.add("title-reveal-ready");

    const titleRevealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-title-visible");
          titleRevealObserver.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -16% 0px",
        threshold: 0.26,
      }
    );

    titleRevealTargets.forEach((target) => titleRevealObserver.observe(target));
  }
}

document.querySelectorAll(".meiden-gallery").forEach((gallery) => {
  const viewport = gallery.querySelector(".meiden-gallery__viewport");
  const rail = gallery.querySelector(".meiden-gallery__rail");
  const firstSet = gallery.querySelector(".meiden-gallery__set");

  if (!viewport || !rail || !firstSet) return;

  let animationFrame = 0;
  let lastTime = 0;
  let resumeTimer = 0;
  let setWidth = 0;
  let itemStep = 0;
  let pixelsPerSecond = 90;
  const loopSeconds = 160;

  const measureSetWidth = () => {
    const firstItem = firstSet.firstElementChild;
    const styles = window.getComputedStyle(firstSet);
    const gap = Number(String(styles.columnGap || styles.gap || "0").replace("px", "")) || 0;
    itemStep = firstItem ? firstItem.getBoundingClientRect().width + gap : 0;
    setWidth = firstSet.getBoundingClientRect().width || firstSet.scrollWidth;
    pixelsPerSecond = setWidth / loopSeconds;
  };

  const normalizePosition = () => {
    if (!itemStep) return;

    let guard = 0;
    while (viewport.scrollLeft >= itemStep && guard < firstSet.children.length) {
      const firstItem = firstSet.firstElementChild;
      if (!firstItem) return;
      firstSet.append(firstItem);
      viewport.scrollLeft -= itemStep;
      guard += 1;
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

document.querySelectorAll("[data-lightbox-gallery]").forEach((gallery) => {
  const triggers = Array.from(gallery.querySelectorAll("[data-lightbox-src]"));
  if (!triggers.length) return;

  let currentIndex = 0;
  const lightbox = document.createElement("div");
  lightbox.className = "diary-lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "写真を拡大表示");
  lightbox.innerHTML = `
    <button class="diary-lightbox__button diary-lightbox__close" type="button" aria-label="閉じる">×</button>
    <button class="diary-lightbox__button diary-lightbox__prev" type="button" aria-label="前の写真">‹</button>
    <img class="diary-lightbox__image" src="" alt="">
    <button class="diary-lightbox__button diary-lightbox__next" type="button" aria-label="次の写真">›</button>
  `;

  const image = lightbox.querySelector(".diary-lightbox__image");
  const closeButton = lightbox.querySelector(".diary-lightbox__close");
  const prevButton = lightbox.querySelector(".diary-lightbox__prev");
  const nextButton = lightbox.querySelector(".diary-lightbox__next");
  document.body.append(lightbox);

  const showImage = (index) => {
    currentIndex = (index + triggers.length) % triggers.length;
    const trigger = triggers[currentIndex];
    image.src = trigger.dataset.lightboxSrc;
    image.alt = trigger.dataset.lightboxAlt || trigger.querySelector("img")?.alt || "";
  };

  const openLightbox = (index) => {
    showImage(index);
    lightbox.classList.add("is-open");
    document.documentElement.style.overflow = "hidden";
    closeButton.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    document.documentElement.style.overflow = "";
    triggers[currentIndex]?.focus();
  };

  triggers.forEach((trigger, index) => {
    trigger.addEventListener("click", () => openLightbox(index));
  });

  closeButton.addEventListener("click", closeLightbox);
  prevButton.addEventListener("click", () => showImage(currentIndex - 1));
  nextButton.addEventListener("click", () => showImage(currentIndex + 1));

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") showImage(currentIndex - 1);
    if (event.key === "ArrowRight") showImage(currentIndex + 1);
  });
});

window.addEventListener("load", () => {
  if (!window.location.hash) return;

  const target = document.querySelector(window.location.hash);
  target?.scrollIntoView({ block: "start" });
});

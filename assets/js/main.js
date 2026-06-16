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

document.querySelectorAll(".brand-scroll").forEach((gallery) => {
  const track = gallery.querySelector(".brand-scroll__track");
  const groups = [...gallery.querySelectorAll(".brand-scroll__group")];
  const sourceGroup = groups[0];
  if (!track || !sourceGroup) return;

  groups.slice(1).forEach((group) => group.remove());

  const sourceImages = [...sourceGroup.querySelectorAll("img")];
  const waitForImage = (image) => {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve();

    return new Promise((resolve) => {
      const done = () => resolve();
      image.addEventListener("load", done, { once: true });
      image.addEventListener("error", done, { once: true });
    });
  };

  const activateGallery = () => {
    if (gallery.classList.contains("is-ready")) return;

    const clone = sourceGroup.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("img").forEach((image) => {
      image.alt = "";
      image.removeAttribute("loading");
    });
    track.append(clone);

    const setDistance = () => {
      gallery.style.setProperty("--brand-scroll-distance", `${sourceGroup.getBoundingClientRect().width}px`);
    };

    setDistance();
    window.addEventListener("resize", setDistance);
    window.visualViewport?.addEventListener("resize", setDistance);
    gallery.classList.add("is-ready");
  };

  Promise.all(sourceImages.map(waitForImage)).then(activateGallery);
  window.setTimeout(() => {
    if (!gallery.classList.contains("is-ready")) activateGallery();
  }, 4000);
});

window.addEventListener("load", () => {
  if (!window.location.hash) return;

  const target = document.querySelector(window.location.hash);
  target?.scrollIntoView({ block: "start" });
});

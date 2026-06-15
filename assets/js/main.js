const menuButton = document.querySelector("[data-menu-button]");
const nav = document.querySelector("[data-site-nav]");

document.querySelectorAll('a[href*="results.html"]').forEach((link) => {
  const url = new URL(link.href, window.location.href);
  url.searchParams.set("v", "results-current-2");
  link.href = url.href;
});

if (menuButton && nav) {
  let isMenuOpen = false;
  let lastMenuToggleAt = 0;
  let menuCloseLockedUntil = 0;
  let backdropUnlockTimer = 0;
  const duplicateTapWindow = 1200;
  const menuBackdrop = document.createElement("button");

  if (!nav.id) nav.id = "site-navigation";
  menuButton.setAttribute("aria-controls", nav.id);
  menuBackdrop.className = "menu-backdrop";
  menuBackdrop.type = "button";
  menuBackdrop.tabIndex = -1;
  menuBackdrop.setAttribute("aria-label", "メニューを閉じる");
  document.body.append(menuBackdrop);

  const setMenuOpen = (nextOpen) => {
    isMenuOpen = nextOpen;
    nav.classList.toggle("is-open", isMenuOpen);
    menuBackdrop.classList.toggle("is-open", isMenuOpen);
    menuButton.setAttribute("aria-expanded", String(isMenuOpen));

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
    event.preventDefault();
    event.stopPropagation();

    const now = Date.now();
    if (now - lastMenuToggleAt < duplicateTapWindow) return;
    if (isMenuOpen && now < menuCloseLockedUntil) return;

    lastMenuToggleAt = now;
    setMenuOpen(!isMenuOpen);
  });

  nav.addEventListener("click", (event) => {
    event.stopPropagation();

    if (event.target instanceof Element && event.target.closest("a")) {
      setMenuOpen(false);
    }
  });

  menuBackdrop.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (Date.now() < menuCloseLockedUntil) return;
    setMenuOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isMenuOpen) return;

    setMenuOpen(false);
    menuButton.focus();
  });

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

window.addEventListener("load", () => {
  if (!window.location.hash) return;

  const target = document.querySelector(window.location.hash);
  target?.scrollIntoView({ block: "start" });
});

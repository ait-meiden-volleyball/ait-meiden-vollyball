const menuButton = document.querySelector("[data-menu-button]");
const nav = document.querySelector("[data-site-nav]");

document.querySelectorAll('a[href*="results.html"]').forEach((link) => {
  const url = new URL(link.href, window.location.href);
  url.searchParams.set("v", "results-current-2");
  link.href = url.href;
});

if (menuButton && nav) {
  let isMenuOpen = false;

  const setMenuOpen = (nextOpen) => {
    isMenuOpen = nextOpen;
    nav.classList.toggle("is-open", isMenuOpen);
    menuButton.setAttribute("aria-expanded", String(isMenuOpen));
  };

  menuButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(!isMenuOpen);
  });

  nav.addEventListener("click", (event) => {
    event.stopPropagation();

    if (event.target.closest?.("a")) {
      setMenuOpen(false);
    }
  });

  document.addEventListener("click", (event) => {
    if (!isMenuOpen) return;
    if (menuButton.contains(event.target) || nav.contains(event.target)) return;

    setMenuOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isMenuOpen) return;

    setMenuOpen(false);
    menuButton.focus();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024 && isMenuOpen) {
      setMenuOpen(false);
    }
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

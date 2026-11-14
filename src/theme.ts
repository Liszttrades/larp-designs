/* Light / dark theme. Follows the system until the visitor picks one with the nav toggle;
   the pick is remembered. An inline script in <head> applies a saved pick before first paint. */
const KEY = "larp-theme";
const root = document.documentElement;
const system = matchMedia("(prefers-color-scheme: dark)");

const current = (): "light" | "dark" => {
  const t = root.dataset.theme;
  return t === "light" || t === "dark" ? t : system.matches ? "dark" : "light";
};

function label() {
  document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((b) =>
    b.setAttribute("aria-label", current() === "dark" ? "Switch to light mode" : "Switch to dark mode"),
  );
}

export function initTheme() {
  label();
  system.addEventListener("change", label);
  document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((b) =>
    b.addEventListener("click", () => {
      const next = current() === "dark" ? "light" : "dark";
      // ease colours across the switch instead of flashing (removed once it settles)
      root.classList.add("theme-anim");
      root.dataset.theme = next;
      try { localStorage.setItem(KEY, next); } catch { /* private mode: the choice just isn't remembered */ }
      label();
      window.setTimeout(() => root.classList.remove("theme-anim"), 450);
    }),
  );
}

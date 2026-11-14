import "./style.css";
import { CONTACT } from "./config";
import { initTheme } from "./theme";

initTheme();

// fill the studio email from config so it's set in one place
document.querySelectorAll<HTMLAnchorElement>("[data-email]").forEach((a) => {
  a.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent("Privacy request")}`;
  a.textContent = CONTACT.email;
});

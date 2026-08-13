import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "@fontsource-variable/outfit";
import "./index.css";
import "./styles/GlobalScrollbarRefinement.css";
import App from "./App";
import "./pages/HomeFinalConsolidatedTheme.css";
import { HourlyHomeProductRotation } from "./components/HourlyHomeProductRotation";
import { HomepageSearchInputPolish } from "./components/HomepageSearchInputPolish";
import { HomepageSearchCloseFix } from "./components/HomepageSearchCloseFix";
import { startPaymentNotifications } from "./lib/paymentNotifications";

const savedTheme = localStorage.getItem("theme");
const initialTheme = savedTheme === "light" || savedTheme === "dark"
  ? savedTheme
  : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
document.documentElement.dataset.theme = initialTheme;
document.documentElement.style.colorScheme = initialTheme;

startPaymentNotifications();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <HomepageSearchInputPolish />
    <HomepageSearchCloseFix />
    <HourlyHomeProductRotation />
  </StrictMode>,
);

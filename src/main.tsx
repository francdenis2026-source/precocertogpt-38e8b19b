import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./index.css";
import "./pages/HomePremiumTasteRefinement.css";
import "./styles/ImpeccableFinalPolish.css";
import "./styles/KowalskiInteractionRefinement.css";
import "./pages/HomePremiumLightSurface.css";
import "./pages/HomeFeaturedStability.css";
import "./pages/HomePremiumFooterRefinement.css";
import "./pages/HomePremiumHeaderRefinement.css";
import "./pages/HomeComparisonSpotlight.css";
import "./pages/HomeSearchResultsContrast.css";
import "./styles/GlobalScrollbarRefinement.css";
import "./pages/HomePremiumEditorialV2.css";
import App from "./App";
import { HourlyHomeProductRotation } from "./components/HourlyHomeProductRotation";
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
    <HourlyHomeProductRotation />
  </StrictMode>,
);

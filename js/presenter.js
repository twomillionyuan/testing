import { landingModel } from "./model.js";
import { renderLanding } from "./view.js";

const mount = document.getElementById("app");

if (mount) {
  mount.appendChild(renderLanding(landingModel));
}

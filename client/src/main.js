import React from "react";
import { render } from "react-dom";

import ContactForm from "./components/ContactForm";
import config from "./config";
import RedBox from "redbox-react";

document.addEventListener("DOMContentLoaded", () => {
  let reactElement = document.getElementById("app");

  if (reactElement) {
    if (config.env === "development") {
      try {
        render(<ContactForm />, reactElement);
      } catch (e) {
        render(<RedBox error={e} />, reactElement);
      }
    } else {
      render(<ContactForm />, reactElement);
    }
  }
});

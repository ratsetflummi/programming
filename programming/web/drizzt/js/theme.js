import * as cookies from "./cookies.js";
import { SETTINGS } from "./theme-settings.js";

function applyTheme() {
    SETTINGS.forEach((setting) => {
        const value =
            cookies.getCookie(setting.key) ||
            setting.defaultValue;

        document.documentElement.style.setProperty(
            setting.cssVar,
            value
        );
    });
}

applyTheme();
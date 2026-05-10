import * as cookies from "./cookies.js";
import { SETTINGS } from "./theme-settings.js";

export class Settings {
    init() {
        const saveButton = document.getElementById(
            "save-settings-button"
        );

        if (!saveButton) return;

        this.renderSettings();

        saveButton.addEventListener(
            "click",
            () => this.saveSettings()
        );

        this.prefillSettings();

        this.applySettings();
    }

    renderSettings() {
        const table = document.getElementById("settings-table");

        if (!table) return;

        table.innerHTML = SETTINGS.map(
            (setting) => `
                <tr>
                    <th>${setting.label}:</th>
                    <td>
                        <input
                            type="color"
                            class="setting-input"
                            data-setting="${setting.key}"
                        >
                    </td>
                </tr>
            `
        ).join("");
    }

    getInputs() {
        return document.querySelectorAll(".setting-input");
    }

    getSettingValue(key, defaultValue) {
        return cookies.getCookie(key) || defaultValue;
    }

    prefillSettings() {
        this.getInputs().forEach((input) => {
            const setting = SETTINGS.find(
                (s) => s.key === input.dataset.setting
            );

            if (!setting) return;

            input.value = this.getSettingValue(
                setting.key,
                setting.defaultValue
            );
        });
    }

    saveSettings() {
        this.getInputs().forEach((input) => {
            cookies.setCookie(
                input.dataset.setting,
                input.value
            );
        });

        this.applySettings();

        document.getElementById("sidebar").innerHTML = "";
    }

    applySettings() {
        SETTINGS.forEach((setting) => {
            const value = this.getSettingValue(
                setting.key,
                setting.defaultValue
            );

            document.documentElement.style.setProperty(
                setting.cssVar,
                value
            );
        });
    }
}
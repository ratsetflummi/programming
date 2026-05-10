async function loadPanel(name) {
    const sidebar = document.getElementById("sidebar");
    try {
        console.log("try");
        const response = await fetch(
            "../panels/" + name + ".html"
        );

        const html = await response.text();

        sidebar.innerHTML = html;
        console.log(html);
        console.log(sidebar);
        if (name === "settings") {
            const module = await import("./settings.js");

            const settings = new module.Settings();

            settings.init();
        }

    } catch (err) {
        sidebar.innerHTML = "Panel failed to load.";
        console.error(err);
    }
}
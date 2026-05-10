import * as collapse from "./collapse.js";
async function loadPage(page) {
    const main = document.getElementById("main-content");

    try {
        const res = await fetch(`../pages/${page}.html`);
        const html = await res.text();

        main.innerHTML = html;

        document.getElementById("sidebar").innerHTML = "";
        collapse.collapse();
    } catch (err) {
        main.innerHTML = "<p>Page not found.</p>";
        console.error(err);
    }
}

function navigate(page) {
    history.pushState({ page }, "", `?page=${page}`);
    loadPage(page);
}

window.addEventListener("popstate", (event) => {
    const page = event.state?.page || "home";
    loadPage(page);
});

// initial load
const params = new URLSearchParams(location.search);
loadPage(params.get("page") || "home");

window.navigate = navigate;
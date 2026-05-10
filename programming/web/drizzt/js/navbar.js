async function loadBar() {
    const navbar = document.getElementById("navbar");

    try {
        const response = await fetch(
            "../templates/navbar.html"
        );

        const html = await response.text();

        navbar.innerHTML = html;

    } catch (err) {
        sidebar.innerHTML = "Panel failed to load.";
        console.error(err);
    }
    console.log(document.querySelector("title"));
}
loadBar();
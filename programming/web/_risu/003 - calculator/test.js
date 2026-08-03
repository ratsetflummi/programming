const inputButtons = document.querySelectorAll(".input");
const inputField = document.querySelector("#input");
function main() {
    inputButtons.forEach(input => {
        input.addEventListener("click", () => {
            if (input.classList.contains("equals")) {
                const expr = inputField.value.replaceAll(/\^/g, "**");
                const result = eval(expr);
                inputField.value = result;
            } else if (input.classList.contains("delete")) {
                inputField.value = "";
            } else {
                inputField.value += input.value;
            }
        })
    })
}

main();
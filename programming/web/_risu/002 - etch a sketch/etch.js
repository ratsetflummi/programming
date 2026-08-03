
let isMouseDown = false;
document.addEventListener("mousedown", () => {
    isMouseDown = true;
});
document.addEventListener("mouseup", () => {
    isMouseDown = false;
});
const playField = document.querySelector("#field");
const colorPicker = document.querySelector("#color");
let color = colorPicker.value;
colorPicker.addEventListener("change", () => {
    color = colorPicker.value;
})
const button = document.querySelector("#reset");
button.addEventListener("click", () => {
    fields.forEach(field => {
        field.style.backgroundColor = "";
    })
});
const changeSizeButton = document.querySelector("#apply-size");
changeSizeButton.addEventListener("click", () => {
    drawCanvas();
});

let fields = [];
let width = 10;
let height = 5;

drawCanvas();
document.addEventListener("dragstart", (event) => {
    event.preventDefault();
});

function drawCanvas() {
    playField.innerHTML = "";
    fields = []
    if (document.querySelector("#width").value < 200) {
        width = document.querySelector("#width").value;
    } else {
        width = 200;
    }
    if (document.querySelector("#height").value < 200) {
        height = document.querySelector("#height").value;
    } else {
        height = 200;
    }
    for (let i = 0; i < height; i++) {
        const row = document.createElement("tr");
        playField.appendChild(row);
        for (let i = 0; i < width; i++) {
            const field = document.createElement("td");
            row.appendChild(field);
            field.classList.add("field");
            fields.push(field);
            field.addEventListener("mouseenter", event => {
                if (isMouseDown) {

                    if (event.buttons & 1) {
                        field.style.backgroundColor = color;
                    }

                    if (event.buttons & 2) {
                        field.style.backgroundColor = "";
                    }
                }
            });
            field.addEventListener("click", () => {
                field.style.backgroundColor = color;
            });
            field.addEventListener("contextmenu", event => {
                event.preventDefault();
                field.style.backgroundColor = "";
            });
        }
    }
}
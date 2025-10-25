function test() {
    console.log("utils test");
}

modalInit();
function modalInit(){
    var modal = document.getElementById("myModal");
    var closeButton = modal.querySelector(".close");
    // When the user clicks on <span> (x), close the modal
    closeButton.onclick = function () {
        modal.style.display = "none";
    }
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}

function closeModal(){
    var modal = document.getElementById("myModal");
    modal.style.display = "none";
}

function setModalBackButton(method){
    removeModalBackButton();
    const span = document.getElementById("myModal").querySelector(".back");
    const button = appendButton("←",span,method);
}

function removeModalBackButton(){
    const span = document.getElementById("myModal").querySelector(".back");
    span.innerHTML = "";
}

function openNewForm(formId) {
    removeModalBackButton();
    let form = document.getElementById(formId);
    if (!form) {
        return;
    }
    
    var modal = document.getElementById("myModal");
    let modalContent = document.getElementById("modal-content");
    modal.style.display = "block";
    for (const child of modalContent.children) {
        if (child.classList.contains("close") || child.classList.contains("back")) {
            continue;
        }
        child.style.display = "none";
    }
    form.style.display = "block";
    return form;
}


class Color {
    constructor(color) {
        this.hex;
        this.rgb;
        this.name;
        this.setValues(color);
        this.getContrastColor()
    }
    setValues(color) {
        if (color.includes("#")) {
            this.hex = color;
        } else if (color.includes("rgb")) {
            this.rgb = color;
        } else {
            this.name = color;
        }

        if (this.name) {
            this.rgb = Color.getRgbColorFromName(this.name);
            this.hex = Color.getHexColorFromRgbColor(this.rgb);
        } else if (this.rgb) {
            this.hex = Color.getHexColorFromRgbColor(this.rgb);
        } else if (this.hex) {
            this.rgb = Color.getRgbColorFromHexColor(this.hex);
        }
        console.log(this);
    }
    static getRgbColorFromName(name) {
        let div = document.createElement("div");
        document.querySelector("body").appendChild(div);
        div.style.color = name;
        let rgbColor = window.getComputedStyle(div).color;
        div.remove();
        return rgbColor;
    }
    static getHexColorFromRgbColor(rgb) {
        rgb = rgb.replace("rgb(", "");
        rgb = rgb.replace(")", "");
        rgb = rgb.split(",");
        const hex = [];
        for (const value of rgb) {
            hex.push(parseInt(value).toString(16));
        }
        return "#" + hex.join("");
    }
    static getRgbColorFromHexColor(hex) {
        hex = hex.replace("#", "");
        console.log(hex);
        let rgb = [];
        for (let i = 0; i < hex.length; i += 2) {
            let bit = hex[i] + hex[i + 1];
            console.log(bit);
            bit = parseInt(bit, 16);
            rgb.push(bit);
        }
        return "rgb(" + rgb.join(",") + ")";
    }
    getBrightness() {
        let brigthness = 0;
        let values = this.getRgbValues();
        for (const value of values) {
            brigthness += value / 255;
        }
        return brigthness;
    }
    getContrastColor() {
        if (this.getBrightness() > 0.6) {
            return "black";
        } else {
            return "white";
        }
    }
    getRgbValues() {
        let rgb = this.rgb.replace("rgb(", "").replace(")", "").split(",");
        let values = [];
        for (const value of rgb) {
            values.push(parseInt(value));
        }
        return values;
    }
    getHex() {
        return this.hex;
    }
}

function makeButton(text,method=null){
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = text;
    if(method){
        button.addEventListener("click",method);
    }
    return button;
}

function appendButton(text,parent,method=null){
    const button = makeButton(text,method);
    parent.appendChild(button);
    return button;
}

export {
    test,
    Color,
    openNewForm,
    closeModal,
    makeButton,
    appendButton,
    setModalBackButton,
    removeModalBackButton,
}
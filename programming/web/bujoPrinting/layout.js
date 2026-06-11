const inputSection = document.getElementById("input");
const button = document.getElementById("button");
const emptyButton = document.getElementById("empty-button");
const outputSection = document.getElementById("output");

for(let i = 1; i <= 16; i++){
    const input = document.createElement("input");
    input.type = "text";
    input.id = "page-" + i;
    const div = document.createElement("div");
    const label = document.createElement("span");
    label.innerText = i + ": ";
    inputSection.appendChild(div);
    div.appendChild(label);
    div.appendChild(input);
}


button.addEventListener("click",()=>{
    outputSection.innerHTML = "";
    const inputs = {};
    for(let i = 1; i <= 16; i++){
        const input = inputSection.querySelector("#page-"+i);
        inputs[i] = input.value;
    }
    
    for(let i = 0; i <= 7; i++){
        const div = document.createElement("div");
        console.log(i,16-i);
        if(i % 2 == 0){
            div.innerText = i+1 + ": " + inputs[16-i] + " - " + inputs[i+1];
        } else {
            div.innerText = i+1 + ": " + inputs[i+1] + " - " + inputs[16-i];
        }
        outputSection.appendChild(div);
        if(i % 2 != 0){
            outputSection.appendChild(document.createElement("br"));
        }
    }
})

emptyButton.addEventListener("click",()=>{
    for(let i = 1; i <= 16; i++){
        const input = inputSection.querySelector("#page-"+i);
        input.value = "";
    }
    
})
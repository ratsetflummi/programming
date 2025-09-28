import * as utils from "./utils.js";

setButton();

class Word {
    constructor(response_data){
        Object.assign(this,response_data);
        this.div = document.createElement("div");
    }
    draw(parent){
        this.drawMeanings();
        //this.drawLicense();
        parent.appendChild(this.div);
    };
    drawLicense(){
        let license = document.createElement("div");
        license.innerText = this.license.name;
        license.classList.add("small-print");
        this.div.appendChild(license);
    };
    drawMeanings(){
        this.meanings.forEach(meaning=>{
            this.div.appendChild(drawMeaning(meaning));
        });
        function drawMeaning(meaning){
            let definitions = "";
            meaning.definitions.forEach(definition=>{
                console.log(definition);
                definitions += "- " + definition["definition"] + "<br>";
            });
            return new Section(2,meaning["partOfSpeech"],definitions).div;
        }
    };
}

class Section {
    constructor(headingLevel,heading,content){
        this.headingLevel = headingLevel;
        this.heading = document.createElement(`h${headingLevel}`);
        this.heading.innerHTML = heading;
        this.content = document.createElement("div");
        this.content.innerHTML = content;
        this.div = document.createElement("div");
        this.div.appendChild(this.heading);
        this.div.appendChild(this.content);
    }
}

class WordList {
    constructor(response_data){
        this.definitions = [];
        this.word = response_data[0].word;
        this.parent = document.querySelector("#output");
        response_data.forEach(data=>{
            this.definitions.push(new Word(data));
        });
    }
    draw(){
        this.parent.innerHTML = "";
        console.log("wipe");
        let header = document.createElement("h1");
        header.innerText = this.word;
        this.parent.appendChild(header);
        this.definitions.forEach(definition=>{
            console.log("drawing");
            definition.draw(this.parent);
        })
    }
}


function setButton(){
    setWordInput();

    function setWordInput(){
        let button = document.querySelector("#check_word");
        let input = document.querySelector("#word_query");
        button.addEventListener("click",searchWords);
        input.addEventListener("keyup",event=>{
            if(event.key == "Enter"){
                searchWords();
            }
        })
        function searchWords(){
            let value = input.value;
            input.value = "";
            getWords(value);
        }
    }
}

async function getWords(input){
    let response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${input}`);
    if(response.ok){
        let response_data = await response.json();
        displayWords(response_data);
    } else {
        document.querySelector("#output").innerHTML = "No match found.";
    }
}

function displayWords(response_data){
    let wordList = new WordList(response_data);
    console.log(response_data,wordList);
    wordList.draw();
}


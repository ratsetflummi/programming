import * as utils from "./utils.js";
utils.test();
let color = new utils.Color("lightblue");
async function init() {
    const fileData = await (await fetch(`../static/data/script.txt`)).json();
    console.log(fileData);
    //gameData.load(fileData);
    console.log(gameData);
    //gameData.characters[0].speak("Abc")
    //download(JSON.stringify(gameData),"script.txt","text/plain");

}

function save(gameData) {
    // Create a shallow copy without devTools
    const dataToSave = { ...gameData };
    delete dataToSave.devTools;
    download(JSON.stringify(dataToSave), "script.txt", "text/plain");
}
class GameData {
    constructor() {
        this.characters = [];
        this.chapters = [];
        this.chapterCount = 0;
        this.devTools = new DevTools(this);
    }
    load(data) {
        Object.assign(this, data);
        this.characters = [];
        for(const character of data.characters){
            this.characters.push(Character.loadCharacter(character));
        }
        this.chapters = [];
        console.log(data);
        console.log(data.chapters);
        for(const chapter of data.chapters){
            this.chapters.push(Chapter.loadChapter(chapter));
        }
        this.devTools = new DevTools(this);
    }
    addCharacter() {
        const character = Character.addCharacter();
        if (this.characters.filter(c => c.name == character.name).length == 0) {
            this.characters.push(character);
        }
        return character;
    }
    addChapter() {
        const chapter = Chapter.addChapter(this.chapterCount);
        this.chapterCount++;
        this.chapters.push(chapter);
        return chapter;
    }
    getCharacters(){
        return this.characters;
    }
    getChapters(){
        return this.chapters;
    }
}

class DevTools {
    constructor(gameData) {
        this.gameData = gameData;
        this.selectedChapter;
        this.selectedScene;
        this.selectedFrame;
        console.log(this.gameData);
        this.toolbar = document.getElementById("dev-tool-sidebar");
        this.toolbar.innerHTML = "";
        this.sceneDiv = document.createElement("div");
        this.scenePreview = document.createElement("div");
        this.sceneAddButton = document.createElement("button");
        this.sceneSelect = document.createElement("select");
        this.chapterDiv = document.createElement("div");
        this.chapterPreview = document.createElement("div");
        this.chapterAddButton = document.createElement("button");
        this.chapterSelect = document.createElement("select");
        this.characterDiv = document.createElement("div");
        this.characterPreview = document.createElement("div");
        this.characterAddButton = document.createElement("button");
        this.characterSelect = document.createElement("select");
        this.frameDiv = document.createElement("div");
        this.framePreview = document.createElement("div");
        this.frameAddButton = document.createElement("button");
        this.frameSelect = document.createElement("select");


        setSaveAndLoad(this.gameData);
        
        this.toolbar.appendChild(this.characterDiv);
        this.toolbar.appendChild(this.chapterDiv);
        this.toolbar.appendChild(this.sceneDiv);
        this.toolbar.appendChild(this.frameDiv);

        this.setCharacterFunctions();
        this.setChapterFunctions();
        if(this.gameData.getChapters().length > 0){
            this.setSceneFunctions();
        }
    }


    setFrameFunctions(){
        this.frameDiv.innerHTML = "";
        this.framePreview.id = "frame-preview";
        this.frameForm = document.getElementById("add-frame-form");
        this.frameSaveButton = this.frameForm.querySelector(".save");
        this.frameAddButton.innerText = "New Frame";
        this.frameDiv.appendChild(this.frameAddButton);
        this.frameAddButton.addEventListener("click", this.openFrameForm);

        this.frameDiv.appendChild(this.frameSelect);
        this.frameDiv.appendChild(this.framePreview);
        for(const frame of this.selectedChapter.getFrames()){
            this.addFrameOption(frame);
        }
        this.frameSaveButton.addEventListener("click",()=>this.addFrame())
    }
    setSceneFunctions(){
        this.sceneDiv.innerHTML = "";
        this.scenePreview.id = "scene-preview";
        this.sceneForm = document.getElementById("add-scene-form");
        this.sceneSaveButton = this.sceneForm.querySelector(".save");
        this.sceneAddButton.innerText = "New Scene";
        this.sceneDiv.appendChild(this.sceneAddButton);
        this.sceneAddButton.addEventListener("click", this.openSceneForm);

        this.sceneDiv.appendChild(this.sceneSelect);
        this.sceneDiv.appendChild(this.scenePreview);
        for(const scene of this.selectedChapter.getScenes()){
            this.addSceneOption(scene);
        }
        this.sceneSaveButton.addEventListener("click",()=>this.addScene())
    }


    setChapterFunctions(){
        this.chapterDiv.innerHTML = "";
        this.chapterPreview.id = "chapter-preview";
        this.chapterForm = document.getElementById("add-chapter-form");
        this.chapterSaveButton = this.chapterForm.querySelector(".save");
        this.chapterAddButton.innerText = "New Chapter";
        this.chapterDiv.appendChild(this.chapterAddButton);
        this.chapterAddButton.addEventListener("click", this.openChapterForm);

        this.chapterDiv.appendChild(this.chapterSelect);
        this.chapterDiv.appendChild(this.chapterPreview);
        for(const chapter of this.gameData.getChapters()){
            this.addChapterOption(chapter);
            this.selectedChapter = chapter;
        }
        this.chapterSaveButton.addEventListener("click",()=>this.addChapter())
    }

    setCharacterFunctions(){
        this.characterDiv.innerHTML = "";
        this.characterPreview.id = "character-preview";
        this.characterForm = document.getElementById("add-character-form");
        this.characterSaveButton = this.characterForm.querySelector(".save");
        this.characterAddButton.innerText = "New Character";
        this.characterDiv.appendChild(this.characterAddButton);
        this.characterAddButton.addEventListener("click", this.openCharacterForm);

        this.characterDiv.appendChild(this.characterSelect);
        this.characterDiv.appendChild(this.characterPreview);
        for(const character of this.gameData.getCharacters()){
            this.addCharacterOption(character);
        }
        this.characterSaveButton.addEventListener("click",()=>this.addCharacter())
    }

    addCharacterOption(character){
        const option = document.createElement("option");
        option.addEventListener("click",()=>this.showCharacterPreview(character));
        option.innerText = character.getName();
        this.characterSelect.appendChild(option);
    }
    addChapterOption(chapter){
        const option = document.createElement("option");
        option.addEventListener("click",()=>this.showChapterPreview(chapter));
        option.innerText = chapter.getName();
        this.chapterSelect.appendChild(option);
        this.showChapterPreview(chapter);
    }
    addSceneOption(scene){
        const option = document.createElement("option");
        option.addEventListener("click",()=>this.showScenePreview(scene));
        option.innerText = scene.getName();
        this.sceneSelect.appendChild(option);
    }
    openSceneForm(){
        utils.openNewForm("add-scene-form");
    }

    addScene(){
        utils.closeModal();
        this.addSceneOption(this.selectedChapter.addScene());
    }

    showScenePreview(scene){
        this.selectedScene = scene;
        console.log("get a scene select here for ",scene);
    }



    addFrameOption(frame){
        const option = document.createElement("option");
        option.addEventListener("click",()=>this.showFramePreview(frame));
        option.innerText = frame.getName();
        this.frameSelect.appendChild(option);
    }
    openFrameForm(){
        utils.openNewForm("add-frame-form");
    }

    addFrame(){
        utils.closeModal();
        this.addFrameOption(this.selectedChapter.addFrame());
    }

    showFramePreview(frame){
        this.selectedFrame = frame;
        console.log("get a frame select here for ",frame);
    }

    openChapterForm(){
        utils.openNewForm("add-chapter-form");
    }

    openCharacterForm(){
        utils.openNewForm("add-character-form");
    }
    addCharacter(){
        utils.closeModal();
        this.addCharacterOption(this.gameData.addCharacter());
    }
    addChapter(){
        utils.closeModal();
        this.addChapterOption(this.gameData.addChapter());
    }

    showCharacterPreview(character){
        character.showCharacter(this.characterPreview);
    }

    showChapterPreview(chapter){
        this.selectedChapter = chapter;
        this.setSceneFunctions();
        console.log("get a scene select here for ",chapter);
    }

}

class Character {
    constructor(name, color = null, image = null) {
        this.name = name;
        this.images = [];
        this.image = image;
        this.color = new utils.Color(color) || new utils.Color("black");
        this.addImage(image || "defaultCharacter.png");
        this.showCharacter(imageField);
    }
    static addCharacter(){
        const form = document.getElementById("add-character-form");
        const name = form.querySelector("#name").value;
        const color = form.querySelector("#color").value;
        const image = form.querySelector("#image").value;
        return new Character(name,color,image);
    }
    static loadCharacter(character){
        const newCharacter = new Character(character.name,character.color.hex,character.image);
        newCharacter.images = character.images;
        return newCharacter;
    }
    showCharacter(parent) {
        parent.appendChild(this.images[0]["image"]);
    }
    addImage(image) {
        let img = document.createElement("img");
        img.src = `../static/img/${image}`;
        this.images.push({ "name": image.split(".")[0], "image": img });
    }
    speak(text) {
        speakerName.innerText = this.name;
        dialogueField.innerText = text;
        textField.style.color = this.color.getHex();
        textField.style.backgroundColor = this.color.getContrastColor();
    }
    getName(){return this.name;}

}


class Chapter{
    constructor(name,number){
        this.scenes = [];
        this.name = name;
        this.number = number;
        this.sceneCount = 0;
    }
    static addChapter(number){
        const form = document.getElementById("add-chapter-form");
        const name = form.querySelector("#name").value;
        return new Chapter(name,number);
    }
    static loadChapter(chapter){
        console.log(chapter);
        const newChapter = new Chapter(chapter.name,chapter.number);
        newChapter.scenes = [];
        for(const scene of chapter.scenes){
            newChapter.scenes.push(Scene.loadScene(scene));
        }
        return newChapter;
    }
    addScene() {
        const scene = Scene.addScene(this.sceneCount);
        this.sceneCount++;
        this.scenes.push(scene);
        return scene;
    }
    getScenes(){
        return this.scenes;
    }
    getName(){return this.name;}
}

class Scene{
    constructor(name,number){
        this.frames = [];
        this.name = name;
        this.number = number;
        this.frameCount
    }
    static addScene(number){
        const form = document.getElementById("add-scene-form");
        const name = form.querySelector("#name").value;
        return new Scene(name,number);
    }
    static loadScene(scene){
        console.log(scene);
        const newScene = new Scene(scene.name,scene.number);
        newScene.frames = [];
        for(const frame of scene.frames){
            newScene.frames.push(Frame.loadFrame(frame));
        }
        return newScene;
    }
    addFrame() {
        const frame = Frame.addFrame(this.frameCount);
        this.frameCount++;
        this.frames.push(frame);
        return frame;
    }
    getFrames(){
        return this.frames;
    }
    getName(){return this.name;}
}


class Frame{
    constructor(number){
        this.number = number;
        this.frameCount = 0;
    }
    getName(){return this.number;}
}

class Choice extends Frame{
    constructor(number){
        super(number);
    }
    static addFrame(number){
        return new Choice(number);
    }
    static loadFrame(frame){
        return new Choice(frame.number);
    }
}

class Dialogue extends Frame{
    constructor(number){
        super(number);
    }
    static addFrame(number){
        return new Dialogue(number);
    }
    static loadFrame(frame){
        return new Dialogue(frame.number);
    }
}


function setSaveAndLoad(gameData){
    const exportButton = document.createElement("button");
    const importButton = document.createElement("button");
    exportButton.innerText = "Export";
    importButton.innerText = "Import";
    exportButton.addEventListener("click",()=>save(gameData));
    importButton.addEventListener("click",()=>utils.openNewForm("import-form"));
    const importForm = document.getElementById("import-form");
    importForm.querySelector(".save").addEventListener("click",()=>{
        let fr = new FileReader();
        fr.onload = function () {
            gameData.load(JSON.parse(fr.result));
        }
        fr.readAsText(importForm.querySelector("#file").files[0]);
    })

    // importForm.querySelector(".save").addEventListener("click",async ()=>{
    //     let file = importForm.querySelector("#file").value;
    //     let reader = new FileReader();

    //     reader.onload = function (event) {
    //         let arrayBuffer = event.target.result;
    //         let array = new Uint8Array(arrayBuffer);

    //         let fileSize = arrayBuffer.byteLength;
    //         let bytes = [];
    //         for (let i = 0; i < Math.min(20, fileSize); i++) {
    //             bytes.push(array[i]);
    //         }
    //         console.log(bytes);
    //         // document
    //         //     .getElementById('fileContents')
    //         //     .textContent =
    //         //     'First 20 bytes of file as ArrayBuffer: '
    //         //     + bytes.join(', ');
    //         // console.log('ArrayBuffer:', arrayBuffer);
    //     };

    //     reader.readAsArrayBuffer(file);
    //     let data = await (await fetch(importForm.querySelector("#file").value)).json();
    //     console.log(data);
    //     console.log(importForm.querySelector("#file").value);
    // })
    devToolSideBar.appendChild(exportButton);
    devToolSideBar.appendChild(importButton);
}

function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

const devToolSideBar = document.getElementById("dev-tool-sidebar");
const imageField = document.getElementById("image-field");
const playerChoiceField = document.getElementById("player-choice");
const textField = document.getElementById("text-field");
const speakerName = document.getElementById("speaker-name");
const dialogueField = document.getElementById("dialogue-field");
const gameData = new GameData();
init();
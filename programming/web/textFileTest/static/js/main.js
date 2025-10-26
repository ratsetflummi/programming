import * as utils from "./utils.js";
utils.test();
let color = new utils.Color("lightblue");
async function init() {
    const fileData = await (await fetch(`../static/data/script.txt`)).json();
    //gameData.load(fileData);
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
        this.makeBlank();
    }
    makeBlank(){
        this.characters = [];
        this.chapters = [];
        this.flags = [];
        this.chapterCount = 0;
        this.devTools = new DevTools(this);
    }
    start() {
        if (this.chapters.length > 0) {
            this.chapters[0].runChapter();
        }
    }
    load(data) {
        this.makeBlank();
        Object.assign(this, data);
        this.characters = [];
        for (const character of data.characters) {
            this.characters.push(Character.loadCharacter(character));
        }
        this.chapters = [];
        for (const chapter of data.chapters) {
            this.chapters.push(Chapter.loadChapter(chapter));
        }
        this.flags = [];
        for (const flag of data.flags) {
            this.flags.push(Flag.loadFlag(flag));
        }
        this.devTools = new DevTools(this);
        console.log(this);
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
    addFlag(){
        const flag = Flag.addFlag();
        this.flags.push(flag);
        console.log(this.flags);
        return flag;
    }
    getCharacterByName(name) {
        return this.characters.find(c => c.name == name);
    }
    getChapterByName(name) {
        return this.chapters.find(c => c.name == name);
    }
    getFlagByName(name){
        return this.flags.find(c => c.name == name);
    }
    getCharacterById(id) {
        return this.characters.find(c => c.id == id);
    }
    getChapterById(id) {
        return this.chapters.find(c => c.id == id);
    }
    getFlagById(id){
        return this.flags.find(c => c.id == id);
    }
    getCharacters() {
        return this.characters;
    }
    getChapters() {
        return this.chapters;
    }
    getFlags(){
        return this.flags;
    }
}

class DevTools {
    constructor(gameData) {
        this.gameData = gameData;
        this.selectedChapter;
        this.selectedScene;
        this.selectedFrame;
        this.toolbar = document.getElementById("dev-tool-sidebar");
        this.toolbar.innerHTML = "";
        this.sceneDiv = document.createElement("div");
        this.sceneDiv.classList.add("preview-div");
        this.scenePreview = document.createElement("div");
        this.sceneSelect = document.createElement("select");
        this.chapterDiv = document.createElement("div");
        this.chapterDiv.classList.add("preview-div");
        this.chapterPreview = document.createElement("div");
        this.chapterSelect = document.createElement("select");
        this.characterDiv = document.createElement("div");
        this.characterDiv.classList.add("preview-div");
        this.characterPreview = document.createElement("div");
        this.characterSelect = document.createElement("select");
        this.frameDiv = document.createElement("div");
        this.frameDiv.classList.add("preview-div");
        this.framePreview = document.createElement("div");
        this.frameAddButton = document.createElement("button");
        this.frameSelect = document.createElement("select");
        this.flagDiv = document.createElement("div");
        this.flagDiv.classList.add("preview-div");
        this.flagPreview = document.createElement("div");
        this.flagAddButton = document.createElement("button");
        this.flagSelect = document.createElement("select");



        setSaveAndLoad(this.gameData);

        this.toolbar.appendChild(this.flagDiv);
        this.toolbar.appendChild(this.characterDiv);
        this.toolbar.appendChild(this.chapterDiv);
        this.toolbar.appendChild(this.sceneDiv);
        this.toolbar.appendChild(this.frameDiv);

        this.setFlagFunctions();
        this.setCharacterFunctions();
        this.setChapterFunctions();
        if (this.gameData.getChapters().length > 0) {
            this.setSceneFunctions();
        }
    }


    setFrameFunctions() {
        this.frameDiv.innerHTML = "";
        this.frameAddButton = utils.appendButton("New Frame", this.frameDiv, () => { this.openFrameForm() });

        this.frameDiv.appendChild(this.frameSelect);
        this.frameDiv.appendChild(this.framePreview);
        this.frameSelect.innerHTML = "";
        for (const frame of this.selectedScene.getFrames()) {
            this.addFrameOption(frame);
        }
    }
    setSceneFunctions() {
        this.sceneDiv.innerHTML = "";
        this.sceneAddButton = utils.appendButton("New Scene", this.sceneDiv, () => this.openSceneForm());
        this.sceneSelect.innerHTML = "";
        this.scenePreview.id = "scene-preview";
        this.sceneForm = document.getElementById("add-scene-form");
        this.sceneSaveButton = this.sceneForm.querySelector(".save");

        this.sceneDiv.appendChild(this.sceneSelect);
        this.sceneDiv.appendChild(this.scenePreview);
        for (const scene of this.selectedChapter.getScenes()) {
            this.addSceneOption(scene);
        }
        this.sceneSaveButton.addEventListener("click", () => this.addScene())
    }

    setFlagFunctions() {
        this.flagDiv.innerHTML = "";
        this.flagAddButton = utils.appendButton("New Flag", this.flagDiv, ()=>{this.openFlagForm()});

        this.flagDiv.appendChild(this.flagSelect);
        this.flagDiv.appendChild(this.flagPreview);
        for (const flag of this.gameData.getFlags()) {
            this.addFlagOption(flag);
            this.selectedFlag = flag;
        }
    }

    
    addFlagOption(flag) {
        const option = document.createElement("option");
        option.addEventListener("click", () => { this.showFlagPreview(flag) });
        option.innerText = flag.getName();
        option.value = flag.getId();
        this.flagSelect.appendChild(option);
    }

    showFlagPreview(flag) {
        this.flagPreview.innerHTML = "";
        flag.showFlag(this.flagPreview);
    }

    openFlagForm(){
        this.flagForm = utils.openNewForm("form");
        this.flagForm.innerHTML = `
            <h3>New Flag</h3>
            <p>
                <label for="name">Name</label>
                <input id="name" type="text">
                <label for="type">Type</label>
                <select id="type">
                    <option value="number">Number</option>
                    <option value="string">Text</option>
                </select>
                <label for="startValue">Start Value</label>
                <input id="startValue" type="number">
            </p>
        `
        const typeToggle = this.flagForm.querySelector("#type");
        typeToggle.addEventListener("change",()=>{
            let startValueInput = this.flagForm.querySelector("#startValue");
            const startValueLabel = this.flagForm.querySelector("[for='startValue']");
            startValueInput.remove();
            startValueInput = document.createElement("input");
            startValueLabel.after(startValueInput);
            startValueInput.id = "startValue";
            if(typeToggle.value == "number"){
                startValueInput.type = "number";
            } else {
                startValueInput.type = "text";
            }
        })

        this.flagSaveButton = utils.appendButton("Save",this.flagForm,() => {this.addFlag();});
    }

    setChapterFunctions() {
        this.chapterDiv.innerHTML = "";
        this.chapterAddButton = utils.appendButton("New Chapter", this.chapterDiv, this.openChapterForm);
        this.chapterForm = document.getElementById("add-chapter-form");
        this.chapterSaveButton = this.chapterForm.querySelector(".save");

        this.chapterDiv.appendChild(this.chapterSelect);
        this.chapterDiv.appendChild(this.chapterPreview);
        for (const chapter of this.gameData.getChapters()) {
            this.addChapterOption(chapter);
            this.selectedChapter = chapter;
        }
        this.chapterSaveButton.addEventListener("click", () => this.addChapter())
    }

    setCharacterFunctions() {
        this.characterDiv.innerHTML = "";
        this.characterAddButton = utils.appendButton("New Character", this.characterDiv, () => this.openCharacterForm());

        this.characterDiv.appendChild(this.characterSelect);
        this.characterDiv.appendChild(this.characterPreview);
        for (const character of this.gameData.getCharacters()) {
            this.addCharacterOption(character);
        }
    }

    resetBelowChapter() {
        this.sceneDiv.innerHTML = "";
        this.frameDiv.innerHTML = "";
    }

    addCharacterOption(character) {
        const option = document.createElement("option");
        option.addEventListener("click", () => { this.showCharacterPreview(character) });
        option.innerText = character.getName();
        option.value = character.getId();
        this.characterSelect.appendChild(option);
    }
    addChapterOption(chapter) {
        const option = document.createElement("option");
        option.addEventListener("click", () => { this.showChapterPreview(chapter) });
        option.innerText = chapter.getName();
        option.value = chapter.getId();
        this.chapterSelect.appendChild(option);
        this.showChapterPreview(chapter);
    }
    addSceneOption(scene) {
        const option = document.createElement("option");
        option.addEventListener("click", () => { this.showScenePreview(scene) });
        option.innerText = scene.getName();
        option.value = scene.getId();
        this.sceneSelect.appendChild(option);
    }
    addFlagOption(flag) {
        const option = document.createElement("option");
        option.addEventListener("click", () => { this.showFlagPreview(flag) });
        option.innerText = flag.getName();
        option.value = flag.getId();
        this.flagSelect.appendChild(option);
    }
    openSceneForm() {
        utils.openNewForm("add-scene-form");
    }

    addScene() {
        utils.closeModal();
        this.addSceneOption(this.selectedChapter.addScene());
    }

    addFlag(){
        utils.closeModal();
        this.addFlagOption(this.gameData.addFlag());
    }

    showScenePreview(scene) {
        this.selectedScene = scene;
        this.setFrameFunctions();
    }

    addFrameOption(frame) {
        const option = document.createElement("option");
        option.addEventListener("click", () => this.showFramePreview(frame));
        option.innerText = frame.getName();
        option.value = frame.getId();
        this.frameSelect.appendChild(option);
    }
    openFrameForm() {
        this.frameForm = utils.openNewForm("form");
        this.frameForm.innerHTML = `
            <h3>New Frame</h3>
            <p>
                <label for="name">Name</label>
                <input id="name" type="text">
                <label for="type">Type</label>
                <select id="type">
                    <option value="choice">Choice</option>
                    <option value="dialogue">Dialogue</option>
                </select>
            </p>
        `
        this.frameSaveButton = utils.appendButton("Save",this.frameForm, () => { this.addFrame() });
    }

    addFrame() {
        utils.closeModal();
        const frame = this.selectedScene.addFrame();
        this.addFrameOption(frame);
        this.selectedFrame = frame;
        frame.openEditForm();
    }

    showFramePreview(frame) {
        this.selectedFrame = frame;
        this.framePreview.innerHTML = "";
        frame.showFramePreview(this.framePreview);
        let editButton = utils.appendButton("Edit", this.framePreview, () => {
            frame.openEditForm();
        })
    }

    openChapterForm() {
        utils.openNewForm("add-chapter-form");
    }

    openCharacterForm() {
        this.characterForm = utils.openNewForm("form");

        this.characterForm.innerHTML = `
                <h3>New Character</h3>
                <p>
                    <label for="name">Name</label>
                    <input id="name" type="text">
                </p>
                <p>
                    <label for="color">Color</label>
                    <input id="color" type="color" value="#acacac">
                </p>
                <p>
                    <label for="image">Image Name (with extension)</label>
                    <input id="image" type="text" placeholder="sample-image.png">
                </p>
        `

        this.characterSaveButton = utils.appendButton("Save", this.characterForm, () => { this.addCharacter() });
    }
    addCharacter() {
        utils.closeModal();
        this.addCharacterOption(this.gameData.addCharacter());
    }
    addChapter() {
        utils.closeModal();
        this.addChapterOption(this.gameData.addChapter());
    }

    showCharacterPreview(character) {
        this.characterPreview.innerHTML = "";
        character.showCharacter(this.characterPreview);
    }

    showChapterPreview(chapter) {
        this.resetBelowChapter();
        this.selectedChapter = chapter;
        this.setSceneFunctions();
    }

}

class Character {
    constructor(name, color = null, image = null) {
        this.id = utils.generateId();
        this.name = name;
        this.images = [];
        this.image = image;
        this.color = new utils.Color(color) || new utils.Color("black");
        this.addImage(image || "defaultCharacter.png");
        this.showCharacter(imageField);
    }
    static addCharacter() {
        const form = document.getElementById("form");
        const name = form.querySelector("#name").value;
        const color = form.querySelector("#color").value;
        const image = form.querySelector("#image").value;
        return new Character(name, color, image);
    }
    static loadCharacter(character) {
        const newCharacter = new Character(character.name, character.color.hex, character.image);
        newCharacter.id = character.id;
        newCharacter.images = character.images;
        return newCharacter;
    }
    showCharacter(parent) {
        let img = document.createElement("img");
        img.src = this.images[0].src;

        parent.appendChild(img);
    }
    addImage(image) {
        this.images.push({ "name": image.split(".")[0], "src": `../static/img/${image}` });
    }
    speak(text) {
        speakerName.innerText = this.name;
        dialogueField.innerText = text;
        textField.style.color = this.color.getHex();
        textField.style.backgroundColor = this.color.getContrastColor();
    }
    getName() { return this.name; }
    getId() { return this.id; }

}

class Flag {
    constructor(name, startValue = 0, type = "number") {
        this.id = utils.generateId();
        this.name = name;
        this.type = type;
        this.value = startValue;
        if(type == "number" && !parseInt(startValue)){
            this.value = 0;
        }
    }
    static addFlag() {
        const form = document.getElementById("form");
        const name = form.querySelector("#name").value;
        const type = form.querySelector("#type").value;
        const startValue = form.querySelector("#startValue").value;
        return new Flag(name, startValue, type);
    }
    static loadFlag(flag) {
        const newFlag = new Flag(flag.name, flag.value, flag.type);
        newFlag.id = flag.id;
        return newFlag;
    }
    updateValue(value){
        if(this.type == "number"){
            console.log(`${this.value} + ${value}`);
        } else {
            console.log(`${this.value} = ${value}`);
        }
    }
    showFlag(parent){
        const div = document.createElement("div");
        div.innerText = `
            ${this.name}: ${this.value}
        `;
        parent.appendChild(div);
    }
    getName() { return this.name; }
    getId() { return this.id; }
}

class Chapter {
    constructor(name) {
        this.scenes = [];
        this.name = name;
        this.id = utils.generateId();
        this.sceneCount = 0;
    }
    static addChapter() {
        const form = document.getElementById("add-chapter-form");
        const name = form.querySelector("#name").value;
        return new Chapter(name);
    }
    static loadChapter(chapter) {
        const newChapter = new Chapter(chapter.name);
        newChapter.scenes = [];
        newChapter.id = chapter.id;
        for (const scene of chapter.scenes) {
            newChapter.scenes.push(Scene.loadScene(scene));
        }
        return newChapter;
    }
    runChapter() {
        if (this.scenes.length > 0) {
            this.scenes[0].runScene();
        }
    }
    addScene() {
        const scene = Scene.addScene(this.sceneCount);
        this.sceneCount++;
        this.scenes.push(scene);
        return scene;
    }


    getSceneById(id) {
        return this.scenes.find(c => c.id == id);
    }
    getSceneByName(name) {
        return this.scenes.find(c => c.name == name);
    }
    getScenes() {
        return this.scenes;
    }
    getName() { return this.name; }
    getId() { return this.id; }
}

class Scene {
    constructor(name) {
        this.frames = [];
        this.name = name;
        this.id = utils.generateId();
        this.backgroundImage;
        this.frameCount = 0;
    }
    static addScene() {
        const form = document.getElementById("add-scene-form");
        const name = form.querySelector("#name").value;
        return new Scene(name);
    }
    static loadScene(scene) {
        const newScene = new Scene(scene.name);
        newScene.frameCount = scene.frameCount;
        newScene.frames = [];
        newScene.id = scene.id;
        for (const frame of scene.frames) {
            if (frame.type == "choice") {
                newScene.frames.push(Choice.loadFrame(frame));
            } else if (frame.type == "dialogue") {
                newScene.frames.push(Dialogue.loadFrame(frame));
            }
        }
        return newScene;
    }
    runScene() {
        if (this.frames.length > 0) {
            this.selectedFrame = this.frames[0];
            this.selectedFrame.displayFrame();
        }
    }
    addFrame() {
        const form = document.getElementById("form");
        const name = form.querySelector("#name").value;
        const type = form.querySelector("#type").value;
        let frame;
        if (type == "choice") {
            frame = Choice.addFrame(name,this.frameCount);
        } else if (type == "dialogue") {
            frame = Dialogue.addFrame(name,this.frameCount);
        }

        this.frameCount++;
        this.frames.push(frame);
        console.log(this);
        return frame;
    }
    setBackgroundImage(image) {
        this.backgroundImage = image;
    }
    getFrameByName(name){
        return this.frames.find(c => c.name == name);
    }
    getFrameById(id){
        return this.frames.find(c => c.id == id);
    }
    getFrames() {
        return this.frames;
    }
    getName() { return this.name; }
    getId() { return this.id; }
}


class Frame {
    constructor(name) {
        this.name = name;
        this.id = utils.generateId();
        this.jumpDestination;
    }
    openEditTextForm() {
        const form = utils.openNewForm("form");
        form.innerHTML = "<h3>Edit Text</h3>";
        utils.setModalBackButton(() => { this.openEditForm() });
        let textField = document.createElement("textarea");
        if (this.text) {
            textField.value = this.text;
        }
        form.appendChild(textField);
        let button = utils.appendButton("Save", form, () => {
            this.text = textField.value;
            this.openEditForm();
        })
    }
    setJump(chapter,scene,frame){
        this.jumpDestination = {chapter:chapter,scene:scene,frame:frame};
    }
    jump(destination){
        if(destination){
            if(destination.frame){
                destination.frame.displayFrame();
            } else if(destination.scene){
                destination.scene.runScene();
            } else if(destination.chapter){
                destination.chapter.runChapter();
            }
        }
    }
    static loadJumpDestination(jumpDestination){
        if(!jumpDestination){
            return null;
        }
        const destination = {};
        destination["chapter"] = gameData.getChapterById(jumpDestination.chapter);
        destination["scene"] = destination["chapter"].getSceneById(jumpDestination.scene);
        destination["frame"] = destination["scene"].getFrameById(jumpDestination.frame);
        return destination;
    }

    static makeJumpSelect(){
        const optionValue = document.createElement("div");
        optionValue.classList.add("optionValue");
        const chapterSelect = document.createElement("select");
        chapterSelect.id = "chapter-select";
        const sceneSelect = document.createElement("select");
        sceneSelect.id = "scene-select";
        const frameSelect = document.createElement("select");
        frameSelect.id = "frame-select";
        optionValue.appendChild(chapterSelect);
        optionValue.appendChild(sceneSelect);
        optionValue.appendChild(frameSelect);

        chapterSelect.innerHTML = "";
        sceneSelect.innerHTML = "";
        frameSelect.innerHTML = "";

        setChapterSelect();
        setSceneSelect();
        setFrameSelect();
        chapterSelect.addEventListener("change", () => {
            sceneSelect.innerHTML = "";
            setSceneSelect();
        })

        sceneSelect.addEventListener("change", () => {
            frameSelect.innerHTML = "";
            setFrameSelect();
        })
        return optionValue;

        function setChapterSelect() {
            for (const chapter of gameData.getChapters()) {
                const option = document.createElement("option");
                option.value = chapter.getId();
                option.innerText = chapter.getName();
                chapterSelect.appendChild(option);
            }
        }

        function setSceneSelect() {
            const chapter = gameData.getChapterById(chapterSelect.value);
            for (const scene of chapter.getScenes()) {
                const option = document.createElement("option");
                option.value = scene.getId();
                option.innerText = scene.getName();
                sceneSelect.appendChild(option);
            }
        }

        function setFrameSelect() {
            const chapter = gameData.getChapterById(chapterSelect.value);
            const scene = chapter.getSceneById(sceneSelect.value);
            for (const frame of scene.getFrames()) {
                const option = document.createElement("option");
                option.value = frame.getId();
                option.innerText = frame.getName();
                frameSelect.appendChild(option);
            }
        }
    }
    openNextFrameForm(){
        const form = utils.openNewForm("form");
        form.innerHTML = `
            <h3>Edit Jump Destination</h3>
        `
        form.appendChild(Frame.makeJumpSelect());
        const saveButton = utils.appendButton("Save", form, () => {
            form.querySelectorAll(".optionValue").forEach(div => {
                const chapter = div.querySelector("#chapter-select").value;
                const scene = div.querySelector("#scene-select").value;
                const frame = div.querySelector("#frame-select").value;
                this.jumpDestination = { "chapter": chapter, "scene": scene, "frame": frame };
            })
            this.openEditForm();
        })
    }
    openEditForm() {
        console.log("open edit form");
    }
    getName() { return this.name; }
    getId() { return this.id; }
}

class Choice extends Frame {
    constructor(name) {
        super(name);
        this.type = "choice";
        this.text;
        this.options = [];
    }
    static addFrame(name) {
        return new Choice(name);
    }
    static loadFrame(frame) {
        const newFrame = new Choice(frame.name,frame.id);
        newFrame.text = frame.text;
        newFrame.id = frame.id;
        newFrame.jumpDestination = frame.jumpDestination;
        if (!frame.options) {
            return newFrame;
        }
        newFrame.options = Choice.loadOptions(frame);
        return newFrame;
    }
    static loadOptions(frame){
        console.log(frame.options);
        return frame.options;
    }
    displayFrame() {
        dialogueField.innerText = this.text;
        playerChoiceField.innerHTML = "";
        for(const option of this.options){
            const div = document.createElement("div");
            div.classList.add("player-choice-div");
            div.innerText = option.text;
            if(option["effects"]["flag"]){
                div.addEventListener("click",()=>{
                    console.log("set flags once those are implemented",option["effects"]["flag"]);
                })
            }
            if(option["effects"]["jump"]){
                div.addEventListener("click",()=>{
                    playerChoiceField.innerHTML = "";
                    const destination = Frame.loadJumpDestination(option["effects"]["jump"]);
                    if(destination.frame){
                        destination.frame.displayFrame();
                    } else if(destination.scene){
                        destination.scene.runScene();
                    } else if(destination.chapter){
                        destination.chapter.runChapter();
                    }
                })
            }
            playerChoiceField.appendChild(div);
        }
    }
    addText(text) {
        this.text = text;
    }
    addOption(text, effects) {
        this.options.push({ "text": text, "effects": effects });
        console.log(this);
    }
    showFramePreview(previewDiv) {
        const div = document.createElement("div");
        previewDiv.appendChild(div);

        div.innerText = this.text || "!!!";
    }
    openEditForm() {
        const form = utils.openNewForm("form");
        form.innerHTML = "<h3>Edit Choice</h3>";
        this.showDetailedOverview(form);
        const textButton = utils.appendButton("Edit Text", form, () => { this.openEditTextForm() });
        const optionButton = utils.appendButton("Edit Options", form, () => { this.openEditOptionsForm() });
        const jumpButton = utils.appendButton("Edit Next Frame", form, () => { this.openNextFrameForm() });
    }
    showDetailedOverview(parent) {
        if (this.text) {
            const textDiv = document.createElement("div");
            textDiv.innerText = this.text;
            parent.appendChild(textDiv);
        }
        if (this.options) {
            for (const option of this.options) {
                const div = this.makeOptionDiv(option);

                parent.appendChild(div);
            }
        }
    }
    makeOptionDiv(option){
        const div = document.createElement("div");
        div.innerText += option["text"];
        if(option["effects"]["jump"]){
            div.innerText += `
                jump:
                ${option["effects"]["jump"]["chapter"]}, ${option["effects"]["jump"]["scene"]}, ${option["effects"]["jump"]["frame"]}
            `;
        }
        if(option["effects"]["flag"]){
            for(const flag of option["effects"]["flag"]){
                console.log(flag);
                div.innerText += `
                    ${flag.type}: ${flag.value}
                `;
            }
        }
        return div;
    }
    openEditOptionsForm() {
        const types = ["flag", "jump"];
        const form = utils.openNewForm("form");
        form.innerHTML = "<h3>Edit Options</h3>";
        utils.setModalBackButton(() => { this.openEditForm() });
        
        for(const option of this.options){
            const div = this.makeOptionDiv(option);
            form.appendChild(div);
            const removeButton = utils.appendButton("Remove",div,()=>{
                this.options = this.options.filter(o=>o != option);
                this.openEditOptionsForm();
            })
        }

        const optionName = document.createElement("textarea");
        form.appendChild(optionName);
        const button = utils.appendButton("Add", form, () => { addOptionValue() });

        const saveButton = utils.appendButton("Save", form, () => {
            const data = {};
            data["text"] = optionName.value;
            data["effects"] = {};
            form.querySelectorAll(".optionValue").forEach(div => {
                console.log(div);
                const optionType = div.querySelector("#option-type").value;
                if (optionType == "flag") {
                    if(!data["effects"]["flag"]){
                        data["effects"]["flag"] = [];
                    }
                    data["effects"]["flag"].push({ "type": div.querySelector("#flag-name").value, "value": div.querySelector("#flag-value").value });
                } else if (optionType == "jump") {
                    const chapter = div.querySelector("#chapter-select").value;
                    const scene = div.querySelector("#scene-select").value;
                    const frame = div.querySelector("#frame-select").value;
                    data["effects"]["jump"] = { "chapter": chapter, "scene": scene, "frame": frame };
                }
            })
            this.addOption(data["text"],data["effects"]);
            this.openEditOptionsForm();
        })

        addOptionValue();

        function addOptionValue() {
            let optionValue = document.createElement("div");
            optionValue.classList.add("optionValue");
            const optionType = document.createElement("select");
            optionType.id = "option-type";
            for (const type of types) {
                const option = document.createElement("option");
                option.value = type;
                option.innerText = type;
                optionType.appendChild(option);
            }
            optionType.value = "flag";
            form.appendChild(optionValue);
            const flagName = document.createElement("select");
            flagName.id = "flag-name";
            for(const flag of gameData.getFlags()){
                const option = document.createElement("option");
                option.innerText = flag.name;
                option.value = flag.name;
                flagName.appendChild(option);
            }
            const flagValue = document.createElement("input");
            flagValue.id = "flag-value";


            optionValue.appendChild(flagName);
            optionValue.appendChild(flagValue);
            optionValue.appendChild(optionType);

            optionType.addEventListener("change", () => {
                optionValue.remove();
                if (optionType.value == "flag") {
                    optionValue = document.createElement("div");
                    optionValue.classList.add("optionValue");
                    optionValue.appendChild(flagName);
                    optionValue.appendChild(flagValue);
                } else if (optionType.value == "jump") {
                    optionValue = Frame.makeJumpSelect();
                }
                optionValue.appendChild(optionType);
                form.appendChild(optionValue);
            })

        }

    }
}

class Dialogue extends Frame {
    constructor(name) {
        super(name);
        this.type = "dialogue";
        this.characters = [];
        this.speaker;
        this.text;
    }
    static addFrame(name,id) {
        return new Dialogue(name);
    }
    static loadFrame(frame) {
        const newFrame = new Dialogue(frame.name);
        newFrame.jumpDestination = frame.jumpDestination;
        newFrame.speaker = frame.speaker;
        newFrame.id = frame.id;
        newFrame.text = frame.text;
        if (!frame.characters) {
            return newFrame;
        }
        if (frame.speaker) {
            newFrame.speaker = gameData.getCharacterById(frame.speaker.id);
        }
        for (const character of frame.characters) {
            newFrame.characters.push({ "character": gameData.getCharacterById(character.character.id), "position": character.position });
        }
        return newFrame;
    }
    displayFrame() {
        dialogueField.innerText = this.text;
        speakerName.innerText = this.speaker.getName();
        const nextButton = utils.appendButton("->", textField, () => { this.nextFrame(); nextButton.remove() });
        nextButton.classList.add("next-button");
    }
    
    nextFrame() {
        const destination = Frame.loadJumpDestination(this.jumpDestination);
        console.log(destination);
        this.jump(destination);
    }

    showFramePreview(previewDiv) {
        const div = document.createElement("div");
        previewDiv.appendChild(div);
        if (this.speaker) {
            div.innerText = `Speaker: ${this.speaker.getName()}
            Text: ${this.text}
            `;
        }
    }
    addSpeaker(character) {
        this.speaker = character;
    }
    addCharacter(character) {
        this.characters.push(character);
    }
    addText(text) {
        this.text = text;
    }
    openEditForm() {
        const form = utils.openNewForm("form");
        form.innerHTML = "<h3>Edit Dialogue</h3>";
        this.showDetailedOverview(form);
        const textButton = utils.appendButton("Edit Text", form, () => { this.openEditTextForm() });
        const charactersButton = utils.appendButton("Edit Characters", form, () => { this.openEditCharactersForm() });
        const speakerButton = utils.appendButton("Edit Speaker", form, () => { this.openEditSpeakerForm() });
        const jumpButton = utils.appendButton("Edit Next Frame", form, () => { this.openNextFrameForm() });
    }
    showDetailedOverview(parent) {
        if(this.jumpDestination){
            const jumpDiv = document.createElement("div");
            jumpDiv.innerText = `
                Next Frame:
                ${this.jumpDestination["chapter"]}, ${this.jumpDestination["scene"]}, ${this.jumpDestination["frame"]}
            `;
            parent.appendChild(jumpDiv);
        }
        if (this.text) {
            const textDiv = document.createElement("div");
            textDiv.innerText = `Text:
            ${this.text}`;
            parent.appendChild(textDiv);
        }
        if (this.speaker) {
            const speakerDiv = document.createElement("div");
            speakerDiv.innerText = `Speaker:
            ${this.speaker.getName()}`;
            parent.appendChild(speakerDiv);
        }
        if (this.characters.length > 0) {
            const title = document.createElement("div");
            title.innerText = "Characters:";
            parent.appendChild(title);
            for (const character of this.characters) {
                const div = document.createElement("div");
                div.innerText = character.character.name;
                parent.appendChild(div);
            }
        }
    }
    openEditSpeakerForm() {
        const form = utils.openNewForm("form");
        form.innerHTML = "<h3>Edit Speaker</h3>";
        utils.setModalBackButton(() => { this.openEditForm() });
        let characterField = document.createElement("select");
        for (const character of this.characters) {
            const option = document.createElement("option");
            option.value = character.character.getId();
            option.innerText = character.character.getName();
            characterField.appendChild(option);
        }
        form.appendChild(characterField);
        let button = utils.appendButton("Set", form, () => {
            this.speaker = gameData.getCharacterById(characterField.value);
            this.openEditForm();
        })

    }
    openEditCharactersForm() {
        const form = utils.openNewForm("form");
        form.innerHTML = "<h3>Edit Characters</h3>";
        utils.setModalBackButton(() => { this.openEditForm() });
        let characterField = document.createElement("select");
        for (const character of gameData.getCharacters()) {
            const option = document.createElement("option");
            option.value = character.getId();
            option.innerText = character.getName();
            characterField.appendChild(option);
        }
        form.appendChild(characterField);
        let positionField = document.createElement("input");
        form.appendChild(positionField);
        let button = utils.appendButton("Add", form, () => {
            this.characters.push({ "character": gameData.getCharacterById(characterField.value), "position": positionField.value });
            this.openEditCharactersForm();
        })
        for (const character of this.characters) {
            const div = document.createElement("div");
            form.appendChild(div);
            div.innerText = character.character.getName();

            const removeButton = utils.appendButton("remove", div, () => {
                this.characters = this.characters.filter(c => c !== character);
                this.openEditCharactersForm();
            });
        }
    }
}


function setSaveAndLoad(gameData) {
    const exportButton = utils.appendButton("Export", devToolSideBar, () => save(gameData));
    const importButton = utils.appendButton("Import", devToolSideBar, () => utils.openNewForm("import-form"));
    const startButton = utils.appendButton("Start", devToolSideBar, () => gameData.start());

    const importForm = document.getElementById("import-form");
    importForm.querySelector(".save").addEventListener("click", () => {
        let fr = new FileReader();
        fr.onload = function () {
            gameData.load(JSON.parse(fr.result));
            gameData.start();
        }
        fr.readAsText(importForm.querySelector("#file").files[0]);
        utils.closeModal();
    })
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
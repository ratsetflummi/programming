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
        this.characters = [];
        this.chapters = [];
        this.chapterCount = 0;
        this.devTools = new DevTools(this);
    }
    start() {
        if (this.chapters.length > 0) {
            this.chapters[0].runChapter();
        }
    }
    load(data) {
        Object.assign(this, data);
        this.characters = [];
        for (const character of data.characters) {
            this.characters.push(Character.loadCharacter(character));
        }
        this.chapters = [];
        for (const chapter of data.chapters) {
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
    getCharacterByName(name) {
        return this.characters.find(c => c.name == name);
    }
    getChapterByName(name) {
        return this.chapters.find(c => c.name == name);
    }
    getCharacters() {
        return this.characters;
    }
    getChapters() {
        return this.chapters;
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
        this.frameForm = document.getElementById("add-frame-form");
        this.frameForm.querySelectorAll(".save").forEach(button => button.remove());
        this.frameSaveButton = document.createElement("button");
        this.frameSaveButton.innerText = "Save";
        this.frameSaveButton.classList.add("save");
        this.frameSaveButton.type = "button";
        this.frameForm.appendChild(this.frameSaveButton);
        this.frameSaveButton.addEventListener("click", () => { this.addFrame() });


        setSaveAndLoad(this.gameData);

        this.toolbar.appendChild(this.characterDiv);
        this.toolbar.appendChild(this.chapterDiv);
        this.toolbar.appendChild(this.sceneDiv);
        this.toolbar.appendChild(this.frameDiv);

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
        this.characterSelect.appendChild(option);
    }
    addChapterOption(chapter) {
        const option = document.createElement("option");
        option.addEventListener("click", () => { this.showChapterPreview(chapter) });
        option.innerText = chapter.getName();
        this.chapterSelect.appendChild(option);
        this.showChapterPreview(chapter);
    }
    addSceneOption(scene) {
        const option = document.createElement("option");
        option.addEventListener("click", () => { this.showScenePreview(scene) });
        option.innerText = scene.getName();
        this.sceneSelect.appendChild(option);
    }
    openSceneForm() {
        utils.openNewForm("add-scene-form");
    }

    addScene() {
        utils.closeModal();
        this.addSceneOption(this.selectedChapter.addScene());
    }

    showScenePreview(scene) {
        this.selectedScene = scene;
        this.setFrameFunctions();
    }



    addFrameOption(frame) {
        const option = document.createElement("option");
        option.addEventListener("click", () => this.showFramePreview(frame));
        option.innerText = frame.getName();
        this.frameSelect.appendChild(option);
    }
    openFrameForm() {
        utils.openNewForm("add-frame-form");
    }

    addFrame() {
        utils.closeModal();
        this.addFrameOption(this.selectedScene.addFrame());
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

        this.characterSaveButton = utils.appendButton("Save", this.characterForm, () => {this.addCharacter() });
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
        this.name = name;
        this.images = [];
        this.image = image;
        this.color = new utils.Color(color) || new utils.Color("black");
        this.addImage(image || "defaultCharacter.png");
        this.showCharacter(imageField);
    }
    static addCharacter() {
        const form = document.getElementById("add-character-form");
        const name = form.querySelector("#name").value;
        const color = form.querySelector("#color").value;
        const image = form.querySelector("#image").value;
        return new Character(name, color, image);
    }
    static loadCharacter(character) {
        const newCharacter = new Character(character.name, character.color.hex, character.image);
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

}


class Chapter {
    constructor(name, number) {
        this.scenes = [];
        this.name = name;
        this.number = number;
        this.sceneCount = 0;
    }
    static addChapter(number) {
        const form = document.getElementById("add-chapter-form");
        const name = form.querySelector("#name").value;
        return new Chapter(name, number);
    }
    static loadChapter(chapter) {
        const newChapter = new Chapter(chapter.name, chapter.number);
        newChapter.scenes = [];
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

    getSceneByName(name) {
        return this.scenes.find(c => c.name == name);
    }
    getScenes() {
        return this.scenes;
    }
    getName() { return this.name; }
}

class Scene {
    constructor(name, number) {
        this.frames = [];
        this.name = name;
        this.number = number;
        this.backgroundImage;
        this.frameCount = 0;
    }
    static addScene(number) {
        const form = document.getElementById("add-scene-form");
        const name = form.querySelector("#name").value;
        return new Scene(name, number);
    }
    static loadScene(scene) {
        const newScene = new Scene(scene.name, scene.number);
        newScene.frameCount = scene.frameCount;
        newScene.frames = [];
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
            this.selectedFrameNumber = -1;
            this.nextFrame();
        }
    }
    nextFrame(){
        if(this.frames.length > this.selectedFrameNumber + 1){
            this.selectedFrameNumber++;
            this.selectedFrame = this.frames[this.selectedFrameNumber];
            this.selectedFrame.displayFrame();
            const nextButton = utils.appendButton("->",textField,()=>{this.nextFrame()});
            nextButton.classList.add("next-button");
        }
    }
    addFrame() {
        const type = document.getElementById("add-frame-form").querySelector("#type").value;
        let frame;
        console.log(this,this.frameCount);
        if (type == "choice") {
            frame = Choice.addFrame(this.frameCount);
        } else if (type == "dialogue") {
            frame = Dialogue.addFrame(this.frameCount);
        }

        this.frameCount++;
        this.frames.push(frame);
        console.log(this);
        return frame;
    }
    setBackgroundImage(image) {
        this.backgroundImage = image;
    }
    getFrames() {
        return this.frames;
    }
    getName() { return this.name; }
}


class Frame {
    constructor(number) {
        this.number = number;
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
    openEditForm() {
        console.log("open edit form");
    }
    getName() { return this.number; }
}

class Choice extends Frame {
    constructor(number) {
        super(number);
        this.type = "choice";
        this.text;
        this.options = [];
    }
    static addFrame(number) {
        return new Choice(number);
    }
    static loadFrame(frame) {
        const newFrame = new Choice(frame.number);
        newFrame.text = frame.text;
        if (!frame.options) {
            return newFrame;
        }
        newFrame.options = frame.options;
        return newFrame;
    }
    displayFrame() {
        dialogueField.innerText = this.text;
    }
    addText(text) {
        this.text = text;
    }
    addOption(text, effects) {
        this.options.push({ "text": text, "effects": effects });
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
    }
    showDetailedOverview(parent) {
        if (this.text) {
            const textDiv = document.createElement("div");
            textDiv.innerText = this.text;
            parent.appendChild(textDiv);
        }
        if (this.options) {
            for (const option of this.options) {
                const div = document.createElement("div");
                div.innerText = JSON.stringify(option);
                parent.appendChild(div);
            }
        }
    }
    openEditOptionsForm() {
        const types = ["flag", "jump"];
        const form = utils.openNewForm("form");
        utils.setModalBackButton(() => { this.openEditForm() });
        form.innerHTML = "<h3>Edit Options</h3>";
        utils.setModalBackButton(() => { this.openEditForm() });
        const optionName = document.createElement("textarea");
        form.appendChild(optionName);
        const button = utils.appendButton("Add", form, () => { addOptionValue() });

        const saveButton = utils.appendButton("Save", form, () => {
            const data = {};
            data["text"] = optionName.value;
            data["effects"] = [];
            form.querySelector(".optionValue").forEach(div => {
                const optionType = "A";
                if (optionType.value == "flag") {
                    data["flag"] = { "type": flagName.value, "value": flagValue.value };
                } else if (optionType.value == "jump") {
                    data["jump"] = { "chapter": chapterSelect.value, "scene": sceneSelect.value, "frame": frameSelect.value };
                }
            })

            this.options.push(data);
            this.openEditForm();
        })

        addOptionValue();

        function addOptionValue() {
            const optionValue = document.createElement("div");
            optionValue.classList.add("optionValue");
            const optionType = document.createElement("select");
            optionValue.appendChild(optionType);
            for (const type of types) {
                const option = document.createElement("option");
                option.value = type;
                option.innerText = type;
                optionType.appendChild(option);
            }
            form.appendChild(optionValue);
            const flagName = document.createElement("input");
            const flagValue = document.createElement("input");
            const chapterSelect = document.createElement("select");
            const sceneSelect = document.createElement("select");
            const frameSelect = document.createElement("select");


            optionValue.appendChild(flagName);
            optionValue.appendChild(flagValue);

            optionType.addEventListener("change", () => {
                optionValue.innerHTML = "";
                if (optionType.value == "flag") {
                    optionValue.appendChild(flagName);
                    optionValue.appendChild(flagValue);
                } else if (optionType.value == "jump") {
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

                }
                form.appendChild(optionValue);
            })


            function setChapterSelect() {
                for (const chapter of gameData.getChapters()) {
                    const option = document.createElement("option");
                    option.value = chapter.getName();
                    option.innerText = chapter.getName();
                    chapterSelect.appendChild(option);
                }
            }

            function setSceneSelect() {
                const chapter = gameData.getChapterByName(chapterSelect.value);
                for (const scene of chapter.getScenes()) {
                    const option = document.createElement("option");
                    option.value = scene.getName();
                    option.innerText = scene.getName();
                    sceneSelect.appendChild(option);
                }
            }

            function setFrameSelect() {
                const chapter = gameData.getChapterByName(chapterSelect.value);
                const scene = chapter.getSceneByName(sceneSelect.value);
                for (const frame of scene.getFrames()) {
                    const option = document.createElement("option");
                    option.value = frame.getName();
                    option.innerText = frame.getName();
                    frameSelect.appendChild(option);
                }
            }
        }

    }
}

class Dialogue extends Frame {
    constructor(number) {
        super(number);
        this.type = "dialogue";
        this.characters = [];
        this.speaker;
        this.text;
    }
    static addFrame(number) {
        return new Dialogue(number);
    }
    static loadFrame(frame) {
        const newFrame = new Dialogue(frame.number);
        newFrame.speaker = frame.speaker;
        newFrame.text = frame.text;
        if (!frame.characters) {
            return newFrame;
        }
        if (frame.speaker) {
            newFrame.speaker = gameData.getCharacterByName(frame.speaker.name);
        }
        for (const character of frame.characters) {
            newFrame.characters.push({ "character": gameData.getCharacterByName(character.character.name), "position": character.position });
        }
        return newFrame;
    }
    displayFrame() {
        dialogueField.innerText = this.text;
        speakerName.innerText = this.speaker.getName();
    }
    showFramePreview(previewDiv) {
        const div = document.createElement("div");
        previewDiv.appendChild(div);
        if (this.speaker) {
            div.innerText = `Speaker: ${this.speaker.getName()}`;
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
    }
    showDetailedOverview(parent) {
        if (this.text) {
            const textDiv = document.createElement("div");
            textDiv.innerText = this.text;
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
            option.value = character.character.getName();
            option.innerText = character.character.getName();
            characterField.appendChild(option);
        }
        form.appendChild(characterField);
        let button = utils.appendButton("Set", form, () => {
            this.speaker = gameData.getCharacterByName(characterField.value);
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
            option.value = character.name;
            option.innerText = character.getName();
            characterField.appendChild(option);
        }
        form.appendChild(characterField);
        let positionField = document.createElement("input");
        form.appendChild(positionField);
        let button = utils.appendButton("Add", form, () => {
            this.characters.push({ "character": gameData.getCharacterByName(characterField.value), "position": positionField.value });
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
        }
        fr.readAsText(importForm.querySelector("#file").files[0]);
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
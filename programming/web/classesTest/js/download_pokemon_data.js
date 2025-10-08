
function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

async function getApiByUrl(url) {
    let response = await fetch(url);
    if (!response.ok) {
        console.log(identifier,"not found");
    }
    let response_data = await response.json();
    return response_data;
}

async function getApiData(type, identifier = "") {
    let data = {};
    if (typeof identifier === "string") {
        identifier = [identifier];
    }
    if (typeof type === "string") {
        type = [type];
    }

    for (const t of type) {
        for (const id of identifier) {
            let response = await fetch(`https://pokeapi.co/api/v2/${t}/${id}/?limit=100000&offset=0`);
            if (!response.ok) {
                console.log(identifier,"not found");
                continue;
            }
            let response_data = await response.json();
            Object.assign(data, response_data);
        }
    }
    return data;
}

function fileNameToCamelCase(name){
    let nameBits = name.split("-");
    if(nameBits.length > 1){
        for(let i = 1; i<nameBits.length; i++){
            nameBits[i] = capitalizeFirstLetter(nameBits[i]);
        }
    }
    return nameBits.join("");
    
    function capitalizeFirstLetter(name) {
        return String(name).charAt(0).toUpperCase() + String(name).slice(1);
    }

}

async function downloadPokemonData(){
    let types = ["language","item-pocket","item-category"];
    let dataTypes = [];
    for(const type in types){
        let fileName = fileNameToCamelCase(types[type]);
        let listName = `${fileName}List`;
        console.log(types[type]);
        let dataList = await getApiData(types[type]);
        dataList = dataList["results"]
        download(JSON.stringify(dataList), `${listName}.txt`, 'text/plain');
        console.log(dataList);
        let fullData = []
        for(const id in dataList){
            let object = dataList[id];
            console.log(object.name);
            let data = await getApiByUrl(object.url);
            fullData.push(data);
        }
        console.log(fullData);
        download(JSON.stringify(fullData), `${fileName}.txt`, 'text/plain');
        dataTypes.push({"variableName":fileName,"fileName":`${fileName}.txt`});
        dataTypes.push({"variableName":listName,"fileName":`${listName}.txt`});
    }
    download(JSON.stringify(dataTypes), `dataTypes.txt`, 'text/plain');

    const pokemonList = await (await fetch(`../data/pokemon.txt`)).json();
    const pokemonSpecies =  await (await fetch(`../data/pokemon-species.txt`)).json();
    let fullPokemon = [];
    const generations = [];
    for(const id in pokemonList){
        let pokemon = pokemonList[id];
        let speciesData = pokemonSpecies.find(species=> species.id == pokemon.id);
        Object.assign(pokemon,speciesData);
        fullPokemon.push(pokemon);
        let generation = pokemon["generation"];
        if(generation){
            generation = generation["name"]
            if(!generations.includes(generation)){
                if(generations.length > 0){
                    download(JSON.stringify(fullPokemon), `pokemon-${generations[generations.length - 1]}.txt`, 'text/plain');
                    fullPokemon = [];
                    console.log(pokemon);
                }
                generations.push(generation);
            }
        }
    }
    download(JSON.stringify(fullPokemon), `pokemon-${generations[generations.length - 1]}.txt`, 'text/plain');
    download(JSON.stringify(generations), `generations.txt`, 'text/plain');
}

import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
import fileSaver from 'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/+esm'; // default import

const saveAs = fileSaver; // rename for clarity

async function downloadImagesAsZip(imageUrls,type) {
    const zip = new JSZip();
    const folder = zip.folder("images");

    for (let i = 0; i < imageUrls.length; i++) {
        console.log(imageUrls[i]["name"]);
        const url = imageUrls[i]["url"];
        if(!url){
            return;
        }
        const fileName = `${imageUrls[i]["name"]}.${getExtensionFromUrl(url)}`;

        try {
            const response = await fetch(url);
            const blob = await response.blob();
            folder.file(fileName, blob);
        } catch (err) {
            console.error(`Failed to fetch ${url}:`, err);
        }
    }

    // Generate the zip and trigger download
    zip.generateAsync({ type: "blob" }).then(function (content) {
        saveAs(content, `${type}.zip`);
    });
}

function getExtensionFromUrl(url) {
    const pathname = new URL(url).pathname;
    return pathname.split(".").pop().split(/\#|\?/)[0];
}

let imageUrls = [
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png",
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png",
    // Add more URLs here
];

let pokemonList = []
const generations = await (await fetch(`../data/generations.txt`)).json();
for(const id in generations){
    let generation = generations[id];
    let data = await (await fetch(`../data/pokemon-${generation}.txt`)).json();
    pokemonList = pokemonList.concat(data);
}
for(const pokemonId in pokemonList){
    let pokemon = pokemonList[pokemonId];
    console.log(pokemon);
}

imageUrls = pokemonList.map(pokemon=>{return{"name":pokemon.name,"url":pokemon.sprites.front_default}});
console.log(imageUrls);

let fileNames = await (await fetch("../data/fileNames.txt")).json();
for(const fileId in fileNames){
    const file = fileNames[fileId];
    const fileName = file["fileName"];
    if(!fileName.includes("List")){
        if(fileName == "pokemon.txt" || fileName == "pokemonSpecies.txt"){
            console.log("handle pokemon seperately");
            continue;
        }
        console.log(fileName);
        const data = await (await fetch(`../data/${fileName}`)).json()
        if(data[0].sprites){
            console.log(data[0].sprites);
            console.log(file);
        }
    }
}
// downloadImagesAsZip(imageUrls,"pokemon");

export{downloadPokemonData,}

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


// let types = ["pokemon","pokemon-species","item","ability","move","nature","type","evolution-chain","growth-rate"];
// for(const type in types){
//     console.log(types[type]);
//     let dataList = await getApiData(types[type]);
//     dataList = dataList["results"]
//     download(JSON.stringify(dataList), `${types[type]}List.txt`, 'text/plain');
//     console.log(dataList);
//     let fullData = []
//     for(const id in dataList){
//         let object = dataList[id];
//         console.log(object.name);
//         let data = await getApiByUrl(object.url);
//         fullData.push(data);
//     }
//     console.log(fullData);
//     download(JSON.stringify(fullData), `${types[type]}.txt`, 'text/plain');
// }

console.log("object");
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
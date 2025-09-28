import * as utils from "./utils.js";
import {Cookies} from "./utils.js";

document.addEventListener("DOMContentLoaded",async()=>{
    let gameData = new GameData();
    let playArea = document.getElementById("play-area");
    document.getElementById("show-team").addEventListener("click",()=>{
        gameData.player.team.members.forEach(pokemon=>{
            let pokemonDiv = document.createElement("div");
            let nameLabel = document.createElement("h3");
            let image = document.createElement("img");
            image.src = pokemon.species.sprites.front_default
            nameLabel.innerText = pokemon.species.names.find(name=>name.language.name == "en").name;
            pokemonDiv.appendChild(image);
            pokemonDiv.appendChild(nameLabel);
            playArea.appendChild(pokemonDiv);

            let moveDiv = document.createElement("div");
            pokemon.moves.forEach(move=>{
                let button = document.createElement("button");
                button.innerText = move.names.find(name=>name.language.name == "en").name;
                moveDiv.appendChild(button);
                button.addEventListener("click",()=>{pokemon.useMove(move)})
            })
            pokemonDiv.appendChild(moveDiv);
        })
    });
    let pokemonList = new PokemonList(await getApiData("pokemon"));
    
    let encounterTable = new EncounterTable({"uncommon":["meowth","pikachu"]});
    let encounter = encounterTable.rollEncounter();
    console.log(encounter);
    let pokemon = new Pokemon(await getApiData("pokemon",encounter));
    pokemon.catch();

    let pokeball = new Ball();
    let greatBall = new GreatBall();
    let ultraBall = new UltraBall();
    pokeball.throw();
    greatBall.throw();
    ultraBall.throw();

    
    gameData.player.inventory.addItem(await getApiData("item","exp-share"));
    console.log(gameData.player);
    
    
    gameData.player.team.addPokemon(new Pokemon(await getApiData(["pokemon","pokemon-species"],"turtwig")));
    gameData.player.team.addPokemon(new Pokemon(await getApiData(["pokemon","pokemon-species"],"starly")));
    gameData.player.team.addPokemon(new Pokemon(await getApiData(["pokemon","pokemon-species"],"glameow")));
    gameData.player.team.addPokemon(new Pokemon(await getApiData(["pokemon","pokemon-species"],"seel")));

    gameData.player.team.members[0].learnMove(new Move(await getApiData("move","tackle")));
    console.log(gameData.player);

})

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


class Pokemon {
    constructor(pokemon_data,level){
        this.species = new PokemonSpecies(pokemon_data);
        this.currentHP = 10;
        this.moves = [];
        this.previousMoves = [];
    }
    catch(){
        console.log(`trying to catch ${this.name}`);
    }
    takeDamage(move){
        console.log(move);
    }
    useMove(move){
        console.log(move);
    }
    learnMove(move){
        if(this.moves.length < 4){
            this.moves.push(move);
        }
    }

}

class PokemonSpecies {
    constructor(pokemon_data){
        Object.assign(this,pokemon_data);
        console.log(pokemon_data);
    }
    getCatchRate(){
        return this.capture_rate;
    }
}

class PokemonList {
    constructor(list) {
        this.count = list.count;
        this.list = Array.isArray(list["results"]) ? [...list["results"]] : Object.assign({}, list);
        this.list.forEach(async pokemon => {
            console.log(pokemon);
        })
    }
}



class Ball {
    constructor() {
        this.catch_rate = 255;
    }
    throw(){
        console.log(`throwing with ${this.catch_rate} catch rate`);
    }
}

class GreatBall extends Ball{
    constructor() {
        super();
        this.catch_rate = 200;
    }
}

class UltraBall extends Ball{
    constructor() {
        super();
        this.catch_rate = 150;
    }
}

class Player{
    constructor() {
        this.team = new Team();
        this.inventory = new Inventory();
    }
}

class Team{
    constructor(){
        this.members = [];
    }

    addPokemon(pokemon){
        if(this.members.length < 6){
            this.members.push(pokemon);
        }
    };

    removePokemon(pokemonID){

        console.log(`removing pokemon with id ${pokemonID}`);
    };
}

class Flags{
    constructor(){
        this.flags = {};
    }
    setFlag(name,value){
        this.flags[name] = value;
    }
    getFlag(name){
        if(this.flags[name]){
            return this.flags[name];
        } else {
            return null;
        }
    }
}

class GameData{
    constructor(){
        this.player = new Player();
        this.flags = new Flags();
    }
    autoSave(){
        let cookies = new Cookies();
        cookies.setCookie("gameData",JSON.stringify(this))
    }
    autoLoad(){
        let cookies = new Cookies();
        let saved = JSON.parse(cookies.getCookie("gameData"));

        let loadedPlayer = new Player();
        Object.assign(loadedPlayer, saved.player);

        let loadedInventory = new Inventory();
        loadedInventory.items = saved.player.inventory.items;
        loadedPlayer.inventory = loadedInventory;

        let loadedFlags = new Flags();
        loadedFlags.flags = saved.flags.flags;

        this.player = loadedPlayer;
        this.flags = loadedFlags;
    }
}

class Scene{
    constructor(){

    }
}

class Battle{
    constructor(){

    }
}

class EncounterTable{
    constructor(encounters){
        this.guaranteed = encounters["guaranteed"];
        this.common = encounters["common"];
        this.uncommon = encounters["uncommon"];
        this.rare = encounters["rare"];
    }
    rollEncounter(){
        if(this.guaranteed){
            return this.guaranteed;
        }
        let encounterChances = [];
        let probabilities = {"common":3,"uncommon":2,"rare":1};
        Object.entries(probabilities).forEach(([chance,repetition])=>{
            if(this[chance]){
                this[chance].forEach(pokemon=>{
                    for(let i = 0;i<repetition;i++){
                        encounterChances.push(pokemon);
                    }
                })
            }
        })
        let chance = (Math.random() * encounterChances.length).toFixed(0); 
        console.log(encounterChances,chance);
        return encounterChances[chance];
    }
}


class Inventory{
    constructor(){
        this.items = [];
    }
    addItem(item,amount=1){
        let itemEntry = this.items.find(i=>i.item.id = item.id);
        if(itemEntry){
            itemEntry.amount += amount;
        } else {
            this.items.push({"item":item,amount:amount});
        }
    }
    removeItem(item,amount=1){
        let itemEntry = this.items.find(i=>i.item.id = item.id);
        if(itemEntry){
            if(itemEntry.amount - amount >= 0){
                itemEntry.amount -= amount;
            } else {
                itemEntry.amount = 0;
            }
        } else {
            this.items.push({"item":item,amount:amount});
        }
        if(this.items.find(i=>i.item.id = item.id).amount == 0){
            console.log("empty");
        }
    }
}

class Move{
    constructor(moveData){
        Object.assign(this,moveData);
        this.currentPP = this.pp;
    }
}

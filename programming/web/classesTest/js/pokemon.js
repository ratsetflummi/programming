import * as utils from "./utils.js";
import {Cookies} from "./utils.js";
let language = "en";
document.addEventListener("DOMContentLoaded",async()=>{
    let gameData = new GameData();
    language = gameData.getLanguage();
    let playArea = document.getElementById("play-area");
    let playerPokemonArea = document.getElementById("player-pokemon");
    let enemyPokemonArea = document.getElementById("enemy-pokemon");
    let movesArea = document.getElementById("moves");
    let textOutputArea = document.getElementById("text-output");
    
    document.getElementById("show-team").addEventListener("click",async ()=>{
        let encounterTable = new EncounterTable({"common":["rattata","ekans"],"uncommon":["meowth","pikachu"]});
        let encounter = encounterTable.rollEncounter();
        console.log(encounter);
        let pokemon = await Pokemon.create(await getApiData(["pokemon","pokemon-species"],encounter));
        pokemon.catch();

        console.log(pokemon);
        let battle = new Battle(pokemon,gameData.player,enemyPokemonArea,playerPokemonArea,movesArea,textOutputArea);
        console.log(battle);
        console.log("showing");
    });
    //let pokemonList = new PokemonList(await getApiData("pokemon"));
    
    let pokeball = new Ball();
    let greatBall = new GreatBall();
    let ultraBall = new UltraBall();
    pokeball.throw();
    greatBall.throw();
    ultraBall.throw();

    
    gameData.player.inventory.addItem(await getApiData("item","exp-share"));
    console.log(gameData.player);
    
    
    gameData.player.team.addPokemon(await Pokemon.create(await getApiData(["pokemon","pokemon-species"],"turtwig")));
    gameData.player.team.addPokemon(await Pokemon.create(await getApiData(["pokemon","pokemon-species"],"starly")));
    gameData.player.team.addPokemon(await Pokemon.create(await getApiData(["pokemon","pokemon-species"],"glameow")));
    gameData.player.team.addPokemon(await Pokemon.create(await getApiData(["pokemon","pokemon-species"],"seel")));

    gameData.player.team.members[0].learnMove(new Move(await getApiData("move","tackle")));
    gameData.player.team.members[0].learnMove(new Move(await getApiData("move","double-slap")));
    gameData.player.team.members[0].learnMove(new Move(await getApiData("move","leer")));
    gameData.player.team.members[0].learnMove(new Move(await getApiData("move","swords-dance")));
    gameData.player.team.members[0].learnMove(new Move(await getApiData("move","whirlwind")));
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
    constructor(pokemon_data,level=5){
        this.pid = Math.round(Math.random() * 4294967295);
        this.species = new PokemonSpecies(pokemon_data);
        this.level = level;
        this.evs = {"hp":0,"attack":0,"defense":0,"special-attack":0,"special-defense":0,"speed":0}
        this.ivs = this.generateIVs();
        this.moves = [];
        this.previousMoves = [];
        this.domObjects = {
            "hpDiv": document.createElement("div"),
            "pokemonDiv": document.createElement("div"),
        };
        this.gender = this.calculateGender();
        this.ability = null;
        this.nature = null;
        this.stats = null;
        this.currentHP = null;

        console.log(this);
    }
    static async create(pokemon_data, level = 5) {
        const pokemon = new Pokemon(pokemon_data, level);
        await pokemon.calculateAbility();
        await pokemon.calculateNature();
        await pokemon.calculateStats();
        await pokemon.calculateTypes();
        return pokemon;
    }
    catch(){
        console.log(`trying to catch ${this.name}`);
    }
    learnMove(move){
        if(this.moves.length < 4){
            this.moves.push(move);
        }
    }
    forgetMove(move){
        this.moves = this.moves.filter(m=>m.id!=move.id);
    }
    getName(){
        console.log(this);
        return this.species.names.find(name=>name.language.name == language).name;
    }
    showPokemon(parent){
        this.domObjects.pokemonDiv.innerHTML = "";
        let nameLabel = document.createElement("h3");
        let image = document.createElement("img");
        console.log(this);
        image.src = this.species.sprites.front_default
        nameLabel.innerText = this.getName() + " - Lvl. " + this.level;
        this.domObjects.pokemonDiv.appendChild(image);
        this.domObjects.pokemonDiv.appendChild(nameLabel);
        parent.appendChild(this.domObjects.pokemonDiv);
    }
    hidePokemon(){
        this.domObjects.pokemonDiv.remove();
    }
    showHpBar(parent){
        parent.appendChild(this.domObjects.hpDiv);
    }
    updateHpBar(){
        this.domObjects.hpDiv.innerText = this.currentHP + "/" + this.stats.hp;
    }
    hideHpBar(){
        this.domObjects.hpDiv.remove();
    }
    lowerHp(amount){
        if(this.currentHP - amount > 0){
            this.currentHP -= amount;
        } else {
            this.currentHP = 0;
        }
    }

    generateIVs(){
        let ivs = {"hp":0,"attack":0,"defense":0,"special-attack":0,"special-defense":0,"speed":0};
        Object.keys(ivs).forEach(key=>{
            ivs[key] = Math.round(Math.random() * 31);
        })
        return ivs;
    }
    async calculateStats(){
        let stats = {"hp":0,"attack":0,"defense":0,"special-attack":0,"special-defense":0,"speed":0};
        Object.keys(stats).forEach(key=>{
            let natureBonus = 1;
            if(this.nature.decreased_stat == key){
                natureBonus = 0.9;
            }
            if(this.nature.increased_stat == key){
                natureBonus = 1.1;
            }
            let iv = this.ivs[key];
            let baseStat = this.species.stats.find(stat=>stat.stat.name == key).base_stat;
            let ev = this.evs[key];
            if(key == "hp"){
                //formula taken from https://pokewiki.de/Individuelle_St%C3%A4rken#Nutzen_(ab_dritte_Generation)
                stats[key] = Math.round(((2*baseStat + iv + Math.round(ev/4)))*this.level/100) + this.level + 10;
            } else {
                //formula taken from https://pokewiki.de/Individuelle_St%C3%A4rken#Nutzen_(ab_dritte_Generation)
                stats[key] = Math.round(Math.round(((2*baseStat + iv + Math.round(ev/4)))*this.level/100 + 5) * natureBonus);
            }
        })
        this.stats = stats;
        this.currentHP = this.stats.hp;
    }
    calculateGender(){
        console.log(this.getName());
        let genderValue = (this.pid % 256) % 8;
        let genderRate = this.species.gender_rate;
        if(genderRate == -1){
            console.log("genderless");
            return "genderless";
        }
        if(genderValue < genderRate){
            return "female";
        } else {
            return "male";
        }
    }
    async calculateAbility(){
        let unhiddenAbilities = this.species.abilities.filter(ability=>ability.is_hidden==false);
        let position = Math.round(this.pid/65536)%unhiddenAbilities.length;
        this.ability = await getApiData("ability",unhiddenAbilities[position].ability.name);
    }
    async calculateNature(){
        let natureId = ((this.pid % 25)+1).toString();
        this.nature = await getApiData("nature",natureId);
    }
    async calculateTypes(){
        this.species.types.forEach(async type=>{
            type.type = await getApiData("type",type.type.name);
        })
    }
}

class PokemonSpecies {
    constructor(pokemon_data){
        Object.assign(this,pokemon_data);
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
        this.language = "en";
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
    setLanguage(language){
        this.language = language;
    }
    getLanguage(){
        return this.language;
    }
}

class Scene{
    constructor(){

    }
}

class Battle{
    constructor(enemy,player,enemyPokemonDiv,playerPokemonDiv,moveDiv,textOutputDiv){
        this.enemy = enemy; 
        this.player = player;
        this.turn = "player";
        this.activePokemon = player.team.members[0];
        this.domObjects = {
            "enemyPokemonDiv": enemyPokemonDiv,
            "playerPokemonDiv": playerPokemonDiv,
            "moveDiv": moveDiv,
            "textOutputDiv": textOutputDiv,
        }
        this.showEnemy();
        this.enemy.updateHpBar();
        this.enemy.showHpBar(this.domObjects.enemyPokemonDiv);
        this.domObjects.playerPokemonDiv.innerHTML = "";
        this.activePokemon.showPokemon(this.domObjects.playerPokemonDiv);
        this.activePokemon.updateHpBar();
        this.activePokemon.showHpBar(this.domObjects.playerPokemonDiv);
        this.showMoves();
        this.startTurn();
    }
    showEnemy(){
        this.domObjects.enemyPokemonDiv.innerHTML = "";
        this.enemy.showPokemon(this.domObjects.enemyPokemonDiv);
    }
    showMoves(){
        this.domObjects.moveDiv.innerHTML = "";
        this.activePokemon.moves.forEach(move=>{
            let button = document.createElement("button");
            button.classList.add("move-button");
            button.classList.add("battle-ui");
            button.innerText = move.names.find(name=>name.language.name == language).name;
            this.domObjects.moveDiv.appendChild(button);
            button.addEventListener("click",()=>{this.useMove(this.activePokemon,this.enemy,move)})
        })
    }
    calculateMoveDamage(attacker,defender,move){
        let crit = 1;
        let f1 = 1;
        let f2 = 1;
        let f3 = 1;
        if((Math.random() * 100) <= 6.25){
            crit = 1.5;
            console.log("it's a crit");
        }
        let damageClass = move.damage_class.name; 
        let attackStat = null;
        let defenseStat = null;
        if(damageClass == "special"){
            attackStat = attacker.stats["special-attack"];
            defenseStat = defender.stats["special-defense"];
        }
        if(damageClass == "physical"){
            attackStat = attacker.stats["attack"];
            defenseStat = defender.stats["defense"];
        }
        if(damageClass == "status"){
            attackStat = 0;
            defenseStat = 1;
        }
        let stab = 1;
        let vulnerability1 = 1;
        let vulnerability2 = 1;
        let random = 100 - Math.round(Math.random() * 15);
        console.log(attacker,defender,move);
        attacker.species.types.forEach(type=>{
            if(type.name == move.type.name){
                stab = 1.5;
            }
        })
        const defenseArray = [["double_damage_from",2],["half_damage_from",0.5],["no_damage_from",0]]
        defender.species.types.forEach(type=>{
            defenseArray.forEach(defense=>{
                if(type.type.damage_relations[defense[0]].map(type=>type.name).includes(type)){
                    if(!vulnerability1){
                        vulnerability1 = defense[1];
                    } else {
                        vulnerability2 = defense[1];
                    }
                }
            })
        })
        // TODO critical hits and f1, f2, f3
        // formula taken from https://www.pokewiki.de/Schaden#Schadensberechnung
        console.log(attacker.level,move.power,attackStat,defenseStat,crit,random,stab,vulnerability1,vulnerability2);
        let damage = Math.round(((attacker.level*(2/5)+2)*move.power*(attackStat/(50*defenseStat))*f1+2)*crit*f2*(random/100)*stab*vulnerability1*vulnerability2*f3);
        console.log(damage);
        return damage;
    }
    async useMove(attacker,defender,move){
        document.querySelectorAll(".battle-ui").forEach(element=>{
            element.disabled = true;
        })
        let repeats = 1;
        if(move.meta.max_hits){
            repeats = getRandomInRange(move.meta.min_hits,move.meta.max_hits);
        }
        for(let i = 0; i< repeats;i++){
            let damage = this.calculateMoveDamage(attacker,defender,move);
            defender.lowerHp(damage);
            defender.updateHpBar();
            await sleep(1000);
        }
        this.calculateMoveStatus(attacker,defender,move);
        this.changeTurn();
        this.startTurn();
    }
    calculateMoveStatus(attacker,defender,move){
        console.log(attacker,defender,move);
    }
    changeTurn(){
        this.turn = this.turn == "player" ? "enemy" : "player";
        console.log(this.turn);
    }
    startTurn(){
        if(this.turn == "player"){
            this.startPlayerTurn();
        }
        if(this.turn == "enemy"){
            this.startEnemyTurn();
        }
    }
    startPlayerTurn(){
        document.querySelectorAll(".battle-ui").forEach(element=>{
            element.disabled = false;
        })
        console.log("start player turn");
    }
    startEnemyTurn(){
        console.log(this.enemy);
        console.log("start enemy turn");
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
        let chance = (Math.random() * encounterChances.length -1).toFixed(0); 
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

function getRandomInRange(min,max){
    return Math.round(Math.random() * (max - min)) + min;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
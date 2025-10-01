import * as utils from "./utils.js";
import {Cookies} from "./utils.js";
let language = "en";
document.addEventListener("DOMContentLoaded",async()=>{
    let gameData = new GameData();
    language = gameData.getLanguage();
    let playArea = document.getElementById("play-area");
    let playerPokemonArea = document.getElementById("player-pokemon");
    let enemyPokemonArea = document.getElementById("enemy-pokemon");
    let playerActionsArea = document.getElementById("player-actions");
    let textOutputArea = document.getElementById("text-output");

    document.getElementById("start-battle").addEventListener("click",async ()=>{
        let encounterTable = new EncounterTable({"common":["rattata","ekans"],"uncommon":["meowth","pikachu"]});
        let encounter = encounterTable.rollEncounter();
        console.log(encounter);
        let pokemon = await Pokemon.create(await getApiData(["pokemon","pokemon-species"],encounter));
        pokemon.catch();
        
        let battle = new Battle(pokemon,gameData.player,enemyPokemonArea,playerPokemonArea,playerActionsArea,textOutputArea);
    });
    //let pokemonList = new PokemonList(await getApiData("pokemon"));
    
    let pokeball = new Ball();
    let greatBall = new GreatBall();
    let ultraBall = new UltraBall();
    pokeball.throw();
    greatBall.throw();
    ultraBall.throw();

    
    gameData.player.inventory.addItem(await getApiData("item","exp-share"));
    

    gameData.player.team.addPokemon(await createPokemonByName("turtwig"));
    gameData.player.team.addPokemon(await createPokemonByName("starly"));
    gameData.player.team.addPokemon(await createPokemonByName("glameow"));
    gameData.player.team.addPokemon(await createPokemonByName("seel"));
    gameData.player.team.addPokemon(await createPokemonByName("eevee"));

    // gameData.player.team.members[0].learnMove("tackle");
    // gameData.player.team.members[0].learnMove("double-slap");
    // gameData.player.team.members[0].learnMove("leer");
    // gameData.player.team.members[0].learnMove("swords-dance");
    // gameData.player.team.members[0].learnMove("whirlwind");
    console.log(gameData.player);
    gameData.player.team.members[0].learnMove("absorb");


    document.getElementById("start-battle").style.display = "block";
})

async function getPokemonDataByName(name) {
    let data = await getApiData(["pokemon","pokemon-species"],name);
    return data;
}

async function createPokemonByName(name) {
    let pokemon = await Pokemon.create(await getPokemonDataByName(name));
    return pokemon;
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


class Pokemon {
    constructor(pokemon_data,level=5,owner="wild"){
        this.owner = owner;
        this.pid = Math.round(Math.random() * 4294967295);
        this.species = new PokemonSpecies(pokemon_data);
        this.level = level;
        this.evs = {"hp":0,"attack":0,"defense":0,"special-attack":0,"special-defense":0,"speed":0}
        this.ivs = this.generateIVs();
        this.moves = [];
        this.previousMoves = [];
        this.experience = 0;
        this.domObjects = {
            "hpDiv": document.createElement("div"),
            "pokemonDiv": document.createElement("div"),
            "spriteImage": document.createElement("img"),
        };
        this.gender = this.calculateGender();
        this.ability = null;
        this.nature = null;
        this.stats = null;
        this.currentHP = null;
        this.canEvolve = false;

        for(let level = 0;level<=this.level;level++){
            this.learnLevelUpMoves(level);
        }

    }
    static async getApiData(pokemon){
        console.log(pokemon);
        await pokemon.calculateAbility();
        await pokemon.calculateNature();
        await pokemon.calculateStats();
        await pokemon.calculateTypes();
        await pokemon.getEvolutionChain();
        await pokemon.getGrowthRate();
    }
    static async create(pokemon_data, level = 5) {
        const pokemon = new Pokemon(pokemon_data, level);
        await this.getApiData(pokemon);
        pokemon.experience = pokemon.species.growth_rate.levels.find(level=>level.level == pokemon.level).experience;
        return pokemon;
    }
    catch(){
        console.log(`trying to catch ${this.getName()}`);
    }
    async learnMove(move_name){
        let move = new Move(await getApiData("move",move_name));
        if(this.moves.length < 4){
            this.moves.push(move);
        } else if(this.owner == "wild"){
            this.forgetMove(this.moves[0]);
            this.moves.push(move);
        } else {
            // TODO ask player to forget move
            this.forgetMove(this.moves[0]);
            this.moves.push(move);
        }
    }
    forgetMove(move){
        this.moves = this.moves.filter(m=>m.id!=move.id);
    }
    getName(){
        return this.species.names.find(name=>name.language.name == language).name;
    }
    showPokemon(parent){
        this.domObjects.pokemonDiv.innerHTML = "";
        let nameLabel = document.createElement("h3");
        this.updateSprite();
        nameLabel.innerText = this.getName() + " - Lvl. " + this.level;
        this.domObjects.pokemonDiv.appendChild(this.domObjects.spriteImage);
        this.domObjects.pokemonDiv.appendChild(nameLabel);
        parent.appendChild(this.domObjects.pokemonDiv);
    }
    updateSprite(){
        this.domObjects.spriteImage.src = this.species.sprites.front_default;
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
    heal(amount){
        if(this.currentHP + amount < this.stats.hp){
            this.currentHP += amount;
        } else {
            this.currentHP = this.stats.hp;
        }
    }
    levelUp(){
        this.level += 1;
        this.calculateStats();
        this.learnLevelUpMoves();
        this.checkEvolution();
    }
    learnLevelUpMoves(level=this.level){
        console.log(this);
        let moves = this.species.moves.filter(move =>
            move.version_group_details.some(
                detail => detail.move_learn_method.name === "level-up" && detail.level_learned_at == level
            )
        )
        moves.forEach(async move=>{
            await this.learnMove(move.move.name);
        })
    }
    moves = [{version_group_details:[{move_learn_method:{name:"level-up"}}]}]
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
    async getEvolutionChain(){
        let chainId = this.species.evolution_chain.url.replace("https://pokeapi.co/api/v2/evolution-chain/","")
        this.species.evolution_chain = await getApiData("evolution-chain",chainId);
    }
    async getGrowthRate(){
        this.species.growth_rate = await getApiData("growth-rate",this.species.growth_rate.name);
    }
    getDrops(enemy){
        let exp = this.calculateEXP(this,enemy);
        this.gainEXP(exp);
    }
    gainEXP(amount){
        this.experience += amount;
        this.checkLevelUp();
        this.checkEvolution();
    }
    checkEvolution(){
        if(this.level == 100){
            return;
        }
        this.species.evolution_chain.chain.evolves_to.forEach(evolution=>{
            let details = evolution.evolution_details[0];
            console.log(details);
            if(details.trigger.name == "level-up"){
                if(this.level >= details.min_level){
                    this.canEvolve = true;
                    console.log(canEvolve);
                } else {
                    //TODO testing only
                    this.canEvolve = true;
                    console.log(this.level,details.min_level);
                }
            }
        })
    }
    checkLevelUp(){
        if(this.experience >= this.getExperienceToLevelUp()){
            this.levelUp();
        }
    }
    getExperienceToLevelUp(){
        return this.species.growth_rate.levels.find(level=>level.level == this.level + 1).experience;
    }
    calculateEXP(attacker,defender){
        let trainer = 1;
        if(defender.owner != "wild"){
            trainer = 1.5
        }
        let traded = 1;
        if(attacker.isTraded()){
            traded = 1.5;
        }
        let luckyEgg = 1;
        if(attacker.hasItem("lucky-egg")){
            luckyEgg = 1.5;
        }
        let exp = Math.round((trainer * defender.species.base_experience * traded * luckyEgg * defender.level)/7);
        return(exp);
    }
    isTraded(){
        console.log("calculate is traded");
        return false;
    }
    hasItem(itemName){
        console.log(`check if pokemon has ${itemName}`);
        return false;
    }
    async startEvolve(evolutionName){
        console.log("show ui to start evolution");
        let evolutionName = "torterra";
        this.evolve(await getPokemonDataByName(evolutionName));
    }
    async evolve(pokemonData){
        this.species = new PokemonSpecies(pokemonData);
        await Pokemon.getApiData(this);
        this.updateSprite();
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
    constructor(enemy,player,enemyPokemonDiv,playerPokemonDiv,playerActionDiv,textOutputDiv){
        this.enemy = enemy; 
        this.player = player;
        this.turn = "player";
        this.activePokemon = player.team.members[0];
        this.battleUI = new BattleUI(this,enemyPokemonDiv,playerPokemonDiv,playerActionDiv,textOutputDiv);
        
        this.battleUI.showEnemy(enemy);
        this.enemy.updateHpBar();
        this.enemy.showHpBar(this.battleUI.domObjects.enemyPokemonDiv);
        this.activePokemon.showPokemon(this.battleUI.domObjects.playerPokemonDiv);
        this.activePokemon.updateHpBar();
        this.activePokemon.showHpBar(this.battleUI.domObjects.playerPokemonDiv);
        this.startTurn();
    }

    flee(){
        console.log("flee");
    }
    async calculateMoveDamage(attacker,defender,move,pondering=null){
        if(move.power == null){
            return 0;
        }
        let crit = 1;
        let f1 = 1;
        let f2 = 1;
        let f3 = 1;
        if(!pondering && (Math.random() * 100) <= 6.25){
            crit = 1.5;
            console.log(this.turn);
            console.log("it's a crit!");
            await this.battleUI.updateMessage(null,null,"move-crit");
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
        
        let damage = Math.round(((attacker.level*(2/5)+2)*move.power*(attackStat/(50*defenseStat))*f1+2)*crit*f2*(random/100)*stab*vulnerability1*vulnerability2*f3);
        console.log(move,damage);
        return damage;
    }
    async useMove(attacker,defender,move){
        document.querySelectorAll(".battle-ui").forEach(element=>{
            element.disabled = true;
        })
        
        this.battleUI.updateMessage(attacker,move,"move");
        let repeats = 1;
        if(move.meta.max_hits){
            repeats = getRandomInRange(move.meta.min_hits,move.meta.max_hits);
        }
        for(let i = 0; i< repeats;i++){
            await sleep(500);
            let damage = await this.calculateMoveDamage(attacker,defender,move);
            defender.lowerHp(damage);
            defender.updateHpBar();
            if(move.meta.drain){
                attacker.heal(Math.round(damage * (move.meta.drain)/100));
                attacker.updateHpBar();
            }
        }
        this.calculateMoveStatus(attacker,defender,move);
        this.changeTurn();
        this.endTurn();
    }
    calculateMoveStatus(attacker,defender,move){
        console.log(attacker,defender,move);
    }
    changeTurn(){
        this.turn = this.turn == "player" ? "enemy" : "player";
    }
    checkFaint(){
        if(this.enemy.currentHP == 0 || this.activePokemon.currentHP == 0){
            this.defeatPokemon();
            return true;
        }
        return false;
    }
    startTurn(){
        if(this.checkFaint()){
            return;
        }
        if(this.turn == "player"){
            this.startPlayerTurn();
        }
        if(this.turn == "enemy"){
            this.startEnemyTurn();
        }
    }
    endTurn(){
        this.checkFaint();
        if(this.activePokemon.canEvolve){
            this.activePokemon.startEvolve();
        }
        this.startTurn();
    }
    startPlayerTurn(){
        this.battleUI.showActions();
        document.querySelectorAll(".battle-ui").forEach(element=>{
            element.disabled = false;
        })
        console.log("start player turn");
    }
    async startEnemyTurn(){
        let bestMove = this.enemy.moves[getRandomInRange(0,this.enemy.moves.length-1)]
        let bestMoveDamage = 0;
        this.enemy.moves.forEach(async move=>{
            let damage = await this.calculateMoveDamage(this.enemy,this.activePokemon,move,"pondering");
            console.log(bestMove,bestMoveDamage,damage);
            if(damage > bestMoveDamage){
                bestMove = move;
                bestMoveDamage = damage;
            }
        })
        this.useMove(this.enemy,this.activePokemon,bestMove);
    }
    defeatPokemon(){
        if(this.activePokemon.currentHP == 0){
            this.defeatPlayer();
        } else if(this.enemy.currentHP == 0){
            this.defeatEnemy();
        }
    }
    defeatPlayer(){
        this.battleUI.updateMessage(this.activePokemon,null,"faint");
    }
    defeatEnemy(){
        this.activePokemon.getDrops(this.enemy);
        this.battleUI.updateMessage(this.enemy,null,"faint");
    }
}

class BattleUI{
    constructor(battle,enemyPokemonDiv,playerPokemonDiv,playerActionDiv,textOutputDiv){
        this.battle = battle;
        this.domObjects = {
            "enemyPokemonDiv": enemyPokemonDiv,
            "playerPokemonDiv": playerPokemonDiv,
            "playerActionDiv": playerActionDiv,
            "moveDiv": document.createElement("div"),
            "actionDiv": document.createElement("div"),
            "textOutputDiv": textOutputDiv,
        }
        this.fightActions = [
            {
                "action": "fight",
                "names": {
                    "en": "Fight",
                    "de": "Kampf",
                }
            }, {
                "action": "bag", "names": {
                    "en": "Bag",
                    "de": "Items",
                }
            }, {
                "action": "pokemon", "names": {
                    "en": "Pokemon",
                    "de": "Pokemon",
                }
            }, {
                "action": "flee", "names": {
                    "en": "Flee",
                    "de": "Flucht",
                }
            },
        ];
        this.domObjects.playerPokemonDiv.innerHTML = "";
        this.showActions();
    }
    showEnemy(enemy){
        this.domObjects.enemyPokemonDiv.innerHTML = "";
        enemy.showPokemon(this.domObjects.enemyPokemonDiv);
    }
    showMoves(activePokemon){
        this.domObjects.playerActionDiv.innerHTML = "";
        this.domObjects.playerActionDiv.appendChild(this.domObjects.moveDiv);
        this.domObjects.moveDiv.innerHTML = "";
        activePokemon.moves.forEach(move=>{
            let button = document.createElement("button");
            button.classList.add("move-button");
            button.classList.add("battle-ui");
            button.innerText = move.names.find(name=>name.language.name == language).name;
            this.domObjects.moveDiv.appendChild(button);
            button.addEventListener("click",()=>{this.battle.useMove(activePokemon,this.battle.enemy,move)});
        })
    }    
    showActions(){
        this.domObjects.playerActionDiv.innerHTML = "";
        this.domObjects.playerActionDiv.appendChild(this.domObjects.actionDiv);
        this.domObjects.actionDiv.innerHTML = "";
        this.fightActions.forEach(action=>{
            let button = document.createElement("button");
            button.classList.add("move-button");
            button.classList.add("battle-ui");
            button.innerText = action.names[language];
            this.domObjects.actionDiv.appendChild(button);
            button.addEventListener("click",()=>{this.doAction(action)});
        })
    }
    lockActions(){
        console.log("lock actions");
    }
    doAction(action){
        if(action.action == "fight"){
            this.showMoves(this.battle.activePokemon);
        }
        if(action.action == "bag"){
            this.showBag();
        }
        if(action.action == "pokemon"){
            this.showTeam();
        }
        if(action.action == "flee"){
            this.battle.flee();
        }
    }
    showBag(){
        console.log("show bag");
    }
    showTeam(){
        console.log("show team");
    }
    async updateMessage(subject,object,action){
        let message = this.getMessage(subject,object,action);
        this.domObjects.textOutputDiv.innerText = message;
        await sleep(500);
    }
    getMessage(subject,object,action){
        if(action == "move"){
            let ownerPrefix = getOwnerPrefix(this.battle.turn,subject.owner);
            let pokemonName = subject.getName();
            let moveName = object.getName();
            return `${ownerPrefix}${pokemonName} used ${moveName}.`;
        }
        if(action == "move-crit"){
            return "A critical hit!";
        }
        if(action == "faint"){
            let ownerPrefix = getOwnerPrefix(this.battle.turn,subject.owner);
            return `${ownerPrefix}${subject.getName()} fainted.`;
        }


        function getOwnerPrefix(turn,owner){
            console.log(turn,owner);
            if(turn == "enemy"){
                if(owner == "wild"){
                    return "Wild ";
                } else {
                    return "Enemy "
                }
            } else {
                return "";
            }
        }
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
        console.log(encounterChances.length,chance);
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
    getName(){
        return this.names.find(name=>name.language.name == language).name;
    }
}

function getRandomInRange(min,max){
    return Math.round(Math.random() * (max - min)) + min;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const types = ["rock", "paper", "scissors"];

function main() {
    const choices = new Choices();

    const buttons = document.querySelectorAll("button");
    buttons.forEach(button => {
        button.addEventListener("click", () => {
            choices.fight(button.id);
            buttons.forEach(button => {
                button.classList.remove("clicked");
            });
            button.classList.add("clicked");
        })
    });

    const results = {}
    types.forEach(type => {
        results[type] = {}
    })
    for (let i = 0; i < 10000; i++) {
        types.forEach(type => {
            const result = choices.fight(type);
            if (!Object.keys(results[type]).includes(result)) {
                results[type][result] = 0;
            }
            results[type][result] += 1;
        })
    }
    console.log(results);
}

class Choices {
    constructor() {
        this.choices = {}
        types.forEach(type => {
            this.choices[type] = new Choice(type);
        });
        this.getChoiceByName("rock").setWeakTo(this.getChoiceByName("paper"));
        this.getChoiceByName("paper").setWeakTo(this.getChoiceByName("scissors"));
        this.getChoiceByName("scissors").setWeakTo(this.getChoiceByName("rock"));
    }

    getChoiceByName(name) {
        return this.choices[name];
    }

    getChoiceByNumber(num) {
        return this.getChoiceByName(types[num])
    }

    getRandomChoice() {
        let computerChoice = Math.floor(Math.random() * 3);
        return this.getChoiceByName(types[computerChoice])
    }

    /**
     * Takes two given types and compares their weakTo functions. 
     * 
     * If player is weak to computer, returns 2,
     * 
     * if computer is weak to player, returns 1,
     * 
     * if neither is weak, returns 0.
     * @param {String} playerType 
     * @param {String} computerType 
     * @returns {int} result
    */
    getWeakType(playerType, computerType) {
        if (playerType.weakTo(computerType)) {
            return 2;
        } else if (computerType.weakTo(playerType)) {
            return 1;
        } else {
            return 0;
        }
    }

    fight(typeName) {
        const playerType = this.getChoiceByName(typeName);
        const computerType = this.getRandomChoice();
        const result = this.getWeakType(playerType, computerType);
        const resultString = this.displayResult(result, playerType, computerType);
        return resultString;
    }

    displayResult(result, playerType, computerType) {
        const results = ["Draw!", "Player wins!", "CPU wins!"]
        const output = document.querySelector("#result");
        output.innerText = `Player: ${playerType.getName()}

    Computer: ${computerType.getName()}

    Result: ${results[result]}`;
        return results[result];
    }
}

class Choice {
    constructor(name) {
        this.name = name;
        this.displayName = capitalizeFirstLetter(name);
    }

    setWeakTo(type) {
        this.weakToType = type;
    }

    weakTo(type) {
        return type == this.weakToType;
    }

    getName() {
        return this.displayName;
    }
}

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

main();
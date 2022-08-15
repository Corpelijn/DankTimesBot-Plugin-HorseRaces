import { IDrugs } from "../drugs/idrugs";
import { IHorse } from "./ihorse";

export class Unicorn implements IHorse {

    static readonly ANIMAL_NAME = "Unicorn";
    static readonly NAMES = ["Magic Bubble Gum", "Mystic Rainbow Tail", "Princess Candy Sparkles", "Starlight Twinkles", "Cosmic Hooves", "Diamond Aura", "Periwinkle", "Berry Sugar Cup", "Boaz", "Miyuki", "Yuki", "Faye", "Aurora", "Cassiopeia", "Dandelion", "Nikephoros", "Fluffy Snowflake", "Fluffy Sunshine", "Prancing Twinkle Toes", "Rainbow Sprinkle Cake"];
    static readonly ICON = "🦄";

    private speed : number;
    private tolerance : number;

    constructor() {
        // Calculate a speed between 80 and 92 kmh (a bit better than a horse)
        this.speed = (Math.random() * (80 - 92)) + 92;
        this.tolerance = ((Math.random() + Math.random() - 1) * 1) + 0.7;
    }
    getIcon(): string {
        throw new Error("Method not implemented.");
    }
    injectDrugs(drugs: IDrugs, hasRaceStarted: boolean): string {
        throw new Error("Method not implemented.");
    }

    isAlive(): boolean {
        throw new Error("Method not implemented.");
    }
    getName(): string {
        throw new Error("Method not implemented.");
    }
    getDescription(): string {
        return `Magic horse that runs like a normal horse. Will shit a rainbow when using drugs, but can take as many drugs as you can feed it.`;
    }
    getSpeed(): number {
        throw new Error("Method not implemented.");
    }
    isUsingDrugs(): boolean {
        throw new Error("Method not implemented.");
    }
    feedDrugs(drugs: IDrugs) {
        throw new Error("Method not implemented.");
    }

}
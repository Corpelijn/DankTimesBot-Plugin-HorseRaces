import { IDrugs } from "../drugs/idrugs";
import { IHorse } from "./ihorse";


export class RaceHorse implements IHorse {

    static readonly ANIMAL_NAME = "Race Horse";
    static readonly NAMES = ["Bella", "Alex", "Lilly", "Alexia", "Fancy", "Sugar", "Lady", "Trucker", "Dakota", "Daisy", "Spirit", "Annie", "Buddy", "Whiskey", "Blue", "Molly", "Ginger", "Charlie", "Ranger"];
    static readonly ICON = "🐎";

    private speed: number;
    private tolerance: number;

    constructor() {
        // Calculate a speed between 75 and 88 kmh (the average for a horse)
        this.speed = (Math.random() * (88 - 75)) + 75;
        this.tolerance = ((Math.random() + Math.random() - 1) * 0.07) + 0.15;
    }
    getIcon(): string {
        return RaceHorse.ICON;
    }

    isAlive(): boolean {
        throw new Error("Method not implemented.");
    }
    getName(): string {
        throw new Error("Method not implemented.");
    }
    getDescription(): string {
        return `Race horse with improved speed and improved drug tolerance.`;
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
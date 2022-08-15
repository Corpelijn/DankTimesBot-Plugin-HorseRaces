import { IHorse } from "../horses/ihorse";
import { IDrugs } from "./idrugs";


// Mostly undetectable
export class BlueMagic implements IDrugs {
    getDescription(): string {
        throw new Error("Method not implemented.");
    }
    getName(): string {
        throw new Error("Method not implemented.");
    }
    isActive(): boolean {
        throw new Error("Method not implemented.");
    }
    getModifier(horse: IHorse): number {
        throw new Error("Method not implemented.");
    }
    
}
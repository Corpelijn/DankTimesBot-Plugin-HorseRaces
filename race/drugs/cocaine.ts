import { IHorse } from "../horses/ihorse";
import { IDrugs } from "./idrugs";


export class Cocaine implements IDrugs {
    constructor (private purity : number) {

    }
    getDescription(): string {
        throw new Error("Method not implemented.");
    }
    
    getName(): string {
        if (this.purity >= 1) {
            return `Pure cocaine`;
        }
        if (this.purity >= 1.5) {
            return `Snow from Columbia`;
        }

        return `Cocaine`;
    }
    isActive(): boolean {
        throw new Error("Method not implemented.");
    }
    getModifier(horse: IHorse): number {
        throw new Error("Method not implemented.");
    }
}
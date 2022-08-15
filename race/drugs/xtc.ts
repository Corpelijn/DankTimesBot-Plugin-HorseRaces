import { timeStamp } from "console";
import { IHorse } from "../horses/ihorse";
import { IDrugs } from "./idrugs";


export class Xtc implements IDrugs {

    private static readonly NAME_0 = `XTC`;
    private static readonly NAME_1 = `XTC from Brabant`;

    constructor(private purity: number) {

    }
    getDescription(): string {
        throw new Error("Method not implemented.");
    }

    getName(): string {
        if (this.purity >= 0.9) {
            return Xtc.NAME_1;
        }
        return Xtc.NAME_0;
    }
    isActive(): boolean {
        throw new Error("Method not implemented.");
    }
    getModifier(horse: IHorse): number {
        throw new Error("Method not implemented.");
    }

}
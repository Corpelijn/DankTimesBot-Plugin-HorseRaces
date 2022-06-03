import { Race } from "./race";

export abstract class Drugs {
    constructor(protected race: Race, protected amount: number) {

    }

    public abstract GetModifier() : number
}
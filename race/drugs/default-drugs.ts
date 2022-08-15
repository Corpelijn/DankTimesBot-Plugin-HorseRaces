import { IJockey } from "../jockeys/ijockey";
import { IDrugs } from "./idrugs";


export class DefaultDrugs implements IDrugs {
    private roundsActive: number = 0;

    constructor(private _amount: number) {
    }

    getInjectionText(hasRaceStarted: boolean, jockey: IJockey = null): string {
        let texts = [];

        if (jockey === null && !hasRaceStarted) {
            texts = [`The stable boy looks away as you inject your horse 💉`,
                `A vetrenarian looks suspicious at you while you feed your horse a special sugar cube ◽️`,
                `The stable boy pretends he didn't see you do that 💉`,
                `The horse grunts at you as it notices you shoved something up its ass 💊`];
        } else if (jockey !== null && !hasRaceStarted) {
            texts = [`The jockey might be cross-eyed because he missed a standing horse and injected ${jockey.getGender(0)} 👀`];
        } else if (jockey === null && hasRaceStarted) {
            texts = [`The jockey finds a suitable vain and injects the drugs like a pro 💉`];
        } else {
            texts = [`The jockey misses the horse and stabs ${jockey.getGender(1)} own leg. You're sure ${jockey.getGender(2)}'s going to be fine 🩸`];
        }

        return texts[Math.floor(Math.random() * texts.length)];
    }

    getDescription(): string {
        return `"Aspirin" from the corner store`;
    }

    getName(): string {
        return `"Aspirin"`;
    }

    isActive(): boolean {
        return this.roundsActive < 3;
    }

    getModifier(): number {
        this.roundsActive += 1;
        let randomFactor = Math.random() * 0.1 + 0.95;
        return (this._amount * (1 / this.roundsActive)) * randomFactor / 1000;
    }
}

import { IDrugs } from "../drugs/idrugs";
import { IJockey } from "./ijockey";


export class DefaultJockey implements IJockey {
    private static readonly BASELINE_WEIGHT = 70;

    private _drugs: IDrugs[];
    private _salary: number = 0;
    private _weight: number = 75;
    private _injectionSkill: number = 0.7;

    constructor(private name: string) {
        this._drugs = new Array<IDrugs>();
    }

    getSpeedModifier(): number {
        let modifier = 1;

        if (this._drugs.length > 0) {
            this._drugs.forEach(d => modifier += d.getModifier() * 0.01);
        }

        modifier += (this.getWeight() - DefaultJockey.BASELINE_WEIGHT) * -0.01;

        return modifier;
    }
    getLuck(): number {
        return Math.random() * 0.3 + 0.9;
    }
    getDescription(): string {
        throw new Error("Method not implemented.");
    }
    getInjectionSkill(): number {
        return this._injectionSkill;
    }
    getWeight(): number {
        return this._weight;
    }
    getGender(pronounce: number = null): number | string {
        if (pronounce === 0) {
            return `himself`;
        } else if (pronounce === 1) {
            return `his`;
        } else if (pronounce === 2) {
            return 'he';
        }

        return -1;  // Unknown gender
    }
    getSalary(): number {
        return this._salary;
    }
    tryInjectDrugs(drugs: IDrugs): boolean {
        return Math.random() <= this.getInjectionSkill();
    }

    injectDrugs(drugs: IDrugs, hasRaceStarted: boolean): string {
        this._drugs.push(drugs);
        return drugs.getInjectionText(hasRaceStarted, this);
    }

    getName(): string {
        return this.name;
    }

    pay(salary: number): string {
        // The default jockey does not take any salary, so return an empty message
        // This should later include code to determine when the jockey quits because he did not get paid (enough).
        return ``;
    }
}
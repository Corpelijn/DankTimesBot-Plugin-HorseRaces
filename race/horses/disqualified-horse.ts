import { IDrugs } from "../drugs/idrugs";
import { IHorse } from "./ihorse";


export class DisqualifiedHorse implements IHorse {
    
    getIcon(): string {
        return ``;
    }
    isAlive(): boolean {
        return false;
    }

    getName(): string {
        return ``;
    }
    getDescription(): string {
        return null;
    }
    getSpeed(): number {
        return 0;
    }
    isUsingDrugs(): boolean {
        return false;
    }
    detectDrugsUsage(): boolean {
        return false;
    }
    injectDrugs(drugs: IDrugs, hasRaceStarted: boolean) : string {
        return `⚠️ You are not a part of this race`;
    }

}
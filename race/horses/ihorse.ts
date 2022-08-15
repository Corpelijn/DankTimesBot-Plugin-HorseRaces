import { IDrugs } from "../drugs/idrugs";

export interface IHorse {
    
    isAlive() : boolean
    getName() : string
    getDescription() : string
    getIcon() : string
    getSpeed() : number
    detectDrugsUsage() : boolean
    injectDrugs(drugs : IDrugs, hasRaceStarted: boolean) : string
}
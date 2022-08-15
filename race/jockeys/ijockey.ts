import { IDrugs } from "../drugs/idrugs";

export interface IJockey {
    getName(): string
    getDescription(): string
    getLuck(): number
    getSpeedModifier(): number
    getWeight(): number
    getGender(pronounce?: number): number | string
    getSalary(): number
    pay(salary: number): string
    getInjectionSkill(): number
    tryInjectDrugs(drugs: IDrugs): boolean
    injectDrugs(drugs: IDrugs, hasRaceStarted: boolean): string
}
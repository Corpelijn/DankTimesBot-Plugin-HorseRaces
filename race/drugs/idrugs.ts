import { IJockey } from "../jockeys/ijockey";

export interface IDrugs {
    /**
     * Gets the name of the drugs.
     * @returns The name of the drugs.
     */
    getName(): string
    /**
     * Gets the description of the drugs.
     * @returns The description of the drugs.
     */
    getDescription(): string
    /**
     * Gets a description of how the drug is injected.
     * @param hasRaceStarted Checks if the race has started.
     */
    getInjectionText(hasRaceStarted: boolean, jockey?: IJockey): string
    /**
     * Checks if the drug is active on a horse or jockey.
     * @returns Returns true if the drug is active; otherwise false.
     */
    isActive(): boolean;
    /**
     * Gets the modifier that the drig applies to the horse.
     * @returns The modifier of the drug.
     */
    getModifier(): number;
}
import { User } from "../../../src/chat/user/user";
import { Race } from "./race";

export class RaceHorse {

    public static readonly SIR_BARTON = new RaceHorse("Sir Barton", 4.50, 0.40, 3.40);
    public static readonly BIG_BROWN = new RaceHorse("Big Brown", 3.49, 0.36, 4.89);
    public static readonly WAR_ADMIRAL = new RaceHorse("War Admiral", 4.86, 0.50, 4.80);
    public static readonly GRINDSTONE = new RaceHorse("Grindstone", 4.06, 0.08, 4.37);
    public static readonly JET_PILOT = new RaceHorse("Jet Pilot", 4.60, 0.33, 4.72);
    public static readonly LORD_MURPHY = new RaceHorse("Lord Murphy", 4.18, 0.21, 4.10);
    public static readonly ELWOOD = new RaceHorse("Elwood", 3.44, 0.31, 3.12);
    public static readonly EXTERMINATOR = new RaceHorse("Exterminator", 4.80, 0.26, 4.14);
    public static readonly STONE_STREET = new RaceHorse("Stone Street", 3.84, 0.46, 3.35);
    public static readonly CITATION = new RaceHorse("Citation", 3.68, 0.04, 3.63);
    public static readonly GALLANT_FOX = new RaceHorse("Gallant Fox", 4.29, 0.18, 4.53);
    public static readonly BARBARO = new RaceHorse("Barbaro", 3.66, 0.12, 4.09);
    public static readonly CANONERO = new RaceHorse("Canonero", 3.32, 0.34, 4.81);
    public static readonly WAR_EMBLEM = new RaceHorse("War Emblem", 4.09, 0.20, 4.68);
    public static readonly APOLLO = new RaceHorse("Apollo", 3.85, 0.27, 4.95);
    public static readonly LIEUTENANT_GIBSON = new RaceHorse("Lieutenant Gibson", 3.76, 0.33, 4.68);
    public static readonly WINTERGREEN = new RaceHorse("Wintergreen", 3.65, 0.22, 4.66);
    public static readonly WHIRLAWAY = new RaceHorse("Whirlaway", 4.20, 0.44, 4.22);
    public static readonly AMERICAN_PHAROAH = new RaceHorse("American Pharoah", 3.97, 0.21, 3.82);
    public static readonly SEATTLE_SLEW = new RaceHorse("Seattle Slew", 3.14, 0.16, 4.00);
    public static readonly OMAHA = new RaceHorse("Omaha", 4.28, 0.37, 4.86);
    public static readonly SECRETARIAT = new RaceHorse("Secretariat", 4.93, 0.17, 3.57);
    public static readonly UNBRIDLED = new RaceHorse("Unbridled", 4.66, 0.05, 4.89);
    public static readonly JOE_COTTON = new RaceHorse("Joe Cotton", 3.85, 0.46, 3.46);
    public static readonly BUCHANAN = new RaceHorse("Buchanan", 3.77, 0.02, 3.52);
    public static readonly HIS_EMINENCE = new RaceHorse("His Eminence", 4.73, 0.08, 4.96);
    public static readonly FLYING_EBONY = new RaceHorse("Flying Ebony", 3.86, 0.44, 3.68);
    public static readonly TWENTY_GRAND = new RaceHorse("Twenty Grand", 3.67, 0.46, 4.93);
    public static readonly JUDGE_HIMES = new RaceHorse("Judge Himes", 3.15, 0.17, 3.30);
    public static readonly ASSAULT = new RaceHorse("Assault", 3.89, 0.37, 4.91);


    private static readonly allHorses = [RaceHorse.SIR_BARTON, RaceHorse.BIG_BROWN, RaceHorse.WAR_ADMIRAL, RaceHorse.GRINDSTONE, RaceHorse.JET_PILOT, RaceHorse.LORD_MURPHY,
    RaceHorse.ELWOOD, RaceHorse.EXTERMINATOR, RaceHorse.STONE_STREET, RaceHorse.CITATION, RaceHorse.GALLANT_FOX, RaceHorse.BARBARO, RaceHorse.CANONERO, RaceHorse.WAR_EMBLEM,
    RaceHorse.APOLLO, RaceHorse.LIEUTENANT_GIBSON, RaceHorse.WINTERGREEN, RaceHorse.WHIRLAWAY, RaceHorse.AMERICAN_PHAROAH, RaceHorse.SEATTLE_SLEW, RaceHorse.OMAHA,
    RaceHorse.SECRETARIAT, RaceHorse.UNBRIDLED, RaceHorse.JOE_COTTON, RaceHorse.BUCHANAN, RaceHorse.HIS_EMINENCE, RaceHorse.FLYING_EBONY, RaceHorse.TWENTY_GRAND,
    RaceHorse.JUDGE_HIMES, RaceHorse.ASSAULT];


    public isCheatingDetected: boolean;
    public finalScore: number;

    private drugIntake: number = 0;
    private drugShots: number = 0;

    constructor(public name: string, private speed: number, private luck: number, private drugResistance: number, public user: User = null, private race: Race = null) {
    }

    public static from(horse: RaceHorse, user: User, race: Race): RaceHorse {
        return new RaceHorse(horse.name, horse.speed, horse.luck, horse.drugResistance, user, race);
    }

    public static getHorses(amount: number): RaceHorse[] {
        if (amount > this.allHorses.length) {
            return [];
        }

        var leftoverHorses = Array.from(this.allHorses);
        var selectedHorses = [];
        for (var i = 0; i < amount; i++) {
            this.shuffleArray(leftoverHorses);
            var index = Math.floor(Math.random() * leftoverHorses.length);
            var horse = leftoverHorses[index];
            selectedHorses.push(horse);
            leftoverHorses.splice(index, 1);
        }

        return selectedHorses;
    }

    /**
     * Let the jury inspect the horse.
     */
    public juryInspect() {
        var cheatingDetectionThreshold = 0.5;
        if (this.drugShots > 1) {
            cheatingDetectionThreshold -= this.drugShots * 0.025;
        }

        if (this.drugIntake > 0 && Math.random() > cheatingDetectionThreshold) {
            this.isCheatingDetected = true;
        }
    }

    /**
     * Checks if the horse is dead.
     */
    public isDead(): boolean {
        return this.drugIntake / (this.drugResistance * this.race.priceMoney / 10) > 1;
    }

    /**
     * Injects the horse with drugs.
     * @param amount The amount of drugs to inject.
     */
    public inject(amount: number) {
        this.drugIntake += amount;
        this.drugShots++;
    }

    /**
     * Calculates the final score of each horse.
     */
    public calculateFinalScore() {
        this.finalScore = this.luck + this.speed + (this.drugIntake / this.race.priceMoney * 10);
    }

    public toString(): string {
        return `${this.user.name} → 🐴 ${this.name}  <i>speed: ${this.speed.toFixed(2)}</i>`;
    }

    private static shuffleArray<T>(array: Array<T>) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
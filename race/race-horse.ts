import { User } from "../../../src/chat/user/user";
import { Race } from "./race";

export class RaceHorse {

    public static readonly SIR_BARTON = new RaceHorse("Sir Barton", 5.92, 0.28, 0.32);
    public static readonly BIG_BROWN = new RaceHorse("Big Brown", 2.04, 0.07, 0.40);
    public static readonly WAR_ADMIRAL = new RaceHorse("War Admiral", 4.87, 0.14, 0.16);
    public static readonly GRINDSTONE = new RaceHorse("Grindstone", 5.18, 0.33, 0.31);
    public static readonly JET_PILOT = new RaceHorse("Jet Pilot", 3.74, 0.42, 0.38);
    public static readonly LORD_MURPHY = new RaceHorse("Lord Murphy", 5.85, 0.40, 0.47);
    public static readonly ELWOOD = new RaceHorse("Elwood", 5.33, 0.24, 0.42);
    public static readonly EXTERMINATOR = new RaceHorse("Exterminator", 2.42, 0.49, 0.07);
    public static readonly STONE_STREET = new RaceHorse("Stone Street", 4.30, 0.49, 0.06);
    public static readonly CITATION = new RaceHorse("Citation", 5.57, 0.36, 0.18);
    public static readonly GALLANT_FOX = new RaceHorse("Gallant Fox", 4.31, 0.43, 0.11);
    public static readonly BARBARO = new RaceHorse("Barbaro", 5.84, 0.33, 0.09);
    public static readonly CANONERO = new RaceHorse("Canonero", 4.29, 0.34, 0.28);
    public static readonly WAR_EMBLEM = new RaceHorse("War Emblem", 4.15, 0.11, 0.21);
    public static readonly APOLLO = new RaceHorse("Apollo", 4.94, 0.26, 0.45);
    public static readonly LIEUTENANT_GIBSON = new RaceHorse("Lieutenant Gibson", 5.45, 0.03, 0.39);
    public static readonly WINTERGREEN = new RaceHorse("Wintergreen", 3.98, 0.03, 0.48);
    public static readonly WHIRLAWAY = new RaceHorse("Whirlaway", 2.55, 0.47, 0.29);
    public static readonly AMERICAN_PHAROAH = new RaceHorse("American Pharoah", 5.96, 0.00, 0.07);
    public static readonly SEATTLE_SLEW = new RaceHorse("Seattle Slew", 2.97, 0.42, 0.16);
    public static readonly OMAHA = new RaceHorse("Omaha", 5.53, 0.41, 0.34);
    public static readonly SECRETARIAT = new RaceHorse("Secretariat", 4.38, 0.29, 0.33);
    public static readonly UNBRIDLED = new RaceHorse("Unbridled", 5.00, 0.19, 0.48);
    public static readonly JOE_COTTON = new RaceHorse("Joe Cotton", 2.92, 0.04, 0.40);
    public static readonly BUCHANAN = new RaceHorse("Buchanan", 3.75, 0.17, 0.22);
    public static readonly HIS_EMINENCE = new RaceHorse("His Eminence", 5.08, 0.38, 0.22);
    public static readonly FLYING_EBONY = new RaceHorse("Flying Ebony", 5.11, 0.48, 0.25);
    public static readonly TWENTY_GRAND = new RaceHorse("Twenty Grand", 2.62, 0.27, 0.14);
    public static readonly JUDGE_HIMES = new RaceHorse("Judge Himes", 2.91, 0.22, 0.06);
    public static readonly ASSAULT = new RaceHorse("Assault", 3.43, 0.40, 0.24);
    

    private static readonly allHorses = [RaceHorse.SIR_BARTON, RaceHorse.BIG_BROWN, RaceHorse.WAR_ADMIRAL, RaceHorse.GRINDSTONE, RaceHorse.JET_PILOT, RaceHorse.LORD_MURPHY,
    RaceHorse.ELWOOD, RaceHorse.EXTERMINATOR, RaceHorse.STONE_STREET, RaceHorse.CITATION, RaceHorse.GALLANT_FOX, RaceHorse.BARBARO, RaceHorse.CANONERO, RaceHorse.WAR_EMBLEM,
    RaceHorse.APOLLO, RaceHorse.LIEUTENANT_GIBSON, RaceHorse.WINTERGREEN, RaceHorse.WHIRLAWAY, RaceHorse.AMERICAN_PHAROAH, RaceHorse.SEATTLE_SLEW, RaceHorse.OMAHA,
    RaceHorse.SECRETARIAT, RaceHorse.UNBRIDLED, RaceHorse.JOE_COTTON, RaceHorse.BUCHANAN, RaceHorse.HIS_EMINENCE, RaceHorse.FLYING_EBONY, RaceHorse.TWENTY_GRAND,
    RaceHorse.JUDGE_HIMES, RaceHorse.ASSAULT];


    public isCheatingDetected: boolean;
    public isDead: boolean;
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

        var drugTolerance = 0.001 * this.drugIntake - this.drugResistance;
        this.isDead = drugTolerance > Math.random();
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
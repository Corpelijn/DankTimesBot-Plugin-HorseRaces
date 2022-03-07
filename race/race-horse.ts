import { Chat } from "../../../src/chat/chat";
import { User } from "../../../src/chat/user/user";
import { Race } from "./race";

export class RaceHorse {

    public static readonly SIR_BARTON = new RaceHorse("Sir Barton", 3.33, 0.91, 0.32);
    public static readonly BIG_BROWN = new RaceHorse("Big Brown", 3.43, 0.90, 0.19);
    public static readonly WAR_ADMIRAL = new RaceHorse("War Admiral", 3.77, 1.10, 0.40);
    public static readonly GRINDSTONE = new RaceHorse("Grindstone", 3.09, 1.17, 0.32);
    public static readonly JET_PILOT = new RaceHorse("Jet Pilot", 5.16, 0.89, 0.38);
    public static readonly LORD_MURPHY = new RaceHorse("Lord Murphy", 3.84, 0.96, 0.23);
    public static readonly ELWOOD = new RaceHorse("Elwood", 3.09, 0.71, 0.15);
    public static readonly EXTERMINATOR = new RaceHorse("Exterminator", 3.47, 0.55, 0.38);
    public static readonly STONE_STREET = new RaceHorse("Stone Street", 3.83, 0.51, 0.23);
    public static readonly CITATION = new RaceHorse("Citation", 3.30, 0.73, 0.17);
    public static readonly GALLANT_FOX = new RaceHorse("Gallant Fox", 4.04, 1.11, 0.38);
    public static readonly BARBARO = new RaceHorse("Barbaro", 4.64, 0.77, 0.28);
    public static readonly CANONERO = new RaceHorse("Canonero", 2.65, 1.00, 0.34);
    public static readonly WAR_EMBLEM = new RaceHorse("War Emblem", 4.17, 0.81, 0.18);
    public static readonly APOLLO = new RaceHorse("Apollo", 5.92, 0.78, 0.15);
    public static readonly LIEUTENANT_GIBSON = new RaceHorse("Lieutenant Gibson", 5.22, 1.12, 0.24);
    public static readonly WINTERGREEN = new RaceHorse("Wintergreen", 5.53, 0.79, 0.22);
    public static readonly WHIRLAWAY = new RaceHorse("Whirlaway", 4.58, 0.82, 0.36);
    public static readonly AMERICAN_PHAROAH = new RaceHorse("American Pharoah", 2.72, 0.65, 0.22);
    public static readonly SEATTLE_SLEW = new RaceHorse("Seattle Slew", 4.20, 0.71, 0.25);
    public static readonly OMAHA = new RaceHorse("Omaha", 2.97, 0.88, 0.24);
    public static readonly SECRETARIAT = new RaceHorse("Secretariat", 4.13, 0.79, 0.18);
    public static readonly UNBRIDLED = new RaceHorse("Unbridled", 4.66, 0.77, 0.14);
    public static readonly JOE_COTTON = new RaceHorse("Joe Cotton", 3.99, 0.62, 0.39);
    public static readonly BUCHANAN = new RaceHorse("Buchanan", 4.16, 1.12, 0.33);
    public static readonly HIS_EMINENCE = new RaceHorse("His Eminence", 5.49, 0.96, 0.25);
    public static readonly FLYING_EBONY = new RaceHorse("Flying Ebony", 4.96, 0.98, 0.16);
    public static readonly TWENTY_GRAND = new RaceHorse("Twenty Grand", 4.45, 1.18, 0.18);
    public static readonly JUDGE_HIMES = new RaceHorse("Judge Himes", 3.22, 1.24, 0.20);
    public static readonly ASSAULT = new RaceHorse("Assault", 3.51, 1.14, 0.20);
    

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

    constructor(public name: string, private speed: number, private luck: number, private drugResistance: number, private userId: number = null, private userName: string = null, private race: Race = null) {
    }

    public static from(horse: RaceHorse, user: User, race: Race): RaceHorse {
        return new RaceHorse(horse.name, horse.speed, horse.luck, horse.drugResistance, user.id, user.name, race);
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

    public getUser(chat: Chat) : User {
        return chat.getOrCreateUser(this.userId, this.userName);
    }

    public toString(): string {
        return `${this.userName} → 🐴 ${this.name}  <i>speed: ${this.speed.toFixed(2)}</i>`;
    }

    private static shuffleArray<T>(array: Array<T>) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
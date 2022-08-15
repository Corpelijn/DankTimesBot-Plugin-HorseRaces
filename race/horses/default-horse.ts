import { IDrugs } from "../drugs/idrugs";
import { IHorse } from "./ihorse";


export class DefaultHorse implements IHorse {

    public static readonly SIR_BARTON = new DefaultHorse("Sir Barton", 48, 0.92);
    public static readonly BIG_BROWN = new DefaultHorse("Big Brown", 49, 1.11);
    public static readonly WAR_ADMIRAL = new DefaultHorse("War Admiral", 45, 1.45);
    public static readonly GRINDSTONE = new DefaultHorse("Grindstone", 48, 0.82);
    public static readonly JET_PILOT = new DefaultHorse("Jet Pilot", 48, 0.95);
    public static readonly LORD_MURPHY = new DefaultHorse("Lord Murphy", 50, 0.94);
    public static readonly ELWOOD = new DefaultHorse("Elwood", 46, 0.87);
    public static readonly EXTERMINATOR = new DefaultHorse("Exterminator", 46, 0.94);
    public static readonly STONE_STREET = new DefaultHorse("Stone Street", 48, 0.55);
    public static readonly CITATION = new DefaultHorse("Citation", 46, 1.24);
    public static readonly GALLANT_FOX = new DefaultHorse("Gallant Fox", 47, 0.65);
    public static readonly BARBARO = new DefaultHorse("Barbaro", 45, 0.93);
    public static readonly CANONERO = new DefaultHorse("Canonero", 48, 0.79);
    public static readonly WAR_EMBLEM = new DefaultHorse("War Emblem", 48, 1.15);
    public static readonly APOLLO = new DefaultHorse("Apollo", 46, 1.01);
    public static readonly LIEUTENANT_GIBSON = new DefaultHorse("Lieutenant Gibson", 50, 0.91);
    public static readonly WINTERGREEN = new DefaultHorse("Wintergreen", 50, 0.77);
    public static readonly WHIRLAWAY = new DefaultHorse("Whirlaway", 49, 1.29);
    public static readonly AMERICAN_PHAROAH = new DefaultHorse("American Pharoah", 47, 0.55);
    public static readonly SEATTLE_SLEW = new DefaultHorse("Seattle Slew", 48, 0.54);
    public static readonly OMAHA = new DefaultHorse("Omaha", 45, 1.26);
    public static readonly SECRETARIAT = new DefaultHorse("Secretariat", 48, 0.98);
    public static readonly UNBRIDLED = new DefaultHorse("Unbridled", 50, 0.95);
    public static readonly JOE_COTTON = new DefaultHorse("Joe Cotton", 47, 0.63);
    public static readonly BUCHANAN = new DefaultHorse("Buchanan", 49, 0.68);
    public static readonly HIS_EMINENCE = new DefaultHorse("His Eminence", 45, 0.90);
    public static readonly FLYING_EBONY = new DefaultHorse("Flying Ebony", 48, 1.39);
    public static readonly TWENTY_GRAND = new DefaultHorse("Twenty Grand", 48, 0.88);
    public static readonly JUDGE_HIMES = new DefaultHorse("Judge Himes", 48, 0.67);
    public static readonly ASSAULT = new DefaultHorse("Assault", 49, 1.13);

    private static readonly allHorses = [DefaultHorse.SIR_BARTON, DefaultHorse.BIG_BROWN, DefaultHorse.WAR_ADMIRAL, DefaultHorse.GRINDSTONE, DefaultHorse.JET_PILOT, DefaultHorse.LORD_MURPHY,
    DefaultHorse.ELWOOD, DefaultHorse.EXTERMINATOR, DefaultHorse.STONE_STREET, DefaultHorse.CITATION, DefaultHorse.GALLANT_FOX, DefaultHorse.BARBARO, DefaultHorse.CANONERO, DefaultHorse.WAR_EMBLEM,
    DefaultHorse.APOLLO, DefaultHorse.LIEUTENANT_GIBSON, DefaultHorse.WINTERGREEN, DefaultHorse.WHIRLAWAY, DefaultHorse.AMERICAN_PHAROAH, DefaultHorse.SEATTLE_SLEW, DefaultHorse.OMAHA,
    DefaultHorse.SECRETARIAT, DefaultHorse.UNBRIDLED, DefaultHorse.JOE_COTTON, DefaultHorse.BUCHANAN, DefaultHorse.HIS_EMINENCE, DefaultHorse.FLYING_EBONY, DefaultHorse.TWENTY_GRAND,
    DefaultHorse.JUDGE_HIMES, DefaultHorse.ASSAULT];

    static getAll(): DefaultHorse[] {
        return this.allHorses;
    }

    private _consumedDrugs: Array<IDrugs>;
    private _isAlive: boolean;

    constructor(private _name: string, private _speed: number, private _tolerance: number) {
        this._consumedDrugs = new Array<IDrugs>();
        this._isAlive = true;
    }

    getIcon(): string {
        return this._isAlive ? `🐴` : `☠️`;
    }

    getName(): string {
        return this._name;
    }

    getDescription(): string {
        return `A standard horse provided by a local stable.`;
    }

    isAlive(): boolean {
        return this._isAlive;
    }

    setName(): string {
        throw new Error(`Cannot change the name of a default horse`);
    }

    detectDrugsUsage(): boolean {
        if (this._consumedDrugs.length === 0) {
            return false;
        }

        let modifier = 0;
        this._consumedDrugs.forEach(drugs => {
            if (drugs.isActive()) {
                modifier += 0.25;
            } else {
                modifier += 0.05;
            }
        });

        return Math.random() < modifier;
    }

    getSpeed(): number {
        if(!this._isAlive) {
            return 0;
        }

        var drugsModifier = 1;

        this._consumedDrugs.filter(d => d.isActive());
        this._consumedDrugs.forEach(d => drugsModifier += d.getModifier());

        if(drugsModifier - 1 > this._tolerance) {
            this._isAlive = false;
        }

        return Math.round(this._speed * drugsModifier);
    }

    injectDrugs(drugs: IDrugs, hasRaceStarted: boolean): string {
        this._consumedDrugs.push(drugs);

        return drugs.getInjectionText(hasRaceStarted);
    }

}
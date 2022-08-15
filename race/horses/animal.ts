import { IDrugs } from "../drugs/idrugs";
import { IHorse } from "./ihorse";


export class Animal implements IHorse {

    private constructor(private _name: string, private _animal: AnimalPrototype, private _icon: string, private _speed: number, private _tolerance: number) {

    }

    public static create(prototype: AnimalPrototype): Animal {
        var nameIndex = Math.floor(Math.random() * prototype.names.length);
        var iconIndex = Math.floor(Math.random() * prototype.icons.length);
        var speed = ((prototype.speedMin - prototype.speedMin) * Math.random()) + prototype.speedMin;
        var tolerance = ((Math.random() + Math.random() - 1) * prototype.toleranceMod) + prototype.tolerance;

        return new Animal(prototype.names[nameIndex], prototype, prototype.icons[iconIndex], speed, tolerance);
    }

    isAlive(): boolean {
        throw new Error("Method not implemented.");
    }
    getName(): string {
        throw new Error("Method not implemented.");
    }
    getIcon(): string {
        throw new Error("Method not implemented.");
    }
    getDescription(): string {
        throw new Error("Method not implemented.");
    }
    getSpeed(): number {
        throw new Error("Method not implemented.");
    }
    isUsingDrugs(): boolean {
        throw new Error("Method not implemented.");
    }
    feedDrugs(drugs: IDrugs) {
        throw new Error("Method not implemented.");
    }
    injectDrugs(drugs: IDrugs, hasRaceStarted: boolean): string {
        throw new Error("Method not implemented.");
    }

}

class AnimalPrototype {
    private static readonly HORSE = new AnimalPrototype("Horse", ["🐴", "🐎"], 75, 88, 0.15, 0.07, "", ["Bella", "Alex", "Lilly", "Alexia", "Fancy", "Sugar", "Lady", "Trucker", "Dakota", "Daisy", "Spirit", "Annie", "Buddy", "Whiskey", "Blue", "Molly", "Ginger", "Charlie", "Ranger"]);
    private static readonly UNICORN = new AnimalPrototype("Unicorn", ["🦄"], 80, 92, 0.7, 1, "", ["Magic Bubble Gum", "Mystic Rainbow Tail", "Princess Candy Sparkles", "Starlight Twinkles", "Cosmic Hooves", "Diamond Aura", "Periwinkle", "Berry Sugar Cup", "Boaz", "Miyuki", "Yuki", "Faye", "Aurora", "Cassiopeia", "Dandelion", "Nikephoros", "Fluffy Snowflake", "Fluffy Sunshine", "Prancing Twinkle Toes", "Rainbow Sprinkle Cake"]);

    private static readonly BEAR = new AnimalPrototype("Bear", ["🐻"], 40, 56, 0.35, 0.05, "Fluffy, big and huggable with a moderate speed and moderate drug tolerance", ["Mr. Bear", "Angel", "Sprinkels", "Teddy", "Cuddles", "Lovebug", "Baby Bear", "Cuddlebug", "Winnie", "Snuggabear", "Fuzzy Wuzzy", "Honey", "Snuggels", "Grizzlee", "Rocky", "Fisher", "Skylar", "Theodore", "Claws", "Pookie", "Rawr", "Beary Potter", "Bob", "Mr. Hugglesworth"]);
    private static readonly BISON = new AnimalPrototype("Bison", ["🦬"], 65, 70, 0.15, 0.1, "Large and agressive cow with a good speed but low drug tolerance.", ["Kula", "Boga", "Beanie", "Juicy", "Sandy", "Romeo", "Sage", "Roscuro", "Blackie", "Felix", "Shayne", "Caro"]);
    private static readonly BUFFALO = new AnimalPrototype("Buffalo", ["🐃"], 55, 57, 0.2, 0.1, "Almost a cow but with very curly horns. Moderately fast and moderate on drugs.", ["Nova", "Tiva", "Abitha", "Enola", "Lomasi", "Ordenda", "Winona", "Coos", "Catana", "Zuni", "Miwok", "Shada", "Mato", "Tokala", "Chapa", "Tansy", "Choctaw"]);
    private static readonly CAMEL = new AnimalPrototype("Camel", ["🐫"], 40, 65, 0.7, 0.1, "Surprisingly fast animal with two big humps that allow for a large drugs tolerance.", ["Toesy", "Sandy", "Hump", "Cammy", "Camelot", "Camille", "Al-Tifl", "Al-Jafool", "Al-Kbout", "Al-Jabbar", "Fluffy", "Cami", "Tally", "Desert Ninja", "Lil'Hump"]);
    private static readonly CHEETAH = new AnimalPrototype("Cheetah", ["🐆"], 104, 120, 0.01, 0.01, "Fastest animal in the world, but with zero drug tolerance.", ["Lambe", "Vivace", "Amabala", "Jabari", "Hasani", "Tolbo", "Phoenix", "Erindi", "Goldie", "Sarah", "Aslan", "Nana", "Kai", "Raider", "Simba", "Pipe", "Savannah"]);
    private static readonly COW = new AnimalPrototype("Cow", ["🐮", "🐂", "🐄"], 30, 40, 0.35, 0.2, "Big black and white animal with a dangling utter. Quite slow but moderate drug tolerance.", ["Bessie", "Brownie", "Buttercup", "Clarabelle", "Dottie", "Guinness", "Magic", "Nellie", "Penelope", "Penny", "Rosie", "Snowflake", "Sprinkles", "Sugar", "Betsie", "Daisy", "Flossie", "Henrietta", "Midnight", "Emery", "Thunder"]);
    private static readonly DINOSAUR = new AnimalPrototype("Dinosaur", ["🦖", "🦕"], 16, 40, 0.4, 0.1, "Prehistoric scary animal that is slow but quite good with drugs.", ["Sinclair", "Robbie", "Charlene", "Earl", "Ethel", "Richfield", "Mr. Lizard", "Rex"]);
    private static readonly DROMEDARY = new AnimalPrototype("Dromedary", ["🐪"], 12, 19, 0.7, 0.15, "Slow animal with a single big hump that allows for a high drug tolerance.", ["Toesy", "Sandy", "Hump", "Cammy", "Camelot", "Camille", "Al-Tifl", "Al-Jafool", "Al-Kbout", "Al-Jabbar", "Fluffy", "Cami", "Tally", "Desert Ninja", "Lil'Hump"]);
    private static readonly ELEPHANT = new AnimalPrototype("Elephant", ["🐘"], 25, 40, 0.09, 0.01, "Largest land animal which is quite slow.", ["Ada", "Armstrong", "Balboa", "Cliff", "Cole", "Colossus", "Dumbo", "Ethan", "Groot", "Hagrid", "Hulk", "Norma", "Serge", "Flora", "Nina", "Queenie", "Tiggy", "Wanda"]);
    private static readonly GIRAFFE = new AnimalPrototype("Giraffe", ["🦒"], 55, 60, 0.15, 0.05, "A horse with a long neck, but boy can it run!", ["April", "Bridget", "Geoffrey", "Gerald", "Melman", "Nessa", "Nina", "Sophie", "Zarafa", "Bruce", "Finn", "Harry", "Gus", "Pat", "Paul", "Demi", "Ivana", "Lola", "Pam", "Prue", "Raya"]);
    private static readonly GOAT = new AnimalPrototype("Goat", ["🐐", "🦌"], 10, 16, 0.15, 0.02, "Animal depiction of the devil. Not that fast, but moderate on drug tolerance.", ["Chester", "Leonard", "Hank", "Finn", "Herbert", "Angus", "Rocco", "Pogo", "Buckley", "Shorty", "Toby", "Buford", "Dandelion", "Dixie", "Gigi", "Norma", "Ruby", "Elmer", "Huckleberry", "Grover", "Colonel", "Tobias", "Baxter", "Gideon", "Gordie", "Goldie", "Maiden", "Bluebell", "Doris", "Millie", "Bubba", "Homer", "Turbo", "Ray", "Milo", "Bartholomew", "Jethro", "Danny Boy", "Pearl", "Gwen"]);
    private static readonly HIPPO = new AnimalPrototype("Hippo", ["🦛"], 20, 30, 0.18, 0.1, "Big, fat and slow animal with a moderate drug tolerance. ", ["Hippy", "Biggy", "Diva", "Becky", "Mr. Gnasher", "Mad Mike", "Vegan", "Snoopy", "Roxie", "Bono", "Alvin", "Bagel"]);
    private static readonly KANGAROO = new AnimalPrototype("Kangaroo", ["🦘"], 40, 71, 0.02, 0.02, "Technically not running, but still very fast. Not good with drugs though.", ["Skippy", "Bounce", "Roger", "Cindy Roo", "Dodger", "Thumper", "Dozer", "Hugo", "Kanga", "Laroo", "Sienna", "Skipper", "Sonnie", "Bonita Canguro", "Willow"]);
    private static readonly LLAMA = new AnimalPrototype("Llama", ["🦙"], 56, 67, 0.12, 0.02, "South-America's answer to a horse/sheep. Moderate on everything.", ["Jiffy", "Wolly", "Loot", "Poki", "Dolly", "Boomer", "Patches", "Floof", "Sage", "Mama", "Sadie", "Aspen", "Pearl", "Olive", "Dorcus", "Gerald", "Tuner", "Spud", "Clive", "Goofy", "Rolo", "Doc"]);
    private static readonly LEOPARD = new AnimalPrototype("Leopard", ["🐆"], 56, 80, 0.02, 0.05, "Big cat with spots that can run fast, but can not tolerate much drugs.", ["Apollo", "Dale", "Shiva", "Trixie", "Stella", "Chester", "Spot", "Raja", "Chiki", "Mercury", "Bongo", "Milo", "Smokey", "Shade", "Milo", "Nila", "Amber", "Nixie"]);
    private static readonly MAMMOTH = new AnimalPrototype("Mammoth", ["🦣"], 35, 42, 0.1, 0.05, "Prehistoric large land animal which is quite slow and hairy (How is it alive?).", ["Agnes", "Clarissa", "Lady", "Juno", "Rose", "Sal", "Wooly", "Ursala", "Bert", "Dexter", "Colin", "Gerald", "Jim", "Ollie", "Paddy", "Theo", "William", "Plumbum", "Pepper"]);
    private static readonly PANDA = new AnimalPrototype("Panda", ["🐼"], 25, 32, 0.1, 0.1, "Fluffy, big and huggable with a moderate speed and moderate drug tolerance in black and white", ["Benji", "Narla", "Elvis", "Bam-Bam", "Sum", "Little John", "Stitch", "Po", "Paddington", "Kuku", "Kai", "Yoo", "Ted", "Dim", "Yogi", "Smokey", "Toto", "Pookey", "Lei Lei", "Care Bear"]);
    private static readonly PIG = new AnimalPrototype("Pig", ["🐷", "🐗", "🐖"], 19, 50, 0.15, 0.07, "Flat snouted animal which is quite slow and low in drug tolerance.", ["Bacon", "Truffle", "Tootsie", "Pinky", "Pickles", "Oreo", "Scooter", "Fudgie", "Buttercream", "Frankfurter", "Pigtails", "Harry Porker", "Curly", "Skillet", "Spam", "Short Rib", "Sizzle", "Webber"]);
    private static readonly RHINO = new AnimalPrototype("Rhino", ["🦏"], 40, 55, 0.12, 0.1, "Big horny animal that is quite fast and moderate with drugs.", ["Basalt", "Breccia", "Chalk", "Coal", "Dacite", "Flint", "Gabbro", "Gneiss", "Jasper", "Kimber", "Opal", "Pumice", "Scotia", "Shale", "Tuff"]);
    private static readonly SHEEP = new AnimalPrototype("Sheep", ["🐏", "🐑"], 40, 45, 0.25, 0.02, "Wooly animal that runs quite slow, but can take a moderate amount of drugs.", ["Chex", "Prince", "Noah", "Lawrence", "Moses", "Goober", "Bear", "Mary", "Chloe", "Dolly", "Dawn", "Shaun", "Edelweiss", "Charity", "Annabel", "Gloria", "Shanna", "Mutton"]);
    private static readonly TIGER = new AnimalPrototype("Tiger", ["🐅"], 65, 80, 0.12, 0.07, "Big striped cat that runs fast.", ["Tigey", "Garfield", "Tony", "Tom", "Tigger", "Azael", "Puss in Boots", "Hobbes", "Daniel", "Rainy", "Pearl", "Vice", "River"]);
    private static readonly WOLF = new AnimalPrototype("Wolf", ["🐺"], 58, 60, 0.1, 0.02, "Original dog that is quite fast, but not so good with drugs.", ["Alaska", "Hawk", "Silver", "Inigo", "Kylo", "Wolfgang", "Magnum", "Apache", "Chippewa", "Lonan", "Witch", "Sioux", "Cole", "Bruno", "Sable", "Hotah", "Padfoot"]);
    private static readonly ZEBRA = new AnimalPrototype("Zebra", ["🦓"], 55, 68, 0.13, 0.05, "A zebra is almost the same as a horse, right? Fast and a moderate drug tolerance.", ["Marty", "Dhahabu", "Yipes", "Hamu", "Zuzu", "Zigby", "Coco", "Dazzle", "Sahara", "Nala", "Adana", "Jafari", "Obi", "Chika", "Bullet", "Taxi", "Chess", "Badger", "Dice", "Zig Zag", "Tux", "Barcode", "Zonk", "Striper", "Speedy Gonzales"]);

    constructor(public animal: string, public icons: string[], public speedMin: number, public speedMax: number, public tolerance: number, public toleranceMod: number, public description, public names: string[]) {

    }
}

export class Statistics {

    constructor(
        public bookkeeperBalance: number = 0,
        public betsMade: number = 0,
        public betsWon: number = 0,
        public drugsUsed: number = 0,
        public racesHeld: number = 0,
        public cheatersCaught: number = 0,
        public horsesDied: number = 0) {

    }

    public toString(): string {
        return `🐴🐴 <b>Horse races statistics</b> 🐴🐴\n` +
            `Bookkeeper balance: ${this.bookkeeperBalance}\n` +
            `Bets made: ${this.betsMade}\n` +
            `Bets won: ${Math.round(this.betsWon / this.betsMade * 1000) / 10} %\n\n` + 
            `<b>Race statistics</b>\n` + 
            `Races held: ${this.racesHeld}\n` + 
            `Drugs used: ${this.drugsUsed}\n` +
            `Cheaters caught: ${this.cheatersCaught}\n` +
            `Horses died: ${this.horsesDied}`;
    }
}
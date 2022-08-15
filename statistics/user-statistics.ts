import { User } from "../../../src/chat/user/user";


export class UserStatistics {
    constructor(
        private user: User,
        // Bets made
        public betsMade: number = 0,
        public betsWon: number = 0,
        public totalBetSpending: number = 0,
        // Race statistics
        public racesPlayed: number = 0,
        public wonFirst: number = 0,
        public wonSecond: number = 0,
        public wonThird: number = 0,
        // Drugs statistics
        public dopeUsed: number = 0,
        public drugsInjected: number = 0,
        public caughtCheating: number = 0,
        public horsesDied: number = 0) { }


    public toString(): string {
        let averageBet = Math.round(this.totalBetSpending / this.betsMade);
        if (this.betsMade === 0) {
            averageBet = 0;
        }

        return `🐴🐴 <b>${this.user.name} statistics</b> 🐴🐴\n` +
            `Bets won: ${this.betsWon}\n` +
            `Bets lost: ${this.betsMade - this.betsWon}\n` +
            `Total bet spendings: ${this.totalBetSpending}\n` +
            `Average bet: ${averageBet}\n\n` +
            `<b>Race statistics</b>\n` +
            `Races won (1st place): ${this.wonFirst}\n` +
            `Races won (2nd place): ${this.wonSecond}\n` +
            `Races won (3rd place): ${this.wonThird}\n` +
            `Races lost: ${this.racesPlayed - this.wonFirst - this.wonSecond - this.wonThird}\n` +
            `Dope used: ${this.dopeUsed}\n` +
            `Drugs used: ${this.drugsInjected}\n` +
            `Caught cheating: ${this.caughtCheating}\n` +
            `Horses died: ${this.horsesDied}\n`;
    }

    public toJSON(): any {
        return {
            userId: this.user.id,
            betsMade: this.betsMade,
            betsWon: this.betsWon,
            totalBetSpending: this.totalBetSpending,
            racesPlayed: this.racesPlayed,
            wonFirst: this.wonFirst,
            wonSecond: this.wonSecond,
            wonThird: this.wonThird,
            dopeUsed: this.dopeUsed,
            drugsInjected: this.drugsInjected,
            caughtCheating: this.caughtCheating,
            horsesDied: this.horsesDied
        };
    }

    public static fromJSON(obj: any, user: User): UserStatistics {
        return new UserStatistics(
            user,
            obj.betsMade,
            obj.betsWon,
            obj.totalBetSpending,
            obj.racesPlayed,
            obj.wonFirst,
            obj.wonSecond,
            obj.wonThird,
            obj.dopeUsed,
            obj.drugsInjected,
            obj.caughtCheating,
            obj.horsesDied);
    }
}
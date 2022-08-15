import { User } from "../../../src/chat/user/user";
import { UserStatistics } from "./user-statistics";
import { Plugin } from "../plugin";


export class Statistics {

    private _userStatistics: Map<number, UserStatistics>;

    constructor(private _chatId: number, users: User[], public bookkeeperBalance: number = 0, public racesHeld: number = 0) {
        this._userStatistics = new Map<number, UserStatistics>();

        users.forEach(user => {
            this._userStatistics.set(user.id, new UserStatistics(user));
        });
    }

    public toString(): string {
        let users = Array.from(this._userStatistics.values());
        let betsMade = users.map(user => user.betsMade).reduce((accumulate, current) => accumulate + current, 0);
        let betsWon = users.map(user => user.betsWon).reduce((accumulate, current) => accumulate + current, 0);
        let winPercentage = betsWon / betsMade;
        if (betsMade === 0) {
            winPercentage = 0;
        }
        let dopeUsed = users.map(user => user.dopeUsed).reduce((accumulate, current) => accumulate + current, 0);
        let drugsInjected = users.map(user => user.drugsInjected).reduce((accumulate, current) => accumulate + current, 0);
        let cheatersCaught = users.map(user => user.caughtCheating).reduce((accumulate, current) => accumulate + current, 0);
        let horsesDied = users.map(user => user.horsesDied).reduce((accumulate, current) => accumulate + current, 0);

        return `🐴🐴 <b>Horse races statistics</b> 🐴🐴\n` +
            `Bookkeeper balance: ${this.bookkeeperBalance}\n` +
            `Bets made: ${betsMade}\n` +
            `Bets won: ${winPercentage} %\n\n` +
            `<b>Race statistics</b>\n` +
            `Races held: ${this.racesHeld}\n` +
            `Dope used: ${dopeUsed}\n` +
            `Drugs injected: ${drugsInjected}\n` +
            `Cheaters caught: ${cheatersCaught}\n` +
            `Horses died: ${horsesDied}\n\n` +
            `<i>For user specific statistics use format: /${Plugin.STAT_CMD[0]} [user] or reply to a user' message.</i>`;
    }

    public getUserStatistics(user: User): UserStatistics {
        if (this._userStatistics.has(user.id)) {
            return this._userStatistics.get(user.id);
        }

        this._userStatistics.set(user.id, new UserStatistics(user));
        return this.getUserStatistics(user);
    }

    public getUserStatisticsString(user: User): string {
        return this._userStatistics.get(user.id).toString();
    }

    public toJSON(): any {
        let users = Array.from(this._userStatistics.values()).map(user => user.toJSON());
        let chat = {
            chatId: this._chatId,
            users: users,
            bookkeeperBalance: this.bookkeeperBalance,
            racesHeld: this.racesHeld
        };

        return chat;
    }

    public static fromJSON(obj: any, chatId: number, users: User[]): Statistics {
        var statistics = new Statistics(chatId, users, obj.bookkeeperBalance, obj.racesHeld);
        users.forEach(user => {
            var userStatistics = obj.users.filter(u => u.userId === user.id)[0];
            statistics._userStatistics.set(user.id, UserStatistics.fromJSON(userStatistics, user));
        });

        return statistics;
    }
}
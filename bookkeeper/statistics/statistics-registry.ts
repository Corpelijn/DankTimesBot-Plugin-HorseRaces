import { User } from "../../../../src/chat/user/user";
import { GlobalStatistics } from "./global-statistics";
import { Plugin } from "../../plugin";
import { UserStatistics } from "./user-statistics";

/**
 * Keeps track of all statistics
 */
export class StatisticsRegistry {

    constructor(public statistics: GlobalStatistics = new GlobalStatistics(), public userStatistics: UserStatistics[] = []) {
    }

    public static fromStorage(statistics: any): StatisticsRegistry {
        var statisticsType = Object.setPrototypeOf(statistics, StatisticsRegistry.prototype);
        statisticsType.statistics = Object.setPrototypeOf(statistics.statistics, GlobalStatistics.prototype) as GlobalStatistics;
        for (var i = 0; i < statisticsType.userStatistics.length; i++) {
            statisticsType.userStatistics[i] = Object.setPrototypeOf(statisticsType.userStatistics[i], UserStatistics.prototype) as UserStatistics;
        }

        return new StatisticsRegistry(statisticsType.statistics, statisticsType.userStatistics);
    }

    /**
     * Creates missing users from the statistics that exists in the chat.
     * @param users The users that exist in the chat.
     */
    public createMissingUsers(users: User[]) {
        users.forEach(user => {
            if (this.findUser(user.id) == null) {
                this.userStatistics.push(new UserStatistics(user.id));
            }
        });
    }

    public processDankTimeWinners(users: User[]) {
        if (users.length == 0) {
            return;
        }

        var firstUser = users[0];
        this.findUser(firstUser.id).dankTimeScoredFirst++;

        if (users.length > 1) {
            var lastUser = users[users.length - 1];
            this.findUser(lastUser.id).dankTimeScoredLast++;
        }

        users.forEach(user => this.findUser(user.id).dankTimeScored++);
    }

    public findUser(userId: number): UserStatistics {
        var user = null;
        this.userStatistics.forEach(usr => {
            if (usr.userId == userId) {
                user = usr;
            }
        });
        return user;
    }

    public getString(user: User): string {
        if (user == null) {
            return this.getGlobalStatistics();
        }

        return this.getUserStatistics(user);
    }

    private getGlobalStatistics(): string {
        var betsWon = 0;
        var drugsUsed = 0;
        var cheatersCaught = 0;
        var horsesDied = 0;
        var betsMade = 0;
        for (let stat of this.userStatistics) {
            betsWon += stat.betsWon;
            drugsUsed += stat.drugsUsed;
            cheatersCaught += stat.cheatingDetected;
            horsesDied += stat.horsesDied;
            betsMade += stat.betsWon + stat.betsLost;
        }

        var percentage = Math.round(betsWon / betsMade * 1000) / 10;
        if (Number.isNaN(percentage)) {
            percentage = 0;
        }
        return `🐴🐴 <b>Horse races statistics</b> 🐴🐴\n` +
            `Bookkeeper balance: ${this.statistics.bookkeeperBalance}\n` +
            `Bets made: ${betsMade}\n` +
            `Bets won: ${percentage} %\n\n` +
            `<b>Race statistics</b>\n` +
            `Races held: ${this.statistics.racesHeld}\n` +
            `Drugs used: ${drugsUsed}\n` +
            `Cheaters caught: ${cheatersCaught}\n` +
            `Horses died: ${horsesDied}\n\n` +
            `<i>For user specific statistics use format: /${Plugin.STAT_CMD[0]} [user] or reply to a user' message.</i>`;
    }

    private getUserStatistics(user: User): string {
        var stats = this.findUser(user.id);
        var avgBet = stats.betsAmountSum / (stats.betsWon + stats.betsLost);
        if (Number.isNaN(avgBet)) {
            avgBet = 0;
        }

        return `🐴🐴 <b>${user.name} statistics</b> 🐴🐴\n` +
            `Bets won: ${stats.betsWon}\n` +
            `Bets lost: ${stats.betsLost}\n` +
            `Total bet spendings: ${stats.betsAmountSum}\n` +
            `Average bet: ${avgBet}\n\n` +
            `<b>Race statistics</b>\n` +
            `Races won (1st place): ${stats.raceWonFirst}\n` +
            `Races won (2nd place): ${stats.raceWonSecond}\n` +
            `Races won (3rd place): ${stats.raceWonThird}\n` +
            `Races lost: ${stats.racesLost}` +
            `Drugs used: ${stats.drugsUsed}\n` +
            `Caught cheating: ${stats.cheatingDetected}\n` +
            `Horses died: ${stats.horsesDied}\n`;
    }
}
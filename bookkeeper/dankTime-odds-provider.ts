
import { User } from "../../../src/chat/user/user";
import { ChatManager } from "../chat-manager";
import { Plugin } from "../plugin";
import { Table } from "../table/table";
import { OddsProvider } from "./odds-provider";
import { UserStatistics } from "./statistics/user-statistics";

/**
 * Keeps track and updates the dank times from users in the chat.
 */
export class DankTimeOddsProvider extends OddsProvider {

    constructor(private chatManager: ChatManager, private userStatistics: UserStatistics[]) {
        super();
    }

    /**
     * Updates the odds of users based on the statistics.
     */
    public updateOdds() {
        var totalFirst = 0;
        var totalLast = 0;
        var totalScored = 0;
        this.userStatistics.forEach(usr => {
            totalFirst += usr.dankTimeScoredFirst;
            totalLast += usr.dankTimeScoredLast;
            totalScored += usr.dankTimeScored;
        });

        var maxOdds = Number(this.chatManager.chat.getSetting(Plugin.MAX_ODDS_SETTING));

        this.userStatistics.forEach(usrStat => {
            var user = this.chatManager.chat.users.get(usrStat.userId);

            var firstWinPercentage = 1 - (usrStat.dankTimeScoredFirst / totalFirst);
            var lastWinPercentage = 1 - (usrStat.dankTimeScoredLast / totalLast);
            var scoredWinPercentage = 1 - (usrStat.dankTimeScored / totalScored);

            if (firstWinPercentage == 0 || Number.isNaN(firstWinPercentage)) {
                firstWinPercentage = 0.5;
            }
            if (lastWinPercentage == 0 || Number.isNaN(lastWinPercentage)) {
                lastWinPercentage = 0.5;
            }
            if (scoredWinPercentage == 0 || Number.isNaN(scoredWinPercentage)) {
                scoredWinPercentage = 0.5;
            }

            var firstOdds = Math.max(this.round(firstWinPercentage * maxOdds, 1), 1.1);
            var lastOdds = Math.max(this.round(lastWinPercentage * maxOdds, 1), 1.1);
            var scoredOdds = Math.max(this.round(scoredWinPercentage * maxOdds / 2, 1), 1.1);

            super.set('first', user, 'scoring first', firstOdds, this.first.bind(this));
            super.set('last', user, 'scoring last', lastOdds, this.last.bind(this));
            super.set('scored', user, 'scoring points', scoredOdds, this.scored.bind(this));
        });
    }

    public toString(): string {
        var groupedByUser = this.groupBy(Array.from(this.odds.values()), odds => odds.user);
        var users = Array.from(groupedByUser.keys()).sort((a, b) => b.score - a.score);

        var table = new Table();
        table.addColumn('users');
        for (let column of this.uniqueOddNames) {
            table.addColumn(column);
        }

        for (let user of users) {
            var values = [];
            values.push(user.name);

            var odds = this.uniqueOddNames.map(odd => this.odds.get(odd + user.id));
            for (var i = 0; i < odds.length; i++) {
                values.push('1:' + odds[i].payout);
            }

            table.addRow(values);
        }

        return table.toString();
    }

    private first(users: User[], user: User): boolean {
        return users[0] == user;
    }

    private last(users: User[], user: User): boolean {
        return users[users.length - 1] == user;
    }

    private scored(users: User[], user: User): boolean {
        return users.includes(user);
    }

    private round(value: number, digits: number): number {
        var multiplier = 1;
        for (var i = 0; i < digits; i++) {
            multiplier *= 10;
        }
        return Math.round(value * multiplier) / multiplier;
    }

    private groupBy<TKey, TElem>(list: TElem[], keyGetter: (arg: TElem) => TKey): Map<TKey, TElem[]> {
        const map = new Map<TKey, TElem[]>();
        list.forEach((item) => {
            const key = keyGetter(item);
            const collection = map.get(key);
            if (!collection) {
                map.set(key, [item]);
            } else {
                collection.push(item);
            }
        });
        return map;
    }
}
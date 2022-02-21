import { User } from "../../../src/chat/user/user";
import { ChatManager } from "../chat-manager";
import { Plugin } from "../plugin";
import { OddsProvider } from "./oddsProvider";
import { WinStatistics } from "./statistics/winStatistics";

/**
 * Keeps track and updates the dank times from users in the chat.
 */
export class DankTimeOddsProvider extends OddsProvider {

    constructor(private chatManager: ChatManager, private winStatistics: WinStatistics, private modifier: number = 1) {
        super();
    }

    /**
     * Updates the odds of users based on the statistics.
     */
    public updateOdds() {
        var totalFirst = 0;
        var totalLast = 0;
        var totalScored = 0;
        this.winStatistics.userStatistics.forEach(usr => {
            totalFirst += usr.first;
            totalLast += usr.last;
            totalScored += usr.scored;
        });

        var maxOdds = Number(this.chatManager.chat.getSetting(Plugin.MAX_ODDS_SETTING));

        this.winStatistics.userStatistics.forEach(usrStat => {
            var user = this.chatManager.chat.users.get(usrStat.userId);

            var firstWinPercentage = 1 - (usrStat.first / totalFirst);
            var lastWinPercentage = 1 - (usrStat.last / totalLast);
            var scoredWinPercentage = 1 - (usrStat.scored / totalScored);

            if (firstWinPercentage == 0 || Number.isNaN(firstWinPercentage)) {
                firstWinPercentage = 0.5;
            }
            if (lastWinPercentage == 0 || Number.isNaN(lastWinPercentage)) {
                lastWinPercentage = 0.5;
            }
            if (scoredWinPercentage == 0 || Number.isNaN(scoredWinPercentage)) {
                scoredWinPercentage = 0.5;
            }

            var firstOdds = Math.max(this.round(firstWinPercentage * maxOdds, 1) * this.modifier, 1.1);
            var lastOdds = Math.max(this.round(lastWinPercentage * maxOdds, 1) * this.modifier, 1.1);
            var scoredOdds = Math.max(this.round(scoredWinPercentage * maxOdds / 2 * this.modifier, 1), 1.1);

            super.set('first', user, 'scoring first', firstOdds, this.first.bind(this));
            super.set('last', user, 'scoring last', lastOdds, this.last.bind(this));
            super.set('scored', user, 'scoring points', scoredOdds, this.scored.bind(this));
        });
    }

    public toString(): string {
        var msg = ``;

        var groupedByUser = this.groupBy(Array.from(this.odds.values()), odds => odds.user);
        var users = Array.from(groupedByUser.keys()).sort((a, b) => b.score - a.score);

        users.forEach(usr => {
            msg += `<b>${usr.name}:</b>\n`

            for (let odds of groupedByUser.get(usr)) {
                msg += `  ${odds.command}  --  1 : ${odds.payout}   -   ${odds.description}\n`;
            }

            msg += `\n`;
        });

        return msg;
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
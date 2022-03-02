import { AlterUserScoreArgs } from "../../../src/chat/alter-user-score-args";
import { User } from "../../../src/chat/user/user";
import { Bet } from "./bet";
import { ChatManager } from "../chat-manager";
import { OddsProvider } from "./odds-provider";
import { Plugin } from "../plugin";

export class Bookkeeper {
    private bets: Bet[];

    /**
     * Creates a new bookkeeper to place bets and keep track of odds.
     * @param chatManager The chat manager that controls this bookkeeper.
     * @param odds The odds provider that checks and updates the odds for each player.
     * @param allowSelfBets Specifies if the bookkeeper allows bets on self.
     */
    constructor(private chatManager: ChatManager, private odds: OddsProvider, private allowSelfBets: boolean) {
        this.bets = [];
        this.odds.updateOdds();
    }

    public hasBets(): boolean {
        return this.bets.length > 0;
    }

    public updateOdds() {
        this.odds.updateOdds();
    }

    /**
     * Places a new bet on a user.
     * @param placer The user that placed the bet.
     * @param onUser The user the bet was placed on.
     * @param command The odds that are used to make the bet.
     * @param amount The amount of points to bet.
     */
    public bet(placer: User, onUser: User, command: string, amount: number): string {
        var odds = this.odds.find(command, onUser);
        if (odds == null) {
            return `⚠️ '${command}' is not a property you can bet on for ${onUser.name}`;
        }

        if (!this.allowSelfBets && placer.id == onUser.id) {
            return `⚠️ You are not allowed to bet on yourself!`;
        }

        if (amount <= 0) {
            return `⚠️ The bet amount must be higher than 0!`;
        }

        for (let bet of this.bets) {
            if (bet.placer == placer && bet.onUser == onUser && bet.odds.command == command && bet.amount == amount) {
                return `⚠️ You can't make the same bet twice`;
            }
        }

        var bet = new Bet(placer, onUser, odds, amount);
        this.bets.push(bet);

        this.chatManager.chat.alterUserScore(new AlterUserScoreArgs(placer, -amount, Plugin.name, Plugin.HORSERACE_PLACE_BET_SCORE_EVENT));

        this.chatManager.statistics.statistics.bookkeeperBalance += amount;

        return bet.getString(true);
    }

    /**
     * Checks the bets made and awards prices to the winners.
     * @param usersWinning The users that scored and the order in which they scored.
     */
    public handleWinners(usersWinning: User[]) {
        var message = ``;
        var usersLost = new Set<User>();
        var winners = new Set<User>();
        for (let bet of this.bets) {
            var result = bet.odds.check(usersWinning, bet.onUser);
            if (result) {
                var onUser = bet.onUser == bet.placer ? `himself` : `${bet.onUser.name}`;
                var payout = bet.amount * bet.odds.payout;
                message += `@${bet.placer.name} was right on ${onUser} ${bet.odds.description} and won ${Math.round(payout)} points.\n`;

                this.chatManager.chat.alterUserScore(new AlterUserScoreArgs(bet.placer, payout, Plugin.name, Plugin.HORSERACE_WIN_BET_SCORE_EVENT));

                this.chatManager.statistics.findUser(bet.placer.id).betsWon++;
                this.chatManager.statistics.statistics.bookkeeperBalance -= payout;
                winners.add(bet.placer);
            } else {
                this.chatManager.statistics.findUser(bet.placer.id).betsLost++;
                usersLost.add(bet.placer);
            }

            this.chatManager.statistics.findUser(bet.placer.id).betsAmountSum += bet.amount;
        }

        if (usersLost.size > 0) {
            Array.from(winners.values()).forEach(winner => {
                usersLost.delete(winner);
            });

            message += `\n${this.printUserCollection(Array.from(usersLost.values()).map(u => '@' + u.name))} lost the bet(s) ${usersLost.size == 1 ? 'he' : 'they'} made.`;
        }

        this.bets = [];
        this.odds.updateOdds();

        this.chatManager.sendMessage(message);
    }

    public refundBets(reason: string) {
        for (let bet of this.bets) {
            this.chatManager.chat.alterUserScore(new AlterUserScoreArgs(bet.placer, bet.amount, Plugin.name, reason));
        }

        this.bets = [];
        this.odds.updateOdds();
    }

    /**
     * Writes all bets to a single string.
     */
    public toString(): string {
        if (this.bets.length == 0) {
            return `There are no bets.`;
        }
        var msg = `<b>Bets made:</b>\n`;

        this.bets.forEach(bet => {
            msg += bet.getString(false) + '\n';
        });

        return msg;
    }

    private printUserCollection(users: string[]): string {
        if (users == null || users.length == 0) {
            return ``;
        } else if (users.length == 1) {
            return users[0];
        } else {
            var newUsers = Array.from(users);
            var last = newUsers.pop();
            return `${newUsers.join(', ')} and ${last}`;
        }
    }
}
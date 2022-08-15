import { User } from "../../../src/chat/user/user";
import { Bet } from "./bet";
import { ChatManager } from "../chat-manager";
import { Plugin } from "../plugin";
import { BetOdds } from "./bet-odds";
import { Table } from "../util/table/table";
import { Util } from "../util/util";

export class Bookkeeper {

    private static readonly _uniqueOddNames = ['first', 'second', 'third'];

    private readonly _odds: Map<string, BetOdds>;
    private readonly _bets: Map<string, Bet>;
    private readonly _inRace: Array<number>;
    private _maxOdds: number;
    private _raceInlay: number;
    private _maximumBet: number;

    /**
     * Creates a new bookkeeper to place bets and keep track of odds.
     * @param _chatManager The chat manager that controls this bookkeeper.
     */
    constructor(private _chatManager: ChatManager) {
        this._bets = new Map<string, Bet>();
        this._odds = new Map<string, BetOdds>();
        this._inRace = new Array<number>();
        this._maximumBet = 0;
    }

    public init(): void {
        this._chatManager.getLeaderboardUsers().forEach(user => {
            this._add(user);
        });
    }

    /**
     * Adds a user to the bookkeepers' books.
     * @param user The user to add.
     */
    /** FINISHED */
    public add(user: User): void {
        this._add(user);
        this._inRace.push(user.id);
        this._maximumBet += this._raceInlay * 10;
    }

    private _add(user: User): void {
        if (Array.from(this._odds.keys()).filter(odds => odds.endsWith(`${user.id}`)).length > 0) {
            return;
        }

        // If there are no racers in the race, get the settings
        if (this._inRace.length === 0) {
            this._maxOdds = this._chatManager.getSetting(Plugin.MAX_ODDS_SETTING);
            this._raceInlay = this._chatManager.getSetting(Plugin.RACE_INLAY);
        }

        let statistics = this._chatManager.getStatistics().getUserStatistics(user);
        let firstFactor = 1 - Math.max(Math.min(statistics.wonFirst / (statistics.racesPlayed / 2) || 0, 1), 0);
        let secondFactor = 1 - Math.max(Math.min(statistics.wonSecond / (statistics.racesPlayed / 2) || 0, 1), 0);
        let thirdFactor = 1 - Math.max(Math.min(statistics.wonThird / (statistics.racesPlayed / 2) || 0, 1), 0);

        this._createOdd('first', user, 0, firstFactor);
        this._createOdd('second', user, 1, secondFactor);
        this._createOdd('third', user, 2, thirdFactor);
    }

    /**
     * Clears all bets and removes all registered odds.
     */
    /** FINISHED */
    public clear(): void {
        this._bets.clear();
        this._inRace.splice(0, this._inRace.length);

        this._odds.clear();
        this.init();

        this._maximumBet = 0;
    }

    public showOdds(): string {
        let groupedByUser = Util.groupBy(Array.from(this._odds.values()), odds => odds.user);
        let users = Array.from(groupedByUser.keys()).sort((a, b) => b.score - a.score);

        let table = new Table();
        table.addColumn('users');
        for (let column of Bookkeeper._uniqueOddNames) {
            table.addColumn(column);
        }

        for (let user of users) {
            let values = [];
            values.push(user.name);

            let odds = Bookkeeper._uniqueOddNames.map(odd => this._find(odd, user));
            for (let i = 0; i < odds.length; i++) {
                values.push('1:' + odds[i].payout);
            }

            table.addRow(values);
        }

        return table.toString();
    }

    /**
     * Create or replace a new bet.
     * @param placer The placer of the bet.
     * @param onUser The user the bet is placed on.
     * @param amount The amount of points to bet.
     * @param namedOdds The name of the odds for the bet.
     */
    /** FINISHED */
    public createBet(placer: User, onUser: User, amount: number, namedOdds: string): string {
        // Find the odds the placer is referring to.
        if (!Bookkeeper._uniqueOddNames.includes(namedOdds)) {
            return `⚠️ I don't understand '${namedOdds}'. Use one of the odds from the /${Plugin.ODDS_CMD[0]} command.`;
        }

        // Check if the user is part of the race
        if (!this._inRace.includes(onUser.id)) {
            return `⚠️ This user is not part of the race.`;
        }

        let odds = this._find(namedOdds, onUser);

        // Check if the bet is aboven the maximum.
        if (amount > this._maximumBet) {
            this._chatManager.sendMessage(`⚠️ Your bet is over the maximum allowed amount. Your bet will now be equal to the maximum which is ${this._maximumBet}`);
            amount = this._maximumBet;
        }

        // Check if the placer has made this exact bet before, if so, correct the bet with the new amount
        let amountToSubtract = amount;
        let betId = `${placer.id}${odds.command}${onUser.id}`;
        if (this._bets.has(betId)) {
            amountToSubtract -= this._bets.get(betId).getAmount();
        }

        // Check if the amount the user is betting is more than the score of the user.
        if (placer.score < amountToSubtract) {
            return `⚠️ You do not have enough points to make that bet.`;
        }

        // If the amount if less than the previous bet, deny it
        if (amountToSubtract < 0) {
            return `⚠️ A replacement bet cannot have less points than the previous bet.`;
        }

        // If the amount is equal to the previous bet, deny it.
        if (amountToSubtract === 0) {
            return `⚠️ This bet already exists.`;
        }

        // Subtract the amount the placer is betting.
        this._chatManager.alterUserScore(placer, -amountToSubtract, Plugin.PLACE_BET);

        // Set the actual bet
        let bet = new Bet(placer, onUser, odds, amount);
        this._bets.set(betId, bet);

        return bet.toString();
    }

    /**
     * Writes all bets to a single string.
     */
    /** FINISHED */
    public toString(): string {
        if (this._bets.size === 0) {
            return `There are no bets.`;
        }
        let msg = `<b>Bets made:</b>\n`;

        this._bets.forEach(bet => {
            msg += bet.toString() + '\n';
        });

        return msg;
    }

    public getWinningBets(winners: User[]): Bet[] {
        return Array.from(this._bets.values()).filter(bet => bet.isWinner(winners));
    }

    /**
     * Find the named odds of the specified user.
     * @param namedOdds The named odds we are looking for.
     * @param user The user of the named odds to find.
     */
    /** FINISHED */
    private _find(namedOdds: string, user: User): BetOdds {
        return this._odds.get(namedOdds + user.id);
    }

    private _createOdd(namedOdds: string, user: User, index: number, factor: number): void {
        let odds = Math.round(Math.min(Math.max(this._maxOdds * factor, 1.1), this._maxOdds) * 10) / 10;

        this._odds.set(namedOdds + user.id, new BetOdds(namedOdds, user, 'finishing ' + namedOdds, odds,
            (winners, user) => this._checkWinner(winners, user, index)));
    }

    private _checkWinner(winners: User[], user: User, index: number): boolean {
        if (winners.length > index) {
            return winners[index].id === user.id;
        }

        return false;
    }
}
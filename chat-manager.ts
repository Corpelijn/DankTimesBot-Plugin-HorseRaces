import { AlterUserScoreArgs } from "../../src/chat/alter-user-score-args";
import { Chat } from "../../src/chat/chat";
import { User } from "../../src/chat/user/user";
import { Bookkeeper } from "./bookkeeper/bookkeeper";
import { Plugin } from "./plugin";
import { IDrugs } from "./race/drugs/idrugs";
import { Race } from "./race/race";
import { Statistics } from "./statistics/statistics";
import { Util } from "./util/util";
import { Validation } from "./util/validation";


export class ChatManager {
    private _statistics: Statistics;
    private _race: Race;
    private _bookkeeper: Bookkeeper;

    constructor(private _chat: Chat, private _plugin: Plugin) {
        this._statistics = new Statistics(_chat.id, Array.from(_chat.users.values()));
        this._bookkeeper = new Bookkeeper(this);
        this._race = new Race(this, null, this._bookkeeper);
    }

    /**
     * Sends a message to Telegram
     * @param message The message to send (in HTML format)
     */
    public sendMessage(message: string): void {
        this._plugin.sendTextMessage(this._chat.id, message);
    }

    /**
     * Alters a user' score by the specified amount.
     * @param user The user to alter the score of.
     * @param amount The amount to add to the current score of the user.
     * @param reason The reason to award the user with points (or the reason to subtract them).
     */
    public alterUserScore(user: User, amount: number, reason: string) {
        this._chat.alterUserScore(new AlterUserScoreArgs(user, amount, this._plugin.name, reason));
    }

    /**
     * Gets a numerical setting' value from the chat.
     * @param name The name of the setting to read.
     */
    public getSetting(name: string): number {
        return this._plugin.parseNumber(this._chat.getSetting(name));
    }

    /**
     * Gets the users currently on the leaderboard
     */
    public getLeaderboardUsers(): User[] {
        return Array.from(this._chat.users.values()).filter(u => u.score !== 0);
    }

    /**
     * Sets the statistics object read from disk
     * @param statistics The statistics object to use.
     */
    public setStatistics(statistics: Statistics): void {
        this._statistics = statistics;
        this._bookkeeper.init();
    }

    /**
     * Gets the statistics object
     */
    public getStatistics(): Statistics {
        return this._statistics;
    }

    // ===================
    // Bookkeeper commands
    // ===================

    public createBet(placer: User, params: string[], replyUser: User = null): string {
        // Check the amount of parameters
        if ((replyUser === null && params.length < 3) || (replyUser !== null && params.length < 2)) {
            return `⚠️ Incorrect format!\n` +
                `Use: /${Plugin.BET_CMD[0]} [user] [odds] [amount]\n` +
                `Or reply to a user with:\n` +
                `/${Plugin.BET_CMD[0]} [odds] [amount]`;
        }

        // Get the user the bet was placed on
        let onUser = replyUser;
        if (onUser === null || onUser === undefined) {
            let username = params.shift().replace('@', '');
            let users = Array.from(this._chat.users.values());
            onUser = users.find(user => user.name.toLowerCase() === username.toLowerCase()) || null;
        }

        // Check if the user exists
        if (onUser === null || onUser === undefined) {
            return `⚠️ You cannot place a bet on that user.`;
        }

        // Check if the horses in the race have started running
        if (this._race.isRunning()) {
            return `⚠️ You cannot place a bet when the race has already started`;
        }

        if (this._race.hasEnded() || !this._race.hasStarted()) {
            return `⚠️ There is no race active to place a bet on.`;
        }

        // Get the odds and amount
        let odds = params.shift();
        let amount = this._plugin.parseNumber(params.shift(), placer);

        return this._bookkeeper.createBet(placer, onUser, amount, odds);
    }

    public showOdds(): string {
        return this._bookkeeper.showOdds();
    }

    public showBets(): string {
        if (this._race.hasEnded()) {
            return `⚠️ There is no active race`;
        }
        return this._bookkeeper.toString();
    }

    // =============
    // Race commands
    // =============

    /** 
     * Creates a new races and starts it, or joins the specified user to the current race.
     * @param user The user to join the race (either the first user or a later user).
     */
    public startOrJoinRace(user: User): string {
        // Check if a race has already started. If so, join the player to the race.
        if (this._race.hasStarted()) {
            return this._race.join(user);
        }

        // Check if the horses have started running. If so, deny the player to join/start a new race.
        if (this._race.isRunning()) {
            return `⚠️ The race has already started. You can join the next one.`;
        }

        // Check if the race has ended and is cleaned up. If not, deny the player to start a new race.
        if (this._race.hasEnded() && this._race.timeUntilNextRace() > 0) {
            let duration = Util.getTimeDescription(Math.ceil(this._race.timeUntilNextRace() / 1000));
            return `🧹 The previous race is being cleaned up. Please wait ${duration} before starting a new race.`;
        }

        // Check if the user has enough points to start a new race.
        let raceInlay = this._plugin.parseNumber(this._chat.getSetting(Plugin.RACE_INLAY));
        if (user.score < raceInlay) {
            return `⚠️ You do not have enough points to start a new race.`;
        }

        // Check if the race has ended (only reached if timeUntilNextRace() is equal or less than 0). If so, create a new race.
        if (this._race.hasEnded()) {
            this._race = new Race(this, this._race, this._bookkeeper);
        }

        return this._race.start(user);
    }

    /**
     * Injects the specified amount of drugs into your own horse.
     * @param user The user that is injecting the horse.
     * @param params The parameters containing the amount of drugs to inject.
     */
    public dopeHorse(user: User, params: string[]): string {
        // Check if the race has started or if the horses have started running. If so, deny the player to inject dope.
        if (!this._race.hasStarted() && !this._race.isRunning()) {
            return `⚠️ There is no active race or horse to inject dope on.`;
        }

        if (params.length === 0) {
            return `⚠️ You must specify the amount of dope to inject.`;
        }

        let amount = this._plugin.parseNumber(params[0], user);
        if (Validation.IsZeroOrNegative(amount) || !Validation.IsInteger(amount) || amount === null) {
            return `⚠️ The number must be a whole, positive number`;
        }

        if (amount === null) {
            return `⚠️ You don't have enough points`;
        }

        if (user.score < amount) {
            return `⚠️ You don't have that amount of points`;
        }

        return this._race.injectDope(user, amount);
    }

    /**
     * Injects drugs into the specified horse.
     * This method is used later when multiple drug types are introduced.
     * @param user The user that is injecting the horse.
     * @param drugs The drugs that are injected into the horse.
     */
    public injectDrugs(user: User, drugs: IDrugs): string {
        if (drugs === null) {
            return `⚠️ The drugs are bad/expired.`;
        }

        return this._race.injectDrugs(user, drugs);
    }

    // ===================
    // Statistics commands
    // ===================

    /**
     * Shows the statistics of the current chat.
     * @param params The parameters of the command containing (if provided) a user to get the statistics from.
     * @param user The user from a reply message to get the statistics from.
     */
    public showStats(params: string[], user: User = null): string {
        if (params.length > 0) {
            params[0] = params[0].replace('@', '');
            user = Array.from(this._chat.users.values()).filter(u => u.name.toLowerCase() === params[0].toLowerCase())[0];
        }

        if (user !== null && user !== undefined) {
            return this._statistics.getUserStatisticsString(user);
        }

        return this._statistics.toString();
    }
}
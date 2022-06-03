import TelegramBot from "node-telegram-bot-api";
import { Chat } from "../../src/chat/chat";
import { User } from "../../src/chat/user/user";
import { Plugin } from "../DankTimesBot-Plugin-HorseRaces/plugin";
import { Bookkeeper } from "./bookkeeper/bookkeeper";
import { DankTimeOddsProvider } from "./bookkeeper/dankTime-odds-provider";
import { DankTime } from "../../src/dank-time/dank-time"
import { StatisticsRegistry } from "./bookkeeper/statistics/statistics-registry";
import { Race } from "./race/race";

export class ChatManager {

    private readonly SELF_BET_KEYWORDS = ['me', 'self'];
    private readonly ALL_IN_KEYWORDS = ['all', 'all-in', 'allin'];

    private activeRace: Race = null;
    private dankTimeBookkeeper: Bookkeeper;
    private oddsProvider: DankTimeOddsProvider;
    private activeDankTime: DankTime[];
    private activeUsers: Map<number, Date>;

    /**
     * Create a new chat manager.
     * @param chat The chat to create the ChatManager for.
     * @param plugin The calling plugin for the chat manager.
     * @param statistics The statistics class from storage to update.
     */
    constructor(
        public chat: Chat,
        private plugin: Plugin,
        public statistics: StatisticsRegistry = new StatisticsRegistry()) {

        // Check if there are users that are not yet in statistics.
        this.statistics.createMissingUsers(Array.from(this.chat.users.values()));

        // Create the odds providers and bookkeepers.
        this.oddsProvider = new DankTimeOddsProvider(this, this.statistics.userStatistics);
        this.dankTimeBookkeeper = new Bookkeeper(this, this.oddsProvider, false);
        this.activeDankTime = [];
        this.activeUsers = new Map<number, Date>();
    }

    /**
     * Send a message to the chat.
     * @param msg The message to send.
     */
    public sendMessage(msg: string) : Promise<void | TelegramBot.Message> {
        if (msg.length > 0) {
            return this.plugin.send(this.chat.id, msg);
        }

        return Promise.resolve(null);
    }

    public updateMessage(msg: string, messageId: number) : Promise<boolean | void | TelegramBot.Message> {
        if (msg.length > 0) {
            return this.plugin.update(this.chat.id, messageId, msg);
        }

        return Promise.resolve(null);
    }

    /**
     * Create a new horse race event.
     */
    public createEvent(user: User): string {
        this.activeUsers.set(user.id, new Date());

        // Check if there is already a horse race active
        if (this.activeRace != null && !this.activeRace.hasEnded) {
            return this.activeRace.toString();
        }

        // Check if the previous race is being cleaned up.
        if (this.activeRace != null && this.activeRace.getTimeUntilNextRace() > 0) {
            return `The previous horse race is being cleaned up. The next race can be started in ${this.activeRace.getTimeUntilNextRace()} minute(s).`;
        }

        // Check/Get the cheaters from the previous game
        var cheatersFromPreviousRace = [];
        if (this.activeRace != null) {
            cheatersFromPreviousRace = this.activeRace.cheaters;
        }

        // Create the race
        this.activeRace = new Race(this, cheatersFromPreviousRace);
        this.statistics.statistics.racesHeld++;

        return ``;
    }

    /**
     * Create a new bet
     * @param chat The chat the bet is created in.
     * @param user The user that placed the bet.
     * @param msg The original message.
     * @param match The parameters of the message.
     */
    public bet(chat: Chat, user: User, msg: TelegramBot.Message, match: string): string {
        var currentIndex = 0;
        var betPlacer = user;
        var onUser = null;
        var params = match.split(' ').filter(i => i);

        // Check that there are parameters.
        if (params.length == 0) {
            return `Places a bet on the specified user with the selected odds for the specified amount.\n\nFormat: ${this.printBetCmdFormat()}\n\n` +
                `Or reply to a user with format:\n${this.printSimplifiedBetCmdFormat()}\n\n` +
                `A list of named odds can be found in the top row when typing the /${Plugin.ODDS_CMD[0]} command.`;
        }

        // Get the bookkeeper to bet on
        var bookkeeperName = params[currentIndex];
        currentIndex++;

        // Get the user the bet is placed on. Either from the reply message or as the first parameter.
        var userFound = this.getUserFromInput(params[currentIndex], user, msg);
        if (userFound[1]) {
            currentIndex++;
        }
        onUser = userFound[0];

        // Check that there is a user to place the bet on.
        if (onUser == null || typeof (onUser) == 'undefined' || !Array.from(chat.users.keys()).includes(onUser.id)) {
            return `⚠️ You cannot place a bet on this user.\nFormat: ${this.printBetCmdFormat()}\n\n` +
                `Or reply to a user with format:\n${this.printSimplifiedBetCmdFormat()}\n\n` +
                `A list of named odds can be found in the top row when typing the /${Plugin.ODDS_CMD[0]} command.`;;
        }

        this.activeUsers.set(betPlacer.id, new Date());
        this.activeUsers.set(onUser.id, new Date());

        var command = params[currentIndex];
        if (!this.validateNumberIsPositive(params[currentIndex + 1]) && !this.ALL_IN_KEYWORDS.includes(params[currentIndex + 1])) {
            return `⚠️ The number must be a positive, non-zero number`;
        }
        var amount = Number(params[currentIndex + 1]);
        if (this.ALL_IN_KEYWORDS.includes(params[currentIndex + 1])) {
            amount = betPlacer.score;
        }

        // Check that the placer of the bet has enough points to place the bet.
        if (betPlacer.score < amount) {
            return `⚠️ You don't have enough points!`;
        }

        // Find the correct bookkeeper for the bet and place it.
        if (bookkeeperName == 'race' && this.activeRace == null) {
            return `⚠️ There is no race bookkeeper active to place a bet.`;
        }
        else if (bookkeeperName == 'race' && this.activeRace != null) {
            return this.activeRace.bet(betPlacer, onUser, command, amount);
        }
        else if (bookkeeperName == 'danktime') {
            if (this.activeDankTime.length > 0) {
                return `There is an active dank time. You cannot place a bet now.`;
            }

            return this.dankTimeBookkeeper.bet(betPlacer, onUser, command, amount);
        } else {
            return `⚠️ Incorrect format!\nUse: ${this.printBetCmdFormat()}`;
        }
    }

    /**
     * Print the odds of bets that can be made.
     * @param match The parameters of the message.
     */
    public odds(user: User, match: string): string {
        this.activeUsers.set(user.id, new Date());

        var params = match.split(' ').filter(i => i);

        // Print the odds for the races.
        if (params.length > 0 && params[0] == 'race') {
            if (this.activeRace != null) {
                return this.activeRace.printOdds();
            } else {
                return `⚠️ There is no race bookkeeper to get the odds from.`;
            }
        }
        // Print the odds for the dank times.
        else if (params.length > 0 && params[0] == 'danktime') {
            return this.oddsProvider.toString();
        }

        return `Incorrect format. Use: ${this.printOddsCmdFormat()}`;
    }

    /**
     * Inject a horse with drugs to improve its speed.
     * @param user The user that injects its horse.
     * @param match The parameters of the message.
     */
    public dope(user: User, match: string): string {
        this.activeUsers.set(user.id, new Date());

        var params = match.split(' ').filter(i => i);

        // Check if there is an active race.
        if (this.activeRace == null || this.activeRace.hasEnded) {
            return `There is no horse race active to use the drugs on. 🏇🏇`;
        }

        // Get the amount of drugs to inject.
        if (params.length == 0) {
            return `Specify the amount of points you want invest in drugs 💉\nFormat: ${this.printDopeCmdFormat()}`;
        }

        // Check if the user wants to bet all points.
        var amount = Number(params[0]);
        if (this.ALL_IN_KEYWORDS.includes(params[0])) {
            amount = user.score;
        }
        else if (!this.validateNumberIsPositive(params[0])) {
            return `⚠️The amount of drugs must be a positive, non-zero number.\nFormat: ${this.printDopeCmdFormat()}`;
        }

        return this.activeRace.injectHorse(user, amount);
    }

    /**
     * Shows all bets currently made and waiting for verification.
     * @param match The parameters of the message.
     */
    public showBets(user: User, match: string): string {
        this.activeUsers.set(user.id, new Date());

        var params = match.split(' ').filter(i => i);

        // Print the bets made in the current race
        if (params.length > 0 && params[0] == 'race') {
            if (this.activeRace != null) {
                return this.activeRace.printBets();
            } else {
                return `⚠️ There is no race bookkeeper to get the bets from.`;
            }
        }
        // Print the bets made for dank times.
        else if (params.length > 0 && params[0] == 'danktime') {
            return this.dankTimeBookkeeper.toString();
        }

        return this.printBetsCmdFormat();
    }

    public printStatistics(user: User, msg: TelegramBot.Message, match: string): string {
        this.activeUsers.set(user.id, new Date());

        var params = match.split(' ').filter(i => i);

        // Get the user the stats are requested from. Either from the reply message or as the first parameter.
        var userFound = this.getUserFromInput(params[0], user, msg);

        return this.statistics.getString(userFound[0]);
    }

    public dankTimeStarted(dankTime: DankTime) {
        if (this.activeDankTime == null) {
            this.activeDankTime = [];
        }

        this.activeDankTime.push(dankTime);
    }

    public dankTimeEnded(dankTime: DankTime, users: User[]) {
        this.activeDankTime = this.activeDankTime.filter((dt) => dt.hour != dankTime.hour || dt.minute != dankTime.minute || dt.isRandom != dankTime.isRandom);

        if (users.length > 0) {
            this.dankTimeBookkeeper.handleWinners(users);
            this.statistics.processDankTimeWinners(users);
        }
    }

    public getActiveUsers(): User[] {
        var activeUsers = new Set<User>();
        var moment = require('moment');
        var moment_tz = require('moment-timezone');

        for (let user of Array.from(this.chat.users.values())) {
            var lastScoreTimestamp = moment(user.lastScoreTimestamp * 1000).tz(this.chat.timezone);
            var currentTimestamp = moment().tz(this.chat.timezone);
            if (lastScoreTimestamp > currentTimestamp.subtract(1, 'days')) {
                activeUsers.add(user);
            }
        }

        var millisecondsInDay = 24 * 60 * 60 * 1000;
        var yesterday = new Date().getTime() - millisecondsInDay;
        for (let user of Array.from(this.activeUsers)) {
            if (user[1].getTime() > yesterday) {
                activeUsers.add(this.chat.users.get(user[0]));
            }
        }

        return Array.from(activeUsers.values());
    }

    public triggerOddsUpdate() {
        if (!this.dankTimeBookkeeper.hasBets()) {
            this.dankTimeBookkeeper.updateOdds();
        }
    }

    private printFormat(command: string, params: string[]): string {
        var paramsString = ``;
        params.forEach(p => {
            paramsString += `[${p}] `;
        });

        return `/${command} ${paramsString}`;
    }

    private getUserFromInput(input: string, caller: User, msg: TelegramBot.Message): [User, boolean] {
        var userFromInput = null;
        var parsedString = false;
        if (msg.reply_to_message != null) {
            userFromInput = this.chat.users.get(msg.reply_to_message.from.id);

            // If the user does not exist in the chat, create the user if it is not a bot.
            if (userFromInput == null && !msg.reply_to_message.from.is_bot) {
                userFromInput = this.chat.getOrCreateUser(msg.reply_to_message.from.id, msg.reply_to_message.from.username);
            }
        } else if (input != null && typeof (input) != 'undefined') {
            var username = input;
            if (username[0] == '@') {
                username = username.replace('@', '');
            }

            if (this.SELF_BET_KEYWORDS.includes(username)) {
                userFromInput = caller;
            }

            for (let user of Array.from(this.chat.users.values())) {
                if (user.name == username) {
                    userFromInput = user;
                }
            }

            if (userFromInput == null) {
                var possibleUsers = Array.from(this.chat.users.values()).filter((u) => u.name.toLowerCase() == username.toLowerCase());
                if (possibleUsers.length == 1) {
                    userFromInput = possibleUsers[0];
                }
            }

            parsedString = true;
        }

        return [userFromInput, parsedString];
    }

    private printBetCmdFormat() {
        return this.printFormat(Plugin.BET_CMD[0], ['danktime|race', 'user', 'named odds', 'amount']);
    }

    private printSimplifiedBetCmdFormat() {
        return this.printFormat(Plugin.BET_CMD[0], ['danktime|race', 'named odds', 'amount']);
    }

    private printOddsCmdFormat() {
        return this.printFormat(Plugin.ODDS_CMD[0], ['danktime|race']);
    }

    private printDopeCmdFormat() {
        return this.printFormat(Plugin.DOPE_CMD[0], ['amount']);
    }

    private printBetsCmdFormat() {
        return this.printFormat(Plugin.BETS_CMD[0], ['danktime|race']);
    }

    private validateNumberIsPositive(value: any): boolean {
        var num = Number(value);
        return !Number.isNaN(num) && num > 0;
    }
}

export class SerializableChatManager {
    constructor(public chatId: number, public statistics: StatisticsRegistry = new StatisticsRegistry()) { }
}
import TelegramBot from "node-telegram-bot-api";
import { Chat } from "../../src/chat/chat";
import { User } from "../../src/chat/user/user";
import { ChatMessageEventArguments } from "../../src/plugin-host/plugin-events/event-arguments/chat-message-event-arguments";
import { Plugin } from "../DankTimesBot-Plugin-HorseRaces/plugin";
import { Bookkeeper } from "./bookkeeper/bookkeeper";
import { DankTimeOddsProvider } from "./bookkeeper/dankTimeOddsProvider";
import { DankTime } from "./bookkeeper/statistics/dankTime";
import { DankTime as DankTimeSrc } from "../../src/dank-time/dank-time"
import { StatisticsRegistry } from "./bookkeeper/statistics/statisticsRegistry";
import { Race } from "./race/race";
import { DankTimeInfo } from "./bookkeeper/dankTimeInfo";

export class ChatManager {

    private activeRace: Race = null;
    private dankTimeBookkeeper: Bookkeeper;
    private randomTimeBookkeeper: Bookkeeper;
    private oddsProvider: DankTimeOddsProvider;
    private randomOddsProvider: DankTimeOddsProvider;
    private nextOrActiveDankTime: DankTimeInfo;
    private nextOrActiveRandomDankTime: DankTimeInfo;
    private dankTimeEventTimeoutId: any;

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

        var randomOddsModifier = Number(this.chat.getSetting(Plugin.RANDOM_ODDS_MODIFIER_SETTING));

        // Create the odds providers and bookkeepers.
        this.oddsProvider = new DankTimeOddsProvider(this, this.statistics.dankTimeStatistics);
        this.randomOddsProvider = new DankTimeOddsProvider(this, this.statistics.randomTimeStatistics, randomOddsModifier);
        this.dankTimeBookkeeper = new Bookkeeper(this, this.oddsProvider, false);
        this.randomTimeBookkeeper = new Bookkeeper(this, this.randomOddsProvider, false);
    }

    /**
     * Send a message to the chat.
     * @param msg The message to send.
     */
    public sendMessage(msg: string) {
        if (msg.length > 0) {
            this.plugin.send(this.chat.id, msg);
        }
    }

    /**
     * Create a new horse race event.
     */
    public createEvent(): string {
        // Check if there is already a horse race active
        if (this.activeRace != null && !this.activeRace.hasEnded) {
            return `There is already a horse race active.`;
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

        var priceMoney = this.chat.getSetting(Plugin.HORSERACE_PAYOUT_SETTING);
        return `🏇🏇 A new horse race was started. 🏇🏇\n\nBets for this race can be made in the next ${this.chat.getSetting(Plugin.HORSERACE_DURATION_SETTING)} minutes.\n🥇 1st place gets ${priceMoney} points. 🥇`;
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
            return `Incorrect format!\nUse: ${this.printBetCmdFormat()}\n` +
                `Or reply to a user with format: ${this.printSimplifiedBetCmdFormat()}`;
        }

        // Get the user the bet is placed on. Either from the reply message or as the first parameter.
        if (msg.reply_to_message != null) {
            onUser = chat.users.get(msg.reply_to_message.from.id);

            // If the user does not exist in the chat, create the user if it is not a bot.
            if (onUser == null && !msg.reply_to_message.from.is_bot) {
                onUser = chat.getOrCreateUser(msg.reply_to_message.from.id, msg.reply_to_message.from.username);
            }
        } else {
            var username = params[currentIndex];
            if (username[0] == '@') {
                username = username.replace('@', '');
            }

            for (let user of Array.from(chat.users.values())) {
                if (user.name == username) {
                    onUser = user;
                }
            }
            currentIndex++;
        }

        // Check that there is a user to place the bet on.
        if (onUser == null || typeof (onUser) == 'undefined' || !Array.from(chat.users.keys()).includes(onUser.id)) {
            return `⚠️ You cannot place a bet on this user.\nFormat: ${this.printBetCmdFormat()}`;
        }

        var command = params[currentIndex];
        var amount = Number(params[currentIndex + 1]);
        var bookkeeper = params[currentIndex + 2];

        // Check that the placer of the bet has enough points to place the bet.
        if (betPlacer.score < amount) {
            return `⚠️ You don't have enough points!`;
        }

        // Find the correct bookkeeper for the bet and place it.
        if (bookkeeper == 'race' && this.activeRace == null) {
            return `⚠️ There is no race bookkeeper active to place a bet.`;
        }
        else if (bookkeeper == 'race' && this.activeRace != null) {
            return this.activeRace.bet(betPlacer, onUser, command, amount);
        }
        else if (bookkeeper == 'random') {
            this.nextOrActiveRandomDankTime = this.findNextDankTime(this.chat.randomDankTimes);
            if (this.nextOrActiveRandomDankTime.isActive()) {
                return `There is an active dank time. You cannot place a bet now.`;
            }

            return this.randomTimeBookkeeper.bet(betPlacer, onUser, command, amount);
        }
        else {
            this.nextOrActiveDankTime = this.findNextDankTime(this.chat.dankTimes);
            if (this.nextOrActiveDankTime.isActive()) {
                return `There is an active dank time. You cannot place a bet now.`;
            }

            return this.dankTimeBookkeeper.bet(betPlacer, onUser, command, amount);
        }
    }

    /**
     * Print the odds of bets that can be made.
     * @param match The parameters of the message.
     */
    public odds(match: string): string {
        var params = match.split(' ').filter(i => i);

        // Print the odds for the races.
        if (params.length > 0 && params[0] == 'race') {
            if (this.activeRace != null) {
                return this.activeRace.printOdds();
            } else {
                return `⚠️ There is no race bookkeeper to get the odds from.`;
            }
        }
        // Print the odds for random dank times.
        else if (params.length > 0 && params[0] == 'random') {
            return this.randomOddsProvider.toString();
        }
        // Print the format of the odds command when an unknown command is given.
        else if (params.length > 0) {
            return this.printOddsCmdFormat();
        }
        // Print the odds for the dank times.
        else {
            return this.oddsProvider.toString();
        }
    }

    /**
     * Inject a horse with drugs to improve its speed.
     * @param user The user that injects its horse.
     * @param match The parameters of the message.
     */
    public dope(user: User, match: string): string {
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
        if (params[0] == 'all') {
            amount = user.score;
        }

        // Check if the number is positive and non-zero.
        if (Number.isNaN(amount) || amount < 1) {
            return `⚠️The amount of drugs must be a positive, non-zero number.\nFormat: ${this.printDopeCmdFormat()}`;
        }

        return this.activeRace.injectHorse(user, amount);
    }

    /**
     * Shows all bets currently made and waiting for verification.
     * @param match The parameters of the message.
     */
    public showBets(match: string): string {
        var params = match.split(' ').filter(i => i);

        // Print the bets made in the current race
        if (params.length > 0 && params[0] == 'race') {
            if (this.activeRace != null) {
                return this.activeRace.printBets();
            } else {
                return `⚠️ There is no race bookkeeper to get the bets from.`;
            }
        }
        // Print the bets made for random dank times.
        else if (params.length > 0 && params[0] == 'random') {
            return this.randomTimeBookkeeper.toString();
        }
        // Print the format when an incorrect format is used.
        else if (params.length > 0) {
            return this.printBetsCmdFormat();
        }
        // Print the bets made for dank times.
        else {
            return this.dankTimeBookkeeper.toString();
        }
    }

    /**
     * Handle a message posted by a user.
     * @param data The message data of the posted message.
     */
    public handleMessage(data: ChatMessageEventArguments) {
        // When a new message arrives (whatever the message is) check if the upcoming dank time is already past.
        var nextDankTime = this.findNextDankTime(this.chat.dankTimes);
        var nextRandomDankTime = this.findNextDankTime(this.chat.randomDankTimes);
        if (this.nextOrActiveDankTime != null && nextDankTime.dankTime != this.nextOrActiveDankTime.dankTime) {
            this.dankTimeBookkeeper.handleWinners([]);
            this.nextOrActiveDankTime = nextDankTime;
        }
        if (this.nextOrActiveRandomDankTime != null && nextRandomDankTime.dankTime != this.nextOrActiveRandomDankTime.dankTime) {
            this.randomTimeBookkeeper.handleWinners([]);
            this.nextOrActiveRandomDankTime = nextRandomDankTime;
        }

        // Check if there are users in the chat that are not yet tracked in statistics.
        this.statistics.createMissingUsers(Array.from(this.chat.users.values()));

        // If the message is not a text message, skip it.
        if (data.msg.text != null) {
            // Update the statistics and check if the message is a response to a dank time.
            var dankTime = this.statistics.handleRawMessage(data);

            // If there is a dank time, set the timeout when the dank time is passed and bets are evaluated.
            if (dankTime != null) {
                clearTimeout(this.dankTimeEventTimeoutId);
                this.dankTimeEventTimeoutId = setTimeout(this.dankTimeEventPassed.bind(this, dankTime), dankTime.getMillisecondsBeforeEnd());
            }
        }
    }

    /**
     * Handle when a dank time has passed and bets need to be rewarded
     * @param dankTime The dank time that has passed
     */
    private dankTimeEventPassed(dankTime: DankTime) {
        this.statistics.processActiveDankTime();

        var userIds = dankTime.getUsers();
        var users = [];
        userIds.forEach(userId => {
            users.push(this.chat.users.get(userId));
        });

        if (dankTime.isRandom) {
            this.randomTimeBookkeeper.handleWinners(users);
        } else {
            this.dankTimeBookkeeper.handleWinners(users);
        }
    }

    private findNextDankTime(dankTimes: DankTimeSrc[]): DankTimeInfo {
        var moment_tz = require('moment-timezone');

        // Create a list of dank times
        var dankTimeTimes = [];
        for (let dt of dankTimes) {
            var moment = moment_tz().tz(this.chat.timezone).startOf('day').hour(dt.hour).minute(dt.minute);
            dankTimeTimes.push(new DankTimeInfo(this.chat, moment.clone(), moment.clone().add(1, 'minutes'), dt));
            dankTimeTimes.push(new DankTimeInfo(this.chat, moment.clone().add(1, 'days'), moment.clone().add(1, 'minutes').add(1, 'days'), dt));
        }

        // Find the upcoming (or active) dank time
        var sortedDankTimes = dankTimeTimes.sort((a, b) => a.from - b.from);
        var nextDankTime = null;
        var now = moment_tz().tz(this.chat.timezone);
        for (let dt of sortedDankTimes) {
            if (dt.till > now) {
                nextDankTime = dt;
                break;
            }
        }

        // Check if the upcoming dank time is active
        if (nextDankTime.from >= now && nextDankTime.till < now) {
            nextDankTime.isActive = true;
        }

        return nextDankTime;
    }

    private printFormat(command: string, params: string[]): string {
        var paramsString = ``;
        params.forEach(p => {
            paramsString += `[${p}] `;
        });
        
        return `/${command} ${paramsString}`;
    }

    private printBetCmdFormat() {
        return this.printFormat(Plugin.BET_CMD[0], ['user', 'command', 'amount', '&lt;empty>|race|random']);
    }

    private printSimplifiedBetCmdFormat() {
        return this.printFormat(Plugin.BET_CMD[0], ['command', 'amount', '&lt;empty>|race|random']);
    }

    private printOddsCmdFormat() {
        return this.printFormat(Plugin.ODDS_CMD[0], ['&lt;empty>|race|random']);
    }

    private printDopeCmdFormat() {
        return this.printFormat(Plugin.DOPE_CMD[0], ['amount']);
    }

    private printBetsCmdFormat() {
        return this.printFormat(Plugin.BETS_CMD[0], ['&lt;empty>|race|random']);
    }
}

export class SerializableChatManager {
    constructor(public chatId: number, public statistics: StatisticsRegistry = new StatisticsRegistry()) { }
}
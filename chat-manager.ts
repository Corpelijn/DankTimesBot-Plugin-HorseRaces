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
            var timeLeft = new Date(new Date(0).setUTCSeconds(this.activeRace.getTimeUntilEndOfRace() / 1000));
            var time = '';
            if (timeLeft.getUTCHours() != 0) {
                var hours = timeLeft.getUTCHours();
                time += (hours < 10 ? '0' + hours : hours.toString()) + ':';
            }

            var minutes = timeLeft.getUTCMinutes();
            time += (minutes < 10 ? '0' + minutes : minutes.toString()) + ':';
            var seconds = timeLeft.getUTCSeconds();
            time += (seconds < 10 ? '0' + seconds : seconds.toString());

            return `There is already a horse race active.\nThe race ends in ${time}.`;
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
        var cheaters = cheatersFromPreviousRace.map(c => this.chat.users.get(c).name);
        var message = `🏇🏇 A new horse race was started. 🏇🏇\n\nBets for this race can be made in the next ${this.chat.getSetting(Plugin.HORSERACE_DURATION_SETTING)} minutes.\n🥇 1st place gets ${priceMoney} points. 🥇`;

        if (cheaters.length > 0) {
            message += `\n\n❌ The horse${cheaters.length > 1 ? 's' : ''} from ${cheaters.join(', ')} ${cheaters.length == 1 ? 'is' : 'are'} disqualified from this race due to cheating in the previous.`;
        }

        return message;
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

            if (this.SELF_BET_KEYWORDS.includes(username)) {
                onUser = betPlacer;
            }

            for (let user of Array.from(chat.users.values())) {
                if (user.name == username) {
                    onUser = user;
                }
            }

            if (onUser == null) {
                var possibleUsers = Array.from(chat.users.values()).filter((u) => u.name.toLowerCase() == username.toLowerCase());
                if (possibleUsers.length == 1) {
                    onUser = possibleUsers[0];
                }
            }

            currentIndex++;
        }

        // Check that there is a user to place the bet on.
        if (onUser == null || typeof (onUser) == 'undefined' || !Array.from(chat.users.keys()).includes(onUser.id)) {
            return `⚠️ You cannot place a bet on this user.\nFormat: ${this.printBetCmdFormat()}\n\n` +
                `Or reply to a user with format:\n${this.printSimplifiedBetCmdFormat()}\n\n` +
                `A list of named odds can be found in the top row when typing the /${Plugin.ODDS_CMD[0]} command.`;;
        }

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
        // Print the odds for the dank times.
        else if (params.length > 0 && params[0] == 'danktime') {
            return this.oddsProvider.toString();
        }

        return this.printOddsCmdFormat();
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
        else if (!this.validateNumberIsPositive(params[0])) {
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
        // Print the bets made for dank times.
        else if (params.length > 0 && params[0] == 'danktime') {
            return this.dankTimeBookkeeper.toString();
        }

        return this.printBetsCmdFormat();
    }

    public printStatistics(chat: Chat, msg: TelegramBot.Message, match: string): string {
        var selectedUser: User = null;
        var params = match.split(' ').filter(i => i);

        // Get the user the stats are requested from. Either from the reply message or as the first parameter.
        if (msg.reply_to_message != null) {
            selectedUser = chat.users.get(msg.reply_to_message.from.id);

            // If the user does not exist in the chat, create the user if it is not a bot.
            if (selectedUser == null && !msg.reply_to_message.from.is_bot) {
                selectedUser = chat.getOrCreateUser(msg.reply_to_message.from.id, msg.reply_to_message.from.username);
            }
        } else if (params.length > 0) {
            var username = params[0];
            if (username[0] == '@') {
                username = username.replace('@', '');
            }

            for (let user of Array.from(chat.users.values())) {
                if (user.name == username) {
                    selectedUser = user;
                }
            }
        }

        return this.statistics.getString(selectedUser);
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

    private printFormat(command: string, params: string[]): string {
        var paramsString = ``;
        params.forEach(p => {
            paramsString += `[${p}] `;
        });

        return `/${command} ${paramsString}`;
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
import { AlterUserScoreArgs } from "../../../src/chat/alter-user-score-args";
import { User } from "../../../src/chat/user/user";
import { ChatManager } from "../../DankTimesBot-Plugin-HorseRaces/chat-manager";
import { Bookkeeper } from "./../bookkeeper/bookkeeper";
import { Plugin } from "./../plugin";
import { RaceHorse } from "./race-horse";
import { RaceOddsProvider } from "../bookkeeper/race-oddsprovider";
import { runInThisContext } from "vm";
import { timeStamp } from "console";
import TelegramBot from "node-telegram-bot-api";

export class Race {
    public static readonly MINUTES_TO_MILLISECONDS: number = 60000;
    public static readonly SECONDS_TO_MILLISECONDS: number = 1000;

    public hasEnded: boolean = false;
    public cheaters: number[];
    public priceMoney: number;

    private horses: Map<number, RaceHorse>;
    private bookkeeper: Bookkeeper;
    private oddsProvider: RaceOddsProvider;
    private startTime: Date;
    private preRaceDuration: number;
    private totalRoundCount: number;
    private currentRound: number;
    private roundDuration: number;
    private updateMessageId: number = null;

    /**
     * Creates a new race.
     * @param chatManager The chat manager that controls the race.
     * @param cheatersFromPreviousRace The cheaters from the previous race (if any).
     */
    constructor(private chatManager: ChatManager, private cheatersFromPreviousRace: number[]) {
        this.startTime = new Date();
        this.horses = new Map<number, RaceHorse>();
        this.currentRound = 0;

        this.preRaceDuration = Number(this.chatManager.chat.getSetting(Plugin.HORSERACE_DURATION_SETTING));
        this.totalRoundCount = Number(this.chatManager.chat.getSetting(Plugin.HORSERACE_ROUNDS_SETTING));
        this.roundDuration = Number(this.chatManager.chat.getSetting(Plugin.HORSERACE_ROUNDDURATION_SETTING));
        this.priceMoney = Number(this.chatManager.chat.getSetting(Plugin.HORSERACE_PAYOUT_SETTING));

        // Get a full list of active users
        var activeUsers = chatManager.getActiveUsers().filter(user => !cheatersFromPreviousRace.includes(user.id));
        var excludedCheaters = cheatersFromPreviousRace.map(userId => chatManager.chat.users.get(userId));
        var horses = RaceHorse.getHorses(activeUsers.length);

        var message = `🏇🏇 A new horse race is starting. 🏇🏇\n\nBets can be made in the next ${this.preRaceDuration} minutes before the race starts.\n🥇 1st place gets ${this.priceMoney} points. 🥇`;

        if (horses.length == activeUsers.length) {
            for (var i = 0; i < horses.length; i++) {
                this.horses.set(activeUsers[i].id, RaceHorse.from(horses[i], activeUsers[i], this));
            }
        }

        var horsesArray = Array.from(this.horses.values()).sort((a, b) => a.speed < b.speed ? 1 : -1);
        for (var i = 0; i < horsesArray.length; i++) {
            horsesArray[i].updatePosition(i);
        }

        if (this.horses.size > 0) {
            message += `\n\nThe starting positions are:`;
            message += this.raceLeaderboard();
        } else {
            message += `\n\n<b>❗️ There are no horses in the race. Make a bet (or do drugs) to compete.</b>`;
        }

        if (excludedCheaters.length > 0) {
            message += `\n\n❌ The horse${excludedCheaters.length > 1 ? 's' : ''} from ${this.printUserCollection(excludedCheaters.map(u => u.name))} ${excludedCheaters.length == 1 ? 'is' : 'are'} disqualified from this race due to cheating in the previous.`;
        }

        this.chatManager.sendMessage(message);

        this.oddsProvider = new RaceOddsProvider(this.horses.size);
        this.bookkeeper = new Bookkeeper(this.chatManager, this.oddsProvider, true);

        setTimeout(this.raceRound.bind(this), this.preRaceDuration * Race.MINUTES_TO_MILLISECONDS);
    }

    /**
     * Calculate the time until the next race can be started.
     */
    public getTimeUntilNextRace() {
        var raceInterval = Number(this.chatManager.chat.getSetting(Plugin.HORSERACE_INTERVAL_SETTING)) * Race.MINUTES_TO_MILLISECONDS;
        var raceDuration = this.preRaceDuration * Race.MINUTES_TO_MILLISECONDS;
        var nextStartTime = new Date(this.startTime.getTime() + raceDuration + raceInterval);

        if (nextStartTime < new Date()) {
            return 0;
        }

        return Math.ceil((nextStartTime.getTime() - new Date().getTime()) / Race.MINUTES_TO_MILLISECONDS);
    }

    /**
     * Calculate the time until the next race can be started.
     */
    public getTimeUntilEndOfRace() {
        var raceDuration = this.preRaceDuration * Race.MINUTES_TO_MILLISECONDS;
        var endTime = new Date(this.startTime.getTime() + raceDuration);

        if (endTime < new Date()) {
            return 0;
        }

        return endTime.getTime() - new Date().getTime();
    }

    public getRound(): number {
        return this.currentRound;
    }

    /**
     * Creates a new bet for a user.
     * @param placer The placer of the bet.
     * @param onUser The user the bet is placed on.
     * @param command The command/odds that is used for this bet.
     * @param amount The amount of points to bet.
     */
    public bet(placer: User, onUser: User, command: string, amount: number): string {
        if (this.hasEnded) {
            return `⚠️ The race has already ended. Start a new race to place a bet.`;
        }

        if (this.currentRound > 0) {
            return `⚠️ The race has already started. You cannot place a new bet during this stage.`
        }

        if (!this.horses.has(placer.id) && !this.createMissingHorse(placer)) {
            return `⚠️ There are no horses left to enter the race (${placer.name}).`;
        }

        if (!this.horses.has(onUser.id) && !this.createMissingHorse(onUser)) {
            return `⚠️ There are no horses left to enter the race (${onUser.name}).`;
        }

        if (this.horses.size > 1) {
            return this.bookkeeper.bet(placer, onUser, command, amount);
        } else {
            return `Bets are disabled for this race since there is only one horse in the race.`;
        }
    }

    /**
     * Prints the odds the bookkeeper is offering.
     */
    public printOdds(): string {
        return this.oddsProvider.toString();
    }

    /**
     * Prints the bets that have been made with the bookkeeper.
     */
    public printBets(): string {
        return this.bookkeeper.toString();
    }

    /**
     * Injects your own horse with drugs to improve its speed.
     * @param user The user that is injecting drugs.
     * @param amount The amount of drugs to inject.
     */
    public injectHorse(user: User, amount: number): string {
        // Checks if the selected user has been banned from this race.
        if (this.cheatersFromPreviousRace.includes(user.id)) {
            return `❌ You are disqualified from this race due to cheating on the previous race.`;
        }

        // Check if the user has enough points.
        if (user.score < amount) {
            return `⚠️ You don't have enough points!`;
        }

        if (!this.horses.has(user.id) && !this.createMissingHorse(user)) {
            return `⚠️ There are no horses left to enter the race.`;
        }

        if (!this.horses.has(user.id) && this.currentRound > 0) {
            return `⚠️ The race has already started and you don't have a horse to kill with drugs.`
        }

        var horse = this.horses.get(user.id);
        horse.inject(amount);

        this.chatManager.chat.alterUserScore(new AlterUserScoreArgs(user, -amount, Plugin.name, Plugin.HORSERACE_APPLY_DRUGS_SCORE_EVENT));

        this.chatManager.statistics.findUser(user.id).drugsUsed += amount;

        var beforeRaceTexts = [`The stable boy looks away as you inject your horse 🐴💉`,
            `A jury member looks suspicious at you while you feed your horse a special sugar cube 🐴◽️`,
            `The stable boy pretends he didn't see you do that 🐴💉`,
            `The horse grunts at you as he notices you shoved something up his ass 🐴💊`];

        var afterRaceTexts = [`The jockey finds a suitable vain and injects the drugs like a pro 🏇💉`,
            `The jockey misses the horse and stabs his own leg. You're sure he's going to be fine 🏇🩸`];

        var text = this.currentRound == 0 ? beforeRaceTexts[Math.floor(Math.random() * beforeRaceTexts.length)] : afterRaceTexts[Math.floor(Math.random() * afterRaceTexts.length)];
        return text;
    }

    public toString(): string {
        var secondsLeft = this.getTimeUntilEndOfRace();
        if (this.currentRound > 0) {
            secondsLeft = this.getTimeUntilNextRound();
        }
        var timeLeft = new Date(new Date(0).setUTCSeconds(secondsLeft / 1000));
        var time = '';
        if (timeLeft.getUTCHours() != 0) {
            var hours = timeLeft.getUTCHours();
            time += (hours < 10 ? '0' + hours : hours.toString()) + ':';
        }

        var minutes = timeLeft.getUTCMinutes();
        time += (minutes < 10 ? '0' + minutes : minutes.toString()) + ':';
        var seconds = timeLeft.getUTCSeconds();
        time += (seconds < 10 ? '0' + seconds : seconds.toString());

        var message = `There is already a horse race active.\n`;
        if (this.currentRound == 0) {
            message += `The race starts in ${time}.`;
        } else if (this.currentRound < this.totalRoundCount) {
            message += `This is round ${this.currentRound} of ${this.totalRoundCount}.\nThe next round starts in ${time}.`;
        } else {
            message += `The race ends in ${time}`;
        }

        if (this.horses.size > 0) {
            if (this.currentRound == 0) {
                message += `\n\nStarting positions:`;
            } else {
                message += `\n\nCurrent positions:`;
            }
            message += this.raceLeaderboard();
        } else {
            message += `\n\n<b>❗️ There are no horses in the race. Make a bet (or do drugs) to compete.</b>`;
        }

        return message;
    }

    private raceLeaderboard(): string {
        var message = '';
        var index = 1;
        for (let horse of Array.from(this.horses.values()).sort((a, b) => a.currentPosition < b.currentPosition ? -1 : 1)) {
            message += `\n${index}. ${horse.toString()}`;
            index ++;
        }

        return message;
    }

    private raceRound() {
        this.currentRound++;

        this.advanceRacingHorses();

        var message = `Round ${this.currentRound} of ${this.totalRoundCount} has ended.\n\nCurrent positions:`;
        message += this.raceLeaderboard();

        if (this.updateMessageId == null) {
            this.chatManager.sendMessage(message)
                .then((resp: TelegramBot.Message) => { this.updateMessageId = resp.message_id; });
        } else {
            this.chatManager.updateMessage(message, this.updateMessageId);
        }

        if (this.currentRound < this.totalRoundCount - 1) {
            setTimeout(this.raceRound.bind(this), this.roundDuration * Race.SECONDS_TO_MILLISECONDS);
        }
        else if (this.currentRound == this.totalRoundCount - 1) {
            setTimeout(this.determineWinner.bind(this), this.roundDuration * Race.SECONDS_TO_MILLISECONDS);
        }
    }

    private advanceRacingHorses() {
        var horses = Array.from(this.horses.values());
        var unhandled = Array.from(this.horses.values());

        const MAX_SPEED = 6;
        const FORWARD_MULTIPLE_MODIFIER = 1.3 * MAX_SPEED;
        const FORWARD_ONCE_MODIFIER = 0.6 * MAX_SPEED;
        const STAY_MODIFIER = 0.3 * MAX_SPEED;
        const BACKWARD_ONCE_MODIFIER = 0.1 * MAX_SPEED;
        const BACKWARD_MULTIPLE_MODIFIER = 0 * MAX_SPEED;

        for (var i = 0; i < unhandled.length; i++) {
            var horseIndex = horses.indexOf(unhandled[i]);
            var horse = horses[horseIndex];

            var modifier = (Math.random() * horse.speed) + horse.drugsTotal();
            var backwardMultiple = modifier >= BACKWARD_MULTIPLE_MODIFIER && modifier < BACKWARD_ONCE_MODIFIER;
            var backwardOnce = modifier >= BACKWARD_ONCE_MODIFIER && modifier < STAY_MODIFIER;
            var stay = modifier >= STAY_MODIFIER && modifier < FORWARD_ONCE_MODIFIER;
            var forwardOnce = modifier >= FORWARD_ONCE_MODIFIER && modifier < FORWARD_MULTIPLE_MODIFIER;
            var forwardMultiple = modifier >= FORWARD_MULTIPLE_MODIFIER;
            var multipleMove = Math.round(Math.random() * 3);

            var compareIndex = horseIndex;
            if (forwardMultiple) {
                compareIndex += multipleMove;
            } else if (forwardOnce) {
                compareIndex += 1;
            } else if (backwardOnce) {
                compareIndex -= 1;
            } else if (backwardMultiple) {
                compareIndex -= multipleMove;
            }

            if (compareIndex < 0) {
                compareIndex = -1;
            } else if (compareIndex >= horses.length) {
                compareIndex = horses.length;
            }

            if (!horse.isDead && !stay && compareIndex >= 0 && compareIndex < horses.length) {
                var horse = horses[horseIndex];
                horses[horseIndex] = horses[compareIndex];
                horses[compareIndex] = horse;
            }
        }

        var forwardIndex = 0;
        var backwardIndex = horses.length - 1;
        var horsesOrdered = new Array<RaceHorse>(horses.length);
        for (var i = 0; i < horses.length; i++) {
            if (horses[i].isDead) {
                horsesOrdered[backwardIndex] = horses[i];
                backwardIndex--;
            } else {
                horsesOrdered[forwardIndex] = horses[i];
                forwardIndex++;
            }
        }

        for (var i = 0; i < horsesOrdered.length; i++) {
            horsesOrdered[i].updatePosition(i);
        }
    }

    /**
     * Determine the winner of the race.
     */
    private determineWinner() {
        this.raceRound();

        // Let the jury check for cheaters
        if (Math.random() > 0.5) {
            var horses = Array.from(this.horses.values());
            for (var i = 0; i < horses.length; i++) {
                horses[i].juryInspect();
            }
        }

        var horses = Array.from(this.horses.values()).sort((a, b) => a.currentPosition < b.currentPosition ? -1 : 1);

        var nonCheating = horses.filter(horse => !horse.isCheatingDetected && !horse.isDead);
        var cheaters = horses.filter(horse => horse.isCheatingDetected && !horse.isDead);
        var dead = horses.filter(horse => horse.isDead);

        if (dead.length >= horses.length * 0.5 || horses.length < 3) {
            this.cancelRace(cheaters, dead);
            return;
        }

        var priceMoney = Number(this.chatManager.chat.getSetting(Plugin.HORSERACE_PAYOUT_SETTING));

        // Print the winners
        var message = '';
        if (nonCheating.length == 0) {
            message = `There are no winners.\n\n`;
        } else {
            message = `The winners of the race are:\n\n`;
            if (nonCheating.length > 0) {
                var user = nonCheating[0].getUser(this.chatManager.chat);
                message += `🥇 ${user.name}\t\t${priceMoney}\n`;
                this.chatManager.chat.alterUserScore(new AlterUserScoreArgs(user, priceMoney, Plugin.name, Plugin.HORSERACE_1ST_PLACE_WINNING_SCORE_EVENT));
                this.chatManager.statistics.findUser(user.id).raceWonFirst++;
            }
            if (nonCheating.length > 1) {
                var user = nonCheating[1].getUser(this.chatManager.chat);
                message += `🥈 ${user.name}\t\t${priceMoney * 0.5}\n`;
                this.chatManager.chat.alterUserScore(new AlterUserScoreArgs(user, priceMoney * 0.5, Plugin.name, Plugin.HORSERACE_2ND_PLACE_WINNING_SCORE_EVENT));
                this.chatManager.statistics.findUser(user.id).raceWonSecond++;
            }
            if (nonCheating.length > 2) {
                var user = nonCheating[2].getUser(this.chatManager.chat);
                message += `🥉 ${user.name}\t\t${priceMoney * 0.2}\n`;
                this.chatManager.chat.alterUserScore(new AlterUserScoreArgs(user, priceMoney * 0.2, Plugin.name, Plugin.HORSERACE_3RD_PLACE_WINNING_SCORE_EVENT));
                this.chatManager.statistics.findUser(user.id).raceWonThird++;
            }

            message += `\n`;
        }

        this.cheaters = cheaters.map((s) => s.getUser(this.chatManager.chat).id);
        if (cheaters.length > 0) {
            for (let cheater of cheaters) {
                var user = cheater.getUser(this.chatManager.chat);
                message += `❌ @${user.name} you were caught cheating and are disqualified.\n`;
                this.chatManager.chat.alterUserScore(new AlterUserScoreArgs(user, -priceMoney, Plugin.name, Plugin.HORSERACE_CHEATER_CAUGHT_SCORE_EVENT));
                this.chatManager.statistics.findUser(user.id).cheatingDetected++;
            }
            message += `Cheaters are excluded from the next race and pay ${priceMoney} points as a fine\n\n`;
        }

        if (dead.length > 0) {
            for (let deadHorse of dead) {
                var user = deadHorse.getUser(this.chatManager.chat);
                message += `🐴 @${user.name} your horse has died of an overdose. 💉\n`;
                this.chatManager.statistics.findUser(user.id).horsesDied++;
            }
        }

        for (var i = 3; i < nonCheating.length; i++) {
            this.chatManager.statistics.findUser(nonCheating[i].getUser(this.chatManager.chat).id).racesLost++;
        }

        this.chatManager.sendMessage(message);
        this.bookkeeper.handleWinners(nonCheating.map(u => u.getUser(this.chatManager.chat)));

        this.hasEnded = true;
    }

    private cancelRace(cheaters: RaceHorse[], dead: RaceHorse[]) {
        var message = ``;
        if (cheaters.length > 0) {
            message += `❌ ${this.printUserCollection(cheaters.map(c => '@' + c.getUser(this.chatManager.chat).name))} were caught cheating`;
        }
        if (cheaters.length > 0 && dead.length > 0) {
            message += ` and `;
        }
        if (dead.length > 0) {
            message += `the horses of ${this.printUserCollection(dead.map(d => '@' + d.getUser(this.chatManager.chat).name))} died.`;
        }

        if (this.horses.size < 3) {
            message += `\nBecause there are only ${this.horses.size} horse(s) in the race, the jury has decided to cancel the race. All bets are refunded.`;
        } else {
            message += `\nBecause the jury suspects foul play, they decided to cancel the race. All bets are refunded.`;
        }

        this.bookkeeper.refundBets('horseraces.betrefund');
        this.cheaters = [];

        this.chatManager.sendMessage(message);
        this.hasEnded = true;
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

    private createMissingHorse(user: User): boolean {
        var amount = this.horses.size + 1;
        var result = false;

        var horses = RaceHorse.getHorses(amount);
        var horseNames = Array.from(this.horses.values()).map(h => h.name);
        for (let horse of horses) {
            if (!horseNames.includes(horse.name)) {
                var raceHorse = RaceHorse.from(horse, user, this);
                this.horses.set(user.id, raceHorse);
                this.chatManager.sendMessage(raceHorse.toString());

                this.oddsProvider.playerCount = amount;
                this.oddsProvider.updateOdds();

                result = true;
                break;
            }
        }

        var horsesArray = Array.from(this.horses.values()).sort((a, b) => a.speed < b.speed ? 1 : -1);
        for (var i = 0; i < horsesArray.length; i++) {
            horsesArray[i].updatePosition(i);
        }

        return result;
    }

    private getTimeUntilStartOfRace() {
        var raceDuration = this.preRaceDuration * Race.MINUTES_TO_MILLISECONDS;
        var endTime = new Date(this.startTime.getTime() + raceDuration);

        if (endTime < new Date()) {
            return 0;
        }

        return endTime.getTime() - new Date().getTime();
    }

    private getTimeUntilNextRound() {
        var roundDuration = this.roundDuration * Race.SECONDS_TO_MILLISECONDS;
        var raceDuration = this.preRaceDuration * Race.MINUTES_TO_MILLISECONDS;
        var endTime = new Date(this.startTime.getTime() + raceDuration + roundDuration * this.currentRound);

        if (endTime < new Date()) {
            return 0;
        }

        return endTime.getTime() - new Date().getTime();
    }
}
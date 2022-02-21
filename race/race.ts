import { AlterUserScoreArgs } from "../../../src/chat/alter-user-score-args";
import { User } from "../../../src/chat/user/user";
import { ChatManager } from "../../DankTimesBot-Plugin-HorseRaces/chat-manager";
import { Bookkeeper } from "./../bookkeeper/bookkeeper";
import { StaticOddsProvider } from "./../bookkeeper/staticOddsProvider";
import { Plugin } from "./../plugin";
import { RaceHorse } from "./race-horse";

export class Race {
    public static readonly MINUTES_TO_MILLISECONDS: number = 60000;

    public hasEnded: boolean = false;
    public cheaters: number[];

    private horses: Map<number, RaceHorse>;
    private bookkeeper: Bookkeeper;
    private oddsProvider: StaticOddsProvider;
    private startTime: Date;

    /**
     * Creates a new race.
     * @param chatManager The chat manager that controls the race.
     * @param cheatersFromPreviousRace The cheaters from the previous race (if any).
     */
    constructor(private chatManager: ChatManager, private cheatersFromPreviousRace: number[]) {
        this.oddsProvider = new StaticOddsProvider();
        this.bookkeeper = new Bookkeeper(this.chatManager, this.oddsProvider, true);
        this.startTime = new Date();
        this.horses = new Map<number, RaceHorse>();

        // Calculate the total score.
        var totalScore = 0;
        for (let user of Array.from(this.chatManager.chat.users.values())) {
            totalScore += user.score;
        }
        var avgScore = totalScore / this.chatManager.chat.users.size / 2;
        
        // Create a race horse for each of the users in the chat.
        for (let user of Array.from(this.chatManager.chat.users.values())) {
            if (!this.cheatersFromPreviousRace.includes(user.id)) {
                this.horses.set(user.id, new RaceHorse(user, totalScore, avgScore));
            }
        }

        // Set the odds for winning
        this.oddsProvider.add('first', 'finishing first', 5, this.checkFirstToFinish.bind(this));
        this.oddsProvider.add('second', 'finishing second', 5, this.checkSecondToFinish.bind(this));
        this.oddsProvider.add('third', 'finishing third', 5, this.checkThirdToFinish.bind(this));
        this.oddsProvider.add('top3', 'finishing in the top 3', 1, this.checkTopThree.bind(this));

        setTimeout(this.determineWinner.bind(this), Number(this.chatManager.chat.getSetting(Plugin.HORSERACE_DURATION_SETTING)) * Race.MINUTES_TO_MILLISECONDS);
    }

    /**
     * Calculate the time until the next race can be started.
     */
    public getTimeUntilNextRace() {
        var raceDuration = Number(this.chatManager.chat.getSetting(Plugin.HORSERACE_DURATION_SETTING)) * Race.MINUTES_TO_MILLISECONDS;
        var raceInterval = Number(this.chatManager.chat.getSetting(Plugin.HORSERACE_INTERVAL_SETTING)) * Race.MINUTES_TO_MILLISECONDS;
        var nextStartTime = new Date(this.startTime.getTime() + raceDuration + raceInterval);

        if (nextStartTime < new Date()) {
            return 0;
        }

        return Math.ceil((nextStartTime.getTime() - new Date().getTime()) / Race.MINUTES_TO_MILLISECONDS);
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

        return this.bookkeeper.bet(placer, onUser, command, amount);
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

        var horse = this.horses.get(user.id);
        horse.inject(amount);

        this.chatManager.chat.alterUserScore(new AlterUserScoreArgs(user, -amount, Plugin.name, 'horserace.horsedope'));

        this.chatManager.statistics.statistics.drugsUsed += amount;

        return `The stable boy looks away as you inject your horse  🐴💉`;
    }

    /**
     * Determine the winner of the race.
     */
    private determineWinner() {
        // Get the final scores
        for (let horse of Array.from(this.horses.values())) {
            horse.calculateFinalScore();
        }

        // Let the jury check for cheaters
        if (Math.random() > 0.25) {
            var horsesToCheck = Math.round(Math.random() * this.horses.size);
            var horses = Array.from(this.horses.values());
            for (var i = 0; i < horsesToCheck; i++) {
                var index = Math.floor(horses.length * Math.random());
                horses[index].juryInspect();
            }
        }

        var nonCheating = Array.from(this.horses.values()).filter(horse => !horse.isCheatingDetected && !horse.isDead());
        var cheaters = Array.from(this.horses.values()).filter(horse => horse.isCheatingDetected && !horse.isDead());
        var dead = Array.from(this.horses.values()).filter(horse => horse.isDead());

        nonCheating = nonCheating.sort((a, b) => b.finalScore - a.finalScore);

        var priceMoney = Number(this.chatManager.chat.getSetting(Plugin.HORSERACE_PAYOUT_SETTING));

        // Print the winners
        var message = '';
        if (nonCheating.length == 0) {
            message = `There are no winners.\n\n`;
        } else {
            message = `The winners of the race are:\n\n`;
            if (nonCheating.length > 0) {
                message += `🥇 ${nonCheating[0].user.name}\t\t${priceMoney}\t\t${nonCheating[0].finalScore}\n`;
                this.chatManager.chat.alterUserScore(new AlterUserScoreArgs(nonCheating[0].user, priceMoney, Plugin.name, 'horserace.1stplace'));
            }
            if (nonCheating.length > 1) {
                message += `🥈 ${nonCheating[1].user.name}\t\t${priceMoney * 0.5}\t\t${nonCheating[1].finalScore}\n`;
                this.chatManager.chat.alterUserScore(new AlterUserScoreArgs(nonCheating[1].user, priceMoney * 0.5, Plugin.name, 'horserace.2ndplace'));
            }
            if (nonCheating.length > 2) {
                message += `🥉 ${nonCheating[2].user.name}\t\t${priceMoney * 0.2}\t\t${nonCheating[2].finalScore}\n`;
                this.chatManager.chat.alterUserScore(new AlterUserScoreArgs(nonCheating[2].user, priceMoney * 0.2, Plugin.name, 'horserace.3rdplace'));
            }

            message += `\n`;
        }

        this.cheaters = cheaters.map((s) => s.user.id);
        if (cheaters.length > 0) {
            for (let cheater of cheaters) {
                message += `❌ @${cheater.user.name} you were caught cheating and are disqualified.\n`;
                this.chatManager.chat.alterUserScore(new AlterUserScoreArgs(cheater.user, -priceMoney, Plugin.name, 'horserace.cheater'));
                this.chatManager.statistics.statistics.cheatersCaught++;
            }
            message += `Cheaters are excluded from the next race and pay ${priceMoney} points as a fine\n\n`;
        }

        if (dead.length > 0) {
            for (let deadHorse of dead) {
                message += `🐴 @${deadHorse.user.name} your horse has died of an overdose. 💉\n`;
                this.chatManager.statistics.statistics.horsesDied++;
            }
        }

        this.chatManager.sendMessage(message);
        this.bookkeeper.handleWinners(nonCheating.map(u => u.user));

        this.hasEnded = true;
    }

    private checkFirstToFinish(usersWinning: User[], user: User): boolean {
        return usersWinning.length > 0 && usersWinning[0].id == user.id;
    }

    private checkSecondToFinish(usersWinning: User[], user: User): boolean {
        return usersWinning.length > 1 && usersWinning[1].id == user.id;
    }

    private checkThirdToFinish(usersWinning: User[], user: User): boolean {
        return usersWinning.length > 2 && usersWinning[2].id == user.id;
    }

    private checkTopThree(usersWinning: User[], user: User): boolean {
        var result = false;
        if (usersWinning.length > 0) {
            result = result || usersWinning[0].id == user.id;
        }

        if (usersWinning.length > 1) {
            result = result || usersWinning[1].id == user.id;
        }

        if (usersWinning.length > 2) {
            result = result || usersWinning[2].id == user.id;
        }

        return result;
    }
}
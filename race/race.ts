import { User } from "../../../src/chat/user/user";
import { ChatManager } from "../chat-manager";
import { IHorse } from "./horses/ihorse";
import { RaceEntry } from "./race-entry";
import { DefaultHorse } from "./horses/default-horse";
import { DisqualifiedHorse } from "./horses/disqualified-horse";
import { DefaultJockey } from "./jockeys/default-jockey";
import { IJockey } from "./jockeys/ijockey";
import { Plugin } from "../plugin";
import { NpcUser } from "./npc-user";
import { DefaultDrugs } from "./drugs/default-drugs";
import { IDrugs } from "./drugs/idrugs";
import { Util } from "../util/util";
import { Bookkeeper } from "../bookkeeper/bookkeeper";

export class Race {

    private static readonly RACE_LENGTH_METERS = 500;  // Meters
    private static readonly SECONDS_PER_RUN_SEQUENCE = 10;  // Seconds
    private static readonly STATIC_DISTANCE_FOR_WINNERS = 10000; // Meters

    private _unclaimedHorses: DefaultHorse[];
    private _entries: Map<number, RaceEntry>;
    private _disqualified: User[];

    private _priceMoney: number;
    private _preRaceDuration: number;
    private _raceInlay: number;
    private _raceInterval: number;
    private _currentRound: number;
    private _raceCreationTime: number;
    private _raceEndTime: number;

    private _currentState: number;  // 0: Created, 1: Started, 2: Active/Running, 3: Ended

    constructor(private _chat: ChatManager, previous: Race, private _bookkeeper: Bookkeeper) {
        this._unclaimedHorses = DefaultHorse.getAll();
        this._entries = new Map<number, RaceEntry>();
        this._priceMoney = 0;
        this._currentState = 0;
        this._currentRound = 1;
        this._disqualified = new Array<User>();

        // Read the settings from the chat
        this._readSettings();

        // Create a race entry for the disqualified users (to keep track of them)
        if (previous !== null) {
            this._disqualified = previous._disqualified;
            previous._disqualified.forEach(user => {
                this._entries.set(user.id, this._createRaceEntry(user));
            });
        }
    }

    /**
     * Checks if the race has started and is in pre-race state.
     */
    public hasStarted(): boolean {
        return this._currentState === 1;
    }

    /**
     * Checks if the race is active and the horses are running.
     */
    public isRunning(): boolean {
        return this._currentState === 2;
    }

    /**
     * Checks if the race has ended.
     */
    public hasEnded(): boolean {
        return this._currentState === 3;
    }

    /** 
     * Gets the time before the next race can be started in milliseconds
     */
    public timeUntilNextRace(): number {
        return (this._raceEndTime + this._raceInterval * 60 * 1000) - new Date().getTime();
    }

    /**
     * Start the race.
     */
    public start(user: User): string {
        // Add the user who started the race to the list of participants.
        let joinResult = this._join(user);
        if (!joinResult[0]) {
            return joinResult[1];
        }

        this._currentState = 1;

        // Add two NPC players to the race
        this._entries.set(NpcUser.NPC0.id, this._createRaceEntry(NpcUser.NPC0));
        this._entries.set(NpcUser.NPC1.id, this._createRaceEntry(NpcUser.NPC1));

        // Update the race entries with the correct indexes.
        this._sortRacersBySpeed();

        // Set a timer to count down until the start of the race
        this._raceCreationTime = new Date().getTime();
        this._scheduleNextRun();

        return `🏇🏇 A new horse race is starting. 🏇🏇\n\n` +
            `Bets can be made in the next ${Util.getTimeDescription(this._preRaceDuration)} before the race starts.\n` +
            `🥇 1st place gets 60% of the points put in by the racers. 🥇\n\n` +
            `The starting positions are:\n` +
            this._getHorsesText();
    }

    /**
     * Joins the given user into the race.
     * @param user The user to join into the game.
     */
    public join(user: User): string {
        let joinResult = this._join(user);
        if (!joinResult[0]) {
            return joinResult[1];
        }

        // If there are still NPC players in the race, remove one of them.
        if (this._entries.has(NpcUser.NPC0.id)) {
            this._entries.delete(NpcUser.NPC0.id);
        } else if (this._entries.has(NpcUser.NPC1.id)) {
            this._entries.delete(NpcUser.NPC1.id);
        }

        // Sort the racers
        this._sortRacersBySpeed();

        return `${user.name} just joined the race. ${this._raceInlay} points are added to the price pot.\n\n${this._getHorsesText()}\n\nThe race will start in ${this._getTimeUntilRaceStarts()}`;
    }

    /**
     * Injects dope into the given horse.
     * @param user The user whose horse to inject with dope.
     * @param amount The amount of dope to inject into the horse.
     */
    public injectDope(user: User, amount: number): string {
        if (!this._entries.has(user.id) || this._entries.get(user.id).getHorse() instanceof DisqualifiedHorse) {
            return `⚠️ You are not a part of this race`;
        }

        this._chat.alterUserScore(user, -amount, Plugin.INJECT_DOPE);

        return this.injectDrugs(user, new DefaultDrugs(amount));
    }

    /**
     * Injects drugs into the specified horse.
     * @param user The user whose horse needs to be injected.
     * @param drugs The drugs that are injected.
     */
    public injectDrugs(user: User, drugs: IDrugs): string {
        if (!this._entries.has(user.id) || this._entries.get(user.id).getHorse() instanceof DisqualifiedHorse) {
            return `⚠️ You are not a part of this race`;
        }

        // Get the horse entry
        let entry = this._entries.get(user.id);
        // Check if the jockey is skilled enough to inject the drugs
        if (entry.getJockey().tryInjectDrugs(drugs)) {
            // Check succeeded, drugs injected into horse
            return entry.getHorse().injectDrugs(drugs, this.isRunning());
        } else {
            // Check failed, drugs injected into jockey
            return entry.getJockey().injectDrugs(drugs, this.isRunning());
        }
    }

    /**
     * Move the race one round forward.
     */
    private _run(): void {
        this._currentState = 2;

        // Move all horses forward based on their speed
        this._entries.forEach(entry => {
            // If the player has finished, add a constant value to keep them in front.
            if (entry.getTotalDistance() >= Race.RACE_LENGTH_METERS) {
                entry.addDistance(Race.STATIC_DISTANCE_FOR_WINNERS);
            } else {
                let speed = entry.getHorse().getSpeed();
                let luck = entry.getJockey().getLuck();
                let jockeySpeed = entry.getJockey().getSpeedModifier();

                // Add the luck factor to the speed
                speed = speed * luck * jockeySpeed;

                // Calculate the speed from km/h to m/s (divide by 3.6)
                let distanceTraveled = (speed / 3.6) * Race.SECONDS_PER_RUN_SEQUENCE;
                entry.addDistance(distanceTraveled);
            }
        });

        // Sort the entries based on traveled distance for printing
        this._sortRacersByDistance();

        // Print the current status
        this._chat.sendMessage(`<b>|==========|   Round ${this._currentRound}  |  500 m   |==========|</b>\n` + this._getHorsesText());

        // Do runs until all players have finished
        let aliveHorses = Array.from(this._entries.values()).filter(entry => entry.getHorse().isAlive());
        if (!aliveHorses.every(entry => entry.getTotalDistance() >= Race.RACE_LENGTH_METERS)) {
            this._scheduleNextRun();
        } else {
            setTimeout(() => this._awardWinners(), 1000);
        }

        this._currentRound += 1;
    }

    private _scheduleNextRun(): void {
        let timeout = 15000;
        if (this._currentState === 1) {
            timeout = this._preRaceDuration * 1000;
        }

        setTimeout(() => this._run(), timeout);
    }

    /**
     * Awards the winners of the race and does all the rest of stuff after the race.
     */
    private _awardWinners(): void {
        this._currentState = 3;

        this._findCheaters();

        let sortedEntries = this._sortRacersByDistance();
        sortedEntries = sortedEntries.filter(entry => !entry.isDisqualified() && !entry.isDead());

        // Get the winners
        let first = sortedEntries[0] || null;
        let second = sortedEntries[1] || null;
        let third = sortedEntries[2] || null;

        // Payout the price money
        this._payRacersPriceMoney(first, second, third);
        // Get the winers message
        let message = this._getWinnersMessage(first, second, third);
        message += `\n\n` + this._getDeadAndDisqualifiedUsersMessage();

        this._updateWinnerStatistics(first, second, third);

        this._chat.sendMessage(message);

        this._payBetWinners(sortedEntries);
        this._payJockeys();

        this._raceEndTime = new Date().getTime();
    }

    /**
     * Pay the winners the payout of the bets they made.
     * @param winners The winners in order of finishing.
     */
    private _payBetWinners(winners: RaceEntry[]): void {
        let winnerUsers = winners.map(entry => entry.getUser());
        let winningBets = this._bookkeeper.getWinningBets(winnerUsers);

        let message = ``;

        winningBets.forEach(bet => {
            this._chat.alterUserScore(bet.getUser(), bet.getWinningAmount(), Plugin.WIN_BET);
            this._chat.getStatistics().bookkeeperBalance -= bet.getWinningAmount();
            message += `${bet.toWinningString()}\n`;
        });

        if (message.length > 0) {
            this._chat.sendMessage(message);
        }

        this._bookkeeper.clear();
    }

    /**
     * Tries to find cheaters during the race.
     */
    private _findCheaters(): void {
        this._disqualified = [];

        let aliveHorses = Array.from(this._entries.values()).filter(entry => entry.getHorse().isAlive() && !(entry.getHorse() instanceof DisqualifiedHorse));
        aliveHorses.forEach(entry => {
            if (entry.getHorse().detectDrugsUsage()) {
                this._disqualified.push(entry.getUser());
                entry.markAsCheater();
            }
        });
    }

    /**
     * Pays the races the prices they won.
     * @param first The racer in first place. Null if there is no first place.
     * @param second The racer in second place. Null if there is no second place.
     * @param third The racer in third place. Null if there is no third place.
     */
    private _payRacersPriceMoney(first: RaceEntry, second: RaceEntry, third: RaceEntry): void {
        var winnings = this._getPrices();

        // Pay the winners their money (if they are not an NPC).
        if (first !== null && !(first.getUser() instanceof (NpcUser))) {
            this._chat.alterUserScore(first.getUser(), winnings[0], Plugin.FIRST_PLACE_WINNING_EVENT);
            this._chat.getStatistics().bookkeeperBalance -= winnings[0];
        }
        if (second !== null && !(second.getUser() instanceof (NpcUser))) {
            this._chat.alterUserScore(second.getUser(), winnings[1], Plugin.SECOND_PLACE_WINNING_EVENT);
            this._chat.getStatistics().bookkeeperBalance -= winnings[1];
        }
        if (third !== null && !(third.getUser() instanceof (NpcUser))) {
            this._chat.alterUserScore(third.getUser(), winnings[2], Plugin.THIRD_PLACE_WINNING_EVENT);
            this._chat.getStatistics().bookkeeperBalance -= winnings[2];
        }
    }

    /**
     * Gets a message showing the winners and their prices.
     * @param first The user that won first place.
     * @param second The user that won second place. Null if there is no second place.
     * @param third The user that won third place. Null if there is no third place.
     */
    private _getWinnersMessage(first: RaceEntry, second: RaceEntry, third: RaceEntry): string {
        let message: string;
        if (first === null) {
            message = `There are no winners.`;
        } else {
            let winnings = this._getPrices();
            message = `<b>|==========|   Winners   |==========|</b>\n\n` +
                `🥇 ${first.getUser().name}\t\t${winnings[0]}\n`;

            if (second !== null) {
                message += `🥈 ${second.getUser().name}\t\t${winnings[1]}\n`;
            }

            if (third !== null) {
                message += `🥉 ${third.getUser().name}\t\t${winnings[2]}`;
            }
        }

        return message;
    }

    /**
     * Gets a message showing the dead and disqualified racers.
     */
    private _getDeadAndDisqualifiedUsersMessage(): string {
        let message = ``;

        let deadHorses = Array.from(this._entries.values()).filter(entry => !entry.getHorse().isAlive() && !entry.isDisqualified()).map(entry => entry.getUser().name);
        if (deadHorses.length > 0) {
            message += `☠️ The ${deadHorses.length > 1 ? 'horses' : 'horse'} of `;
            message += Util.concatNames(deadHorses);
            message += ` died\n\n`;
        }

        let cheatingUsers = Array.from(this._entries.values()).filter(entry => entry.isCaughtCheating() && !entry.isDisqualified()).map(entry => entry.getUser().name);
        if (cheatingUsers.length > 0) {
            message += `❌ The ${cheatingUsers.length > 1 ? 'horses' : 'horse'} of `;
            message += Util.concatNames(cheatingUsers);
            message += ` ${cheatingUsers.length > 1 ? 'are' : 'is'} disqualified due to drug abuse. Disqualified players are excluded from the next race and pay ${this._raceInlay} points fine for cheating.`;
        }

        return message;
    }

    /**
     * Updates the statistics for the winners.
     * @param first The user at first place.
     * @param second The user at second place.
     * @param third The user at third place.
     */
    private _updateWinnerStatistics(first: RaceEntry, second: RaceEntry, third: RaceEntry) {
        if (first !== null) {
            this._chat.getStatistics().getUserStatistics(first?.getUser()).wonFirst += 1;
        }
        if (second !== null) {
            this._chat.getStatistics().getUserStatistics(second?.getUser()).wonSecond += 1;
        }
        if (third !== null) {
            this._chat.getStatistics().getUserStatistics(third?.getUser()).wonThird += 1;
        }
        this._chat.getStatistics().racesHeld += 1;
    }

    /**
     * Pays the jockeys in the race the salary they deserve.
     */
    private _payJockeys(): void {
        let message = ``;
        Array.from(this._entries.values()).filter(entry => !entry.isDisqualified()).forEach(entry => {
            let jockey = entry.getJockey();
            let user = entry.getUser();

            let salary = jockey.getSalary();
            if (salary > user.score) {
                salary = user.score;
            }

            message += jockey.pay(salary);
        });

        if (message.length > 0) {
            setTimeout(() => this._chat.sendMessage(message), 500);
        }
    }

    /**
     * Gets the prices the first, second and third place are rewarded.
     */
    private _getPrices(): Array<number> {
        let firstWinnings = Math.floor(this._priceMoney * 0.6);
        let secondWinnings = Math.floor(this._priceMoney * 0.3);
        let thirdWinnings = Math.ceil(this._priceMoney * 0.1);

        return [firstWinnings, secondWinnings, thirdWinnings];
    }

    /**
     * Print the entries in the race in order.
     */
    private _getHorsesText(): string {
        let text = ``;
        let sortedEntries = Array.from(this._entries.values()).sort((a, b) => a.getPosition() - b.getPosition());

        sortedEntries.forEach(entry => {
            text += entry.toString() + `\n`;
        });

        return text;
    }

    /**
     * Read the settings from the chat into private fields
     */
    private _readSettings(): void {
        this._preRaceDuration = this._chat.getSetting(Plugin.PRERACE_DURATION_SETTING);
        this._raceInlay = this._chat.getSetting(Plugin.RACE_INLAY);
        this._raceInterval = this._chat.getSetting(Plugin.RACE_INTERVAL_SETTING);
    }

    /**
     * Create a race entry for the given user. An entry is created for a disqualified user (but it does not do anything).
     * @param user The user to create a entry for
     */
    private _createRaceEntry(user: User): RaceEntry {
        if (this._disqualified.some(u => u.id === user.id)) {
            // The user is disqualified, give the user a disqualified horse (no horse)
            return new RaceEntry(user, new DisqualifiedHorse(), new DefaultJockey(user.name), Race.RACE_LENGTH_METERS);
        }

        let horse: IHorse = null;
        let jockey: IJockey = null;

        // TODO: Check if the user has a horse in the <mount> slot
        // TODO: Check if the user has a jockey in the <lackey> slot

        if (horse === null) {
            // Get a random horse that has not been claimed yet
            this._unclaimedHorses = Util.shuffle(this._unclaimedHorses);
            if (this._unclaimedHorses.length > 0) {
                horse = this._unclaimedHorses.pop();
            }
        }

        if (jockey === null) {
            // Get the default jockey if the user has no jockey defined
            jockey = new DefaultJockey(user.name);
        }

        return new RaceEntry(user, horse, jockey, Race.RACE_LENGTH_METERS);
    }

    private _getTimeUntilRaceStarts(): string {
        return Util.getTimeDescription(Math.ceil(((this._raceCreationTime + this._preRaceDuration * 1000) - new Date().getTime()) / 1000));
    }

    /**
     * Sort the racers by speed and updates the race entries of the current race.
     */
    private _sortRacersBySpeed(): void {
        let sortedEntries = Array.from(this._entries.values()).sort((a, b) => a.getHorse().getSpeed() > b.getHorse().getSpeed() ? -1 : 1);
        sortedEntries.forEach((entry, index) => entry.setPosition(index));
    }

    /**
     * Sort the racers by distance and updates the race entries of the current race.
     * @returns Returns the sorted entries as an array.
     */
    private _sortRacersByDistance(): RaceEntry[] {
        let sortedEntries = Array.from(this._entries.values()).sort((a, b) => b.getTotalDistance() - a.getTotalDistance());
        sortedEntries.forEach((entry, index) => entry.setPosition(index));

        return sortedEntries;
    }

    /**
     * Joins the given user into the race.
     * If the user cannot join the game, any error messages are send directly to the bot.
     * @param user The user to join into the race.
     * @returns Returns true if the users was added; otherwise false. 
     */
    private _join(user: User): [boolean, string] {
        // If the user is already in the game, exit
        if (this._entries.has(user.id)) {
            let message = `⚠️ You are already a part of this race.\n\nThe race will start in ${this._getTimeUntilRaceStarts()}`;
            if (this._entries.get(user.id).getHorse() instanceof DisqualifiedHorse) {
                message = `⚠️ You are not allowed to join because you are disqualified.`;
            }

            return [false, message];
        }

        // Check if the user has the money
        if (user.score < this._raceInlay) {
            return [false, `⚠️ You do not have enough points to enter the race.`];
        }

        // Add the user to the race
        this._entries.set(user.id, this._createRaceEntry(user));

        // Reduct the amount of points that the user must pay
        this._chat.alterUserScore(user, -this._raceInlay, Plugin.RACE_INLAY);
        this._priceMoney += this._raceInlay;

        this._chat.getStatistics().bookkeeperBalance += this._raceInlay;
        this._chat.getStatistics().getUserStatistics(user).racesPlayed += 1;

        this._bookkeeper.add(user);

        return [true, ``];
    }
}
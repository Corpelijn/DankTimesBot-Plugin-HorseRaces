import { User } from "../../../src/chat/user/user";
import { BetOdds } from "./bet-odds";

export abstract class OddsProvider {
    protected odds: Map<string, BetOdds>;
    protected uniqueOddNames: string[];

    constructor() {
        this.odds = new Map<string, BetOdds>();
        this.uniqueOddNames = [];
    }

    /**
     * Adds a new command to register odds with.
     * @param command The command name.
     * @param user The user the command is registered with. Can be null.
     * @param description The description of the odds.
     * @param payout The amount of payout for the odds.
     * @param check The function to check if the conditions of the odds are reached.
     */
    protected set(command: string, user: User, description: string, payout: number, check: (usersWinning: User[], user: User) => boolean) {
        var finalCommand = command;
        if (user != null) {
            finalCommand = command + user.id;
        }

        if (!this.uniqueOddNames.includes(command)) {
            this.uniqueOddNames.push(command);
        }

        this.odds.set(finalCommand, new BetOdds(command, user?.id, user?.name, description, payout, check));
    }

    /**
     * Finds an odds/command for the given command and user.
     * @param command The command to find.
     * @param user The user to find. If the odds is created with a null user, this field is ignored.
     */
    public find(command: string, user: User): BetOdds {
        var odds = this.odds.get(command + user.id);
        if (odds == null) {
            return this.odds.get(command);
        }

        return odds;
    }

    public abstract toString(): string;

    public abstract updateOdds(): void;
}
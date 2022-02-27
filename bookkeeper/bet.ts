import { User } from "../../../src/chat/user/user";
import { BetOdds } from "./bet-odds";

export class Bet {
    constructor(public placer: User, public onUser: User, public odds: BetOdds, public amount: number) {

    }

    public getString(annotateUser: boolean): string {
        var onUser = this.onUser == this.placer ? 'himself' : this.onUser.name;
        var placer = (annotateUser ? '@' : '') + this.placer.name;

        return `${placer} placed a bet of ${this.amount} on ${onUser} for ${this.odds.description} with odds of 1 : ${this.odds.payout}.`;
    }
}
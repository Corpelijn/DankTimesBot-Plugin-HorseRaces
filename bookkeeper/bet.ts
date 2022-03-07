

import { BetOdds } from "./bet-odds";

export class Bet {
    constructor(public placerId: number, public placerName: string, public onUserId: number, public onUserName: string, public odds: BetOdds, public amount: number) {

    }

    public getString(annotateUser: boolean): string {
        var onUser = this.onUserId == this.placerId ? 'himself' : this.onUserName;
        var placer = (annotateUser ? '@' : '') + this.placerName;

        return `${placer} placed a bet of ${this.amount} on ${onUser} for ${this.odds.description} with odds of 1 : ${this.odds.payout}.`;
    }
}


import { User } from "../../../src/chat/user/user";
import { BetOdds } from "./bet-odds";

export class Bet {

    constructor(private _placer: User, private _onUser: User, private _odds: BetOdds, private _amount: number) {

    }

    public getAmount(): number {
        return this._amount;
    }

    public getWinningAmount(): number {
        return Math.floor(this._amount * this._odds.payout);
    }

    public getUser(): User {
        return this._placer;
    }

    public isWinner(winners: User[]): boolean {
        return this._odds.check(winners, this._onUser);
    }

    public toString(): string {
        let onUser = this._onUser.name;
        if (this._onUser.id === this._placer.id) {
            onUser = `himself`;
        }
        return `💰 ${this._placer.name} placed a bet of ${this._amount} on ${onUser} for ${this._odds.winDescription} with odds of 1 : ${this._odds.payout}.`;
    }

    public toWinningString(): string {
        let onUser = this._onUser.name;
        if (this._onUser.id === this._placer.id) {
            onUser = `himself`;
        }
        return `🤑 ${this._placer.name} was right on ${onUser} ${this._odds.winDescription} and won ${this.getWinningAmount()} points.`;
    }
}
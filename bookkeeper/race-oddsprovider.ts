import { User } from "../../../src/chat/user/user";
import { Table } from "../table/table";
import { OddsProvider } from "./odds-provider";


export class RaceOddsProvider extends OddsProvider {

    constructor(public playerCount: number) {
        super();

        super.set('first', null, 'finishing first', Math.ceil(playerCount / 2), this.checkFirstToFinish.bind(this));
        super.set('second', null, 'finishing second', Math.ceil(playerCount / 2), this.checkSecondToFinish.bind(this));
        super.set('third', null, 'finishing third', Math.ceil(playerCount / 2), this.checkThirdToFinish.bind(this));
    }

    public toString(): string {
        var table = new Table();

        for (var i = 0; i < this.uniqueOddNames.length; i++) {
            table.addColumn(this.uniqueOddNames[i]);
        }

        var values = [];
        for (var i = 0; i < this.uniqueOddNames.length; i++) {
            values.push('1:' + this.odds.get(this.uniqueOddNames[i]).payout);
        }

        table.addRow(values);
        return table.toString();
    }
    
    public updateOdds(): void {
        for (let odds of Array.from(this.odds.values())) {
            odds.payout = Math.ceil(this.playerCount / 2);
        }
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
}
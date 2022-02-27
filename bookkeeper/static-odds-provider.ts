
import { User } from "../../../src/chat/user/user";
import { Table } from "../table/table";
import { OddsProvider } from "./odds-provider";

export class StaticOddsProvider extends OddsProvider {

    public add(command: string, description: string, payout: number, check: (usersWinning: User[], user: User) => boolean) {
        super.set(command, null, description, payout, check);
    }

    /**
     * Override
     */
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

    public updateOdds() {
        // Do nothing
    }

}
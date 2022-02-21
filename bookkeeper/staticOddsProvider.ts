import { User } from "../../../src/chat/user/user";
import { OddsProvider } from "./oddsProvider";

export class StaticOddsProvider extends OddsProvider {
    
    public add(command: string, description: string, payout: number, check: (usersWinning: User[], user: User) => boolean) {
        super.set(command, null, description, payout, check);
    }

    /**
     * Override
     */
    public toString(): string {
        var message: string = ``;
        for (let odds of Array.from(this.odds.values())) {
            message += `${odds.command}  --  1 : ${odds.payout}   -   ${odds.description}\n`;
        }

        return message;
    }

    public updateOdds() {
        // Do nothing
    }

}
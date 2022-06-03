import { Drugs } from "./drugs";
import { Race } from "./race";


export class DefaultDrugs extends Drugs {

    private injectionRound: number;

    constructor(race: Race, amount: number) {
        super(race, amount);

        this.injectionRound = race.getRound();
    }

    public GetModifier(): number {
        var modifier = 1;
        if (this.race.getRound() == this.injectionRound + 1) {
            modifier = 0.66667;
        } else if (this.race.getRound() == this.injectionRound + 2) {
            modifier = 0.33333;
        } else {
            modifier = 0;
        }

        return (this.amount / this.race.priceMoney * 0.5) * modifier;
    }

}
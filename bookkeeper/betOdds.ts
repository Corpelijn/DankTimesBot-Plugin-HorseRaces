import { User } from "../../../src/chat/user/user";

export class BetOdds {
    constructor(
        public command: string, 
        public user: User,
        public description: string, 
        public payout: number,
        public check: (usersWinning: User[], user: User) => boolean) {
    }
}
import { WinStatistics } from "./winStatistics";

export class UserStatistics {

    constructor(public userId: number, public first: number = 0, public last: number = 0, public scored: number = 0) {

    }
}
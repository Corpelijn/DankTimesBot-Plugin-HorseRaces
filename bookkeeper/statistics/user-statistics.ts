
export class UserStatistics {

    constructor(
        public userId: number,
        public dankTimeScoredFirst: number = 0,
        public dankTimeScoredLast: number = 0,
        public dankTimeScored: number = 0,
        public betsWon: number = 0,
        public betsLost: number = 0,
        public betsAmountSum: number = 0,
        public horsesDied: number = 0,
        public cheatingDetected: number = 0,
        public drugsUsed: number = 0,
        public raceWonFirst: number = 0,
        public raceWonSecond: number = 0,
        public raceWonThird: number = 0,
        public racesLost: number = 0) {

    }
}
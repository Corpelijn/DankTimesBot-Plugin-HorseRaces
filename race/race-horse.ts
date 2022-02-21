import { User } from "../../../src/chat/user/user";

export class RaceHorse {

    public isCheatingDetected: boolean;
    public finalScore: number;

    private luckScore: number = 0;
    private speedScore: number = 0;
    private drugsScore: number = 0;

    private drugIntake: number = 0;
    private drugTolerance: number;
    private maxDrugIntake: number;

    constructor(public user: User, totalScore: number, avgScore: number) {
        this.luckScore = Math.random();
        this.speedScore = Math.min(user.score / avgScore, 1);
        if (this.speedScore < 0.1) {
            this.speedScore += 0.1;
        }

        this.drugTolerance = 1 - (user.score / totalScore);
        this.maxDrugIntake = user.score * this.drugTolerance * 0.05;
    }

    /**
     * Checks if the horse is cheating by using drugs.
     */
    public isCheating(): boolean {
        return this.drugIntake > 0;
    }

    /**
     * Let the jury inspect the horse.
     */
    public juryInspect() {
        if (this.isCheating() && Math.random() > 0.5) {
            this.isCheatingDetected = true;
        }
    }

    /**
     * Checks if the horse is dead.
     */
    public isDead(): boolean {
        return this.drugIntake / this.maxDrugIntake / this.drugTolerance > 1;
    }

    /**
     * Injects the horse with drugs.
     * @param amount The amount of drugs to inject.
     */
    public inject(amount: number) {
        this.drugIntake += amount;
    }

    /**
     * Calculates the final score of each horse.
     */
    public calculateFinalScore() {
        this.drugsScore = this.drugIntake / this.maxDrugIntake;
        
        if (Number.isNaN(this.drugsScore)) {
            this.drugsScore = 0;
        }

        this.finalScore = this.luckScore + this.speedScore + this.drugsScore;
    }
}
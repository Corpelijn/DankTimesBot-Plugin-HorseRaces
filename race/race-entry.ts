import { User } from "../../../src/chat/user/user";
import { DisqualifiedHorse } from "./horses/disqualified-horse";
import { IHorse } from "./horses/ihorse";
import { IJockey } from "./jockeys/ijockey";


export class RaceEntry {

    private _distance: number;
    private _distanceComplete: number;
    private _previousPosition: number;
    private _currentPosition: number;
    private _disqualified: boolean;
    private _caughtCheating: boolean;

    constructor(private _user: User, private _horse: IHorse, private _jockey: IJockey, private _totalDistance: number) {
        this._distance = 0;

        this._previousPosition = null;
        this._currentPosition = null;
        this._disqualified = this._horse instanceof DisqualifiedHorse;
        this._caughtCheating = false;
    }

    public getHorse(): IHorse {
        return this._horse;
    }

    public getJockey(): IJockey {
        return this._jockey;
    }

    public getUser(): User {
        return this._user;
    }

    public isDisqualified() : boolean {
        return this._disqualified;
    }

    public isCaughtCheating() : boolean {
        return this._caughtCheating;
    }

    public isDead() : boolean {
        return !this.getHorse().isAlive();
    }

    public addDistance(distance: number): void {
        this._distance += distance;
        this._distanceComplete = this._distance / this._totalDistance;
    }

    public getTotalDistance(): number {
        return this._distance;
    }

    public getPosition(): number {
        return this._currentPosition;
    }

    public setPosition(position: number): void {
        this._previousPosition = this._currentPosition;
        this._currentPosition = position;
    }

    public markAsCheater(): void {
        this._caughtCheating = true;
    }

    public toString(): string {
        // If the horse is disqualified, skip printing
        if (this._horse instanceof DisqualifiedHorse) {
            return ``;
        }

        let position = this._currentPosition + 1;
        let icon = this._horse.getIcon();
        let userName = this._user.name;
        let horseName = this._horse.getName();
        
        let arrows = ``;
        if (this._currentPosition !== null && this._previousPosition !== null) {
            let arrowIcon = this._currentPosition < this._previousPosition ? `⬆️` : `⬇️`;
            arrows = arrowIcon.repeat(Math.abs(this._currentPosition - this._previousPosition));
        }

        let distanceText = `${Math.floor(this._distance)} m`;
        if (this._distanceComplete >= 1) {
            distanceText = `finished`;
        }

        return `${position}. ${userName} → ${icon} ${horseName}  <i>${distanceText}</i>   ${arrows}`;
    }
}
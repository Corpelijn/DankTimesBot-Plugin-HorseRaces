

export class DankTime {
    private usersScored: Set<number> = new Set<number>();
    private startMinuteOfDankTime: Date;
    private first: number;
    private last: number;

    constructor(public texts: string[], public isRandom: boolean, userId: number) {
        this.first = userId;
        this.addUser(userId);
        this.startMinuteOfDankTime = new Date(new Date().setSeconds(0, 0));
    }

    public addUser(userId: number) {
        this.usersScored.add(userId);
        this.last = userId;
    }

    public getUsers(): number[]{
        return Array.from(this.usersScored.values());
    }

    public getMillisecondsBeforeEnd() {
        const MILLISECONDS_TO_MINUTE = 61000;
        return MILLISECONDS_TO_MINUTE - (new Date().getTime() - this.startMinuteOfDankTime.getTime());
    }
}
import { User } from "../../../../src/chat/user/user";
import { UserStatistics } from "./userStatistics";

export class WinStatistics {

    constructor(public userStatistics: UserStatistics[]) {

    }

    public createMissing(user: User) {
        var found = false;
        this.userStatistics.forEach(usr => {
            if (usr.userId == user.id) {
                found = true;
            }
        });

        if (!found) {
            this.userStatistics.push(new UserStatistics(user.id));
        }
    }

    public process(userIds: number[]) {
        for (var i = 0; i < userIds.length; i++) {
            var user = this.findUser(userIds[i]);

            if (i == 0) {
                user.first++;
            }

            user.scored++;

            if (i == userIds.length - 1 && userIds[0] != userIds[i]) {
                user.last++;
            }
        }
    }

    private findUser(userId: number): UserStatistics {
        var user = null;
        this.userStatistics.forEach(usr => {
            if (usr.userId == userId) {
                user = usr;
            }
        });
        return user;
    }
}
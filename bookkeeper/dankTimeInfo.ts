import { Chat } from "../../../src/chat/chat";
import { DankTime } from "../../../src/dank-time/dank-time";

export class DankTimeInfo {
    constructor(private chat: Chat, public from: any, public till: any, public dankTime: DankTime) {
    }

    public isActive() : boolean {
        var moment_tz = require('moment-timezone');
        var now = moment_tz().tz(this.chat.timezone);

        return this.from >= now && this.till < now;
    }
}
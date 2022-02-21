import TelegramBot from "node-telegram-bot-api";
import { User } from "../../../../src/chat/user/user";
import { ChatMessageEventArguments } from "../../../../src/plugin-host/plugin-events/event-arguments/chat-message-event-arguments";
import { DankTime } from "./dankTime";
import { Statistics } from "./statistics";
import { WinStatistics } from "./winStatistics";

/**
 * Keeps track of all statistics
 */
export class StatisticsRegistry {

    private static readonly REGEX_FIRSTSCORE = `.*? (.*?) was the first to score!.*?`;

    public dankTime: DankTime;

    constructor(public statistics: Statistics = new Statistics(), public dankTimeStatistics: WinStatistics = new WinStatistics([]), public randomTimeStatistics: WinStatistics = new WinStatistics([])) {

    }

    /**
     * Creates missing users from the statistics that exists in the chat.
     * @param users The users that exist in the chat.
     */
    public createMissingUsers(users: User[]) {
        users.forEach(user => {
            this.dankTimeStatistics.createMissing(user);
            this.randomTimeStatistics.createMissing(user);
        });
    }

    /**
     * Updates the statistics based on an active dank time.
     */
    public processActiveDankTime() {
        if (this.dankTime.isRandom) {
            this.randomTimeStatistics.process(this.dankTime.getUsers());
        } else {
            this.dankTimeStatistics.process(this.dankTime.getUsers());
        }

        this.dankTime = null;
    }

    /**
     * Handles a raw message from the chat into statistics.
     * @param msg 
     */
    public handleRawMessage(msg: ChatMessageEventArguments): DankTime {

        if (this.dankTime == null) {
            this.dankTime = this.checkForDankTimeInMessage(msg);
            if (msg.botReplies.length == 0 || !this.handleFirstDankTimeMessage(msg)) {
                this.dankTime = null;
            }
        }

        if (this.dankTime != null && this.dankTime.texts.includes(msg.msg.text) && msg.botReplies.length == 0) {
            this.handleDankTimeMessage(msg);
        }

        return this.dankTime;
    }

    private checkForDankTimeInMessage(msg: ChatMessageEventArguments): DankTime {
        var dankTime: DankTime = null;

        msg.chat.randomDankTimes.forEach(dt => {
            if (dt.texts.includes(msg.msg.text)) {
                dankTime = new DankTime(dt.texts, true, msg.user.id);
            }
        });
        msg.chat.dankTimes.forEach(dt => {
            if (dt.texts.includes(msg.msg.text)) {
                dankTime = new DankTime(dt.texts, false, msg.user.id);
            }
        });

        return dankTime;
    }

    private handleDankTimeMessage(msg: ChatMessageEventArguments) {
        this.dankTime.addUser(msg.user.id);
    }

    private handleFirstDankTimeMessage(msg: ChatMessageEventArguments): boolean {
        // Check if the reply contains the 'xxx was first to score message'
        if (new RegExp(StatisticsRegistry.REGEX_FIRSTSCORE).test(msg.botReplies[0])) {
            return true;
        }

        return false;
    }
}
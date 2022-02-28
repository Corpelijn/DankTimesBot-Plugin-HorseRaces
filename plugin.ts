import { BotCommand } from "../../src/bot-commands/bot-command";
import { Chat } from "../../src/chat/chat";
import { ChatSettingTemplate } from "../../src/chat/settings/chat-setting-template";
import { User } from "../../src/chat/user/user";
import { PluginEvent } from "../../src/plugin-host/plugin-events/plugin-event-types";
import { AbstractPlugin } from "../../src/plugin-host/plugin/plugin";
import { ChatManager, SerializableChatManager } from "./chat-manager";
import { StatisticsRegistry } from "./bookkeeper/statistics/statistics-registry";
import { PostDankTimeEventArguments } from "../../src/plugin-host/plugin-events/event-arguments/post-dank-time-event-arguments";
import { PreDankTimeEventArguments } from "../../src/plugin-host/plugin-events/event-arguments/pre-dank-time-event-arguments";


export class Plugin extends AbstractPlugin {
    // Commands
    public static readonly BET_CMD = ["hrbet"];
    public static readonly EVENT_CMD = ["hrrace", "hrstart"];
    public static readonly ODDS_CMD = ["hrodds", "hrodd"];
    public static readonly DOPE_CMD = ["hrdope", "hrdrug", "hrdrugs"];
    public static readonly STAT_CMD = ["hrstat", "hrstats"];
    public static readonly BETS_CMD = ["hrbets", "hractivebets", "hractivebet"];
    public static readonly INFO_CMD = ["horseraces", "horserace", "hrinfo"];

    // Settings
    public static readonly MAX_ODDS_SETTING = "horseraces.maxodds";
    public static readonly HORSERACE_PAYOUT_SETTING = "horseraces.racewinpayout";
    public static readonly HORSERACE_DURATION_SETTING = "horseraces.raceduration";
    public static readonly HORSERACE_INTERVAL_SETTING = "horseraces.raceinterval";

    // Score altering events
    public static readonly HORSERACE_1ST_PLACE_WINNING_SCORE_EVENT = "horserace.1stplace";
    public static readonly HORSERACE_2ND_PLACE_WINNING_SCORE_EVENT = "horserace.2ndplace";
    public static readonly HORSERACE_3RD_PLACE_WINNING_SCORE_EVENT = "horserace.3rdplace";
    public static readonly HORSERACE_APPLY_DRUGS_SCORE_EVENT = "horserace.horsedope";
    public static readonly HORSERACE_CHEATER_CAUGHT_SCORE_EVENT = "horserace.cheatercaught";
    public static readonly HORSERACE_PLACE_BET_SCORE_EVENT = "horserace.placebet";
    public static readonly HORSERACE_WIN_BET_SCORE_EVENT = "horserace.winbet";

    // Storage
    private static readonly FILE_STORAGE = "horseraces.json";

    private chatManagers = new Map<number, ChatManager>();

    constructor() {
        super("Horse Races Plugin", "1.1.1")

        this.subscribeToPluginEvent(PluginEvent.BotStartup, this.loadData.bind(this));
        this.subscribeToPluginEvent(PluginEvent.BotShutdown, this.saveData.bind(this));
        this.subscribeToPluginEvent(PluginEvent.HourlyTick, this.saveData.bind(this));
        this.subscribeToPluginEvent(PluginEvent.PreDankTime, this.preDankTime.bind(this));
        this.subscribeToPluginEvent(PluginEvent.PostDankTime, this.postDankTime.bind(this));
    }

    public send(chatId: number, msg: string) {
        super.sendMessage(chatId, msg);
    }

    /**
     * @override
     */
    public getPluginSpecificChatSettings(): Array<ChatSettingTemplate<any>> {
        return [
            new ChatSettingTemplate(Plugin.MAX_ODDS_SETTING, "the maximum odds exchange value", 10, (original) => Number(original), this.validateNotNegative.bind(this)),
            new ChatSettingTemplate(Plugin.HORSERACE_PAYOUT_SETTING, "the winnings of a horse race", 1000, (original) => Number(original), this.validateNotNegative.bind(this)),
            new ChatSettingTemplate(Plugin.HORSERACE_DURATION_SETTING, "the duration of a horse race in minutes", 15, (original) => Number(original), this.validateNotNegative.bind(this)),
            new ChatSettingTemplate(Plugin.HORSERACE_INTERVAL_SETTING, "the interval between two horse races in minutes", 60, (original) => Number(original), this.validateNotNegative.bind(this))
        ];
    }

    /**
     * @override
     */
    public getPluginSpecificCommands(): BotCommand[] {
        return [
            new BotCommand(Plugin.INFO_CMD, "prints information about the horse races plugin", this.info.bind(this), true),

            new BotCommand(Plugin.BET_CMD, "make a bet of your points on any of the horses", this.bet.bind(this), false),
            new BotCommand(Plugin.EVENT_CMD, "start a new horse race", this.event.bind(this), false),
            new BotCommand(Plugin.ODDS_CMD, "display the odds for each of the horses", this.odds.bind(this), false),
            new BotCommand(Plugin.DOPE_CMD, "give a horse an illegal boost during an event", this.dope.bind(this), false),
            new BotCommand(Plugin.STAT_CMD, "shows the horse raceing statistics", this.stats.bind(this), false),
            new BotCommand(Plugin.BETS_CMD, "shows all bets made", this.bets.bind(this), false),
        ];
    }

    private loadData(): any {
        var managers: SerializableChatManager[] = this.loadDataFromFile(Plugin.FILE_STORAGE);
        if (managers != null) {
            managers.forEach(chatmanager => {
                var chat = this.getChat(chatmanager.chatId);

                var statistics = StatisticsRegistry.fromStorage(chatmanager.statistics);

                this.chatManagers.set(chatmanager.chatId, new ChatManager(chat, this, statistics));
            });
        }
    }

    private saveData(): any {
        var managers = Array.from(this.chatManagers.values()).map(m => new SerializableChatManager(m.chat.id, m.statistics));
        this.saveDataToFile(Plugin.FILE_STORAGE, managers);
    }

    private info() {
        return `🐎🐎 Welcome to the horse races 🐎🐎\n\n` +
         `/${Plugin.BET_CMD[0]} to place a bet on a user for scoring during a dank time or race\n` +
         `/${Plugin.ODDS_CMD[0]} shows the odds the bookkeeper is willing to offer on a bet\n` +
         `/${Plugin.BETS_CMD[0]} shows the bets made the bookkeeper is currently holding\n` +
         `/${Plugin.EVENT_CMD[0]} to create a new horse race event to bet on\n` +
         `/${Plugin.DOPE_CMD[0]} to give your horse an illegal boost during an event\n` +
         `/${Plugin.STAT_CMD[0]} shows some statistics from betting and previous races`;
    }

    private bet(chat: Chat, user: User, msg: any, match: string): string {
        let chatManager = this.getChatManager(chat);
        if (chatManager !== null) {
            return chatManager.bet(chat, user, msg, match);
        }

        return ``;
    }

    private event(chat: Chat, user: User, msg: any, match: string): string {
        let chatManager = this.getChatManager(chat);
        if (chatManager !== null) {
            return chatManager.createEvent();
        }

        return ``;
    }

    private odds(chat: Chat, user: User, msg: any, match: string): string {
        let chatManager = this.getChatManager(chat);
        if (chatManager !== null) {
            return chatManager.odds(match);
        }

        return ``;
    }

    private dope(chat: Chat, user: User, msg: any, match: string): string {
        let chatManager = this.getChatManager(chat);
        if (chatManager !== null) {
            return chatManager.dope(user, match);
        }

        return ``;
    }

    private stats(chat: Chat, user: User, msg: any, match: string): string {
        let chatManager = this.getChatManager(chat);
        if (chatManager !== null) {
            return chatManager.printStatistics(chat, msg, match);
        }

        return ``;
    }

    private bets(chat: Chat, user: User, msg: any, match: string): string {
        let chatManager = this.getChatManager(chat);
        if (chatManager !== null) {
            return chatManager.showBets(match);
        }

        return ``;
    }

    private preDankTime(args: PreDankTimeEventArguments) {
        let chatManager = this.getChatManager(args.chat);
        if (chatManager !== null) {
            chatManager.dankTimeStarted(args.dankTime);
        }
    }

    private postDankTime(args: PostDankTimeEventArguments) {
        let chatManager = this.getChatManager(args.chat);
        if (chatManager !== null) {
            chatManager.dankTimeEnded(args.dankTime, args.users);
        }
    }

    private getChatManager(chat: Chat): ChatManager {
        var chatManager = null;
        if (this.chatManagers.has(chat.id)) {
            chatManager = this.chatManagers.get(chat.id);
        }
        else {
            chatManager = new ChatManager(chat, this);
            this.chatManagers.set(chat.id, chatManager);
        }

        return chatManager;
    }

    private validateNotNegative(value: number): void {
        if (value <= 0) {
            throw new Error("Value must be a positive, non-zero number");
        }
    }
}
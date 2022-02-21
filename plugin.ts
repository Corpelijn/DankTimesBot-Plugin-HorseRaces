import { BotCommand } from "../../src/bot-commands/bot-command";
import { Chat } from "../../src/chat/chat";
import { ChatSettingTemplate } from "../../src/chat/settings/chat-setting-template";
import { User } from "../../src/chat/user/user";
import { PluginEvent } from "../../src/plugin-host/plugin-events/plugin-event-types";
import { AbstractPlugin } from "../../src/plugin-host/plugin/plugin";
import { AlterUserScoreArgs } from "../../src/chat/alter-user-score-args";
import { ChatMessageEventArguments } from "../../src/plugin-host/plugin-events/event-arguments/chat-message-event-arguments";
import { ChatManager, SerializableChatManager } from "./chat-manager";
import { StatisticsRegistry } from "./bookkeeper/statistics/statisticsRegistry";
import { Statistics } from "./bookkeeper/statistics/statistics";
import { WinStatistics } from "./bookkeeper/statistics/winStatistics";


export class Plugin extends AbstractPlugin {
    // Commands
    public static readonly BET_CMD = ["hrbet"];
    public static readonly BETRACE_CMD = ["hrbetrace"];
    public static readonly BETRANDOM_CMD = ["hrbetrandom"];
    public static readonly EVENT_CMD = ["hrrace"];
    public static readonly ODDS_CMD = ["hrodds", "hrodd"];
    public static readonly DOPE_CMD = ["hrdope", "hrdrug", "hrdrugs"];
    public static readonly STAT_CMD = ["hrstat", "hrstats"];
    public static readonly BETS_CMD = ["hrbets", "hractivebets", "hractivebet"];

    // Settings
    public static readonly MAX_ODDS_SETTING = "horseraces.maxodds";
    public static readonly RANDOM_ODDS_MODIFIER_SETTING = "horseraces.randomoddsmodifier";
    public static readonly HORSERACE_PAYOUT_SETTING = "horseraces.racewinpayout";
    public static readonly HORSERACE_DURATION_SETTING = "horseraces.raceduration";
    public static readonly HORSERACE_INTERVAL_SETTING = "horseraces.raceinterval";

    // Storage
    private static readonly FILE_STORAGE = "horseraces.json";

    private chatManagers = new Map<number, ChatManager>();

    constructor() {
        super("Horse Races Plugin", "1.0.0")

        this.subscribeToPluginEvent(PluginEvent.BotStartup, this.loadData.bind(this));
        this.subscribeToPluginEvent(PluginEvent.BotShutdown, this.saveData.bind(this));

        this.subscribeToPluginEvent(PluginEvent.ChatMessage, (data: ChatMessageEventArguments) => {
            let chatManager = this.getChatManager(data.chat);
            if (chatManager !== null) {
                chatManager.handleMessage(data);
            }
        });
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
            new ChatSettingTemplate(Plugin.RANDOM_ODDS_MODIFIER_SETTING, "the modifier of the random odds", 2, (original) => Number(original), this.validateNotNegative.bind(this)),
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
            new BotCommand(Plugin.BET_CMD, "make a bet of your points on any of the horses", this.bet.bind(this), false),
            new BotCommand(Plugin.EVENT_CMD, "start a new horse race", this.event.bind(this), false),
            new BotCommand(Plugin.ODDS_CMD, "display the odds for each of the horses", this.odds.bind(this), false),
            new BotCommand(Plugin.DOPE_CMD, "give a horse an illegal boost during an event", this.dope.bind(this), false),
            new BotCommand(Plugin.BETRACE_CMD, "make a bet on a horse in a race", this.betrace.bind(this), false),
            new BotCommand(Plugin.BETRANDOM_CMD, "make a bet on a random dank time", this.betrandom.bind(this), false),
            new BotCommand(Plugin.STAT_CMD, "shows the horse raceing statistics", this.stats.bind(this), false),
            new BotCommand(Plugin.BETS_CMD, "shows all bets made", this.bets.bind(this), false)
        ];
    }

    private loadData(): any {
        var managers: SerializableChatManager[] = this.loadDataFromFile(Plugin.FILE_STORAGE);
        if (managers != null) {
            managers.forEach(chatmanager => {
                var chat = this.getChat(chatmanager.chatId);

                var statistics = Object.setPrototypeOf(chatmanager.statistics, StatisticsRegistry.prototype) as StatisticsRegistry;
                statistics.statistics = Object.setPrototypeOf(statistics.statistics, Statistics.prototype) as Statistics;
                statistics.dankTime = null;
                statistics.dankTimeStatistics = Object.setPrototypeOf(statistics.dankTimeStatistics, WinStatistics.prototype) as WinStatistics;
                statistics.randomTimeStatistics = Object.setPrototypeOf(statistics.randomTimeStatistics, WinStatistics.prototype) as WinStatistics;

                this.chatManagers.set(chatmanager.chatId, new ChatManager(chat, this, statistics));
            });
        }
    }

    private saveData(): any {
        var managers = Array.from(this.chatManagers.values()).map(m => new SerializableChatManager(m.chat.id, m.statistics));
        this.saveDataToFile(Plugin.FILE_STORAGE, managers);
    }

    private bet(chat: Chat, user: User, msg: any, match: string): string {
        let chatManager = this.getChatManager(chat);
        if (chatManager !== null) {
            return chatManager.bet(chat, user, msg, match);
        }

        return ``;
    }

    private betrace(chat: Chat, user: User, msg: any, match: string): string {
        match = match + ' race';
        return this.bet(chat, user, msg, match);
    }

    private betrandom(chat: Chat, user: User, msg: any, match: string): string {
        match = match + ' random';
        return this.bet(chat, user, msg, match);
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
            return chatManager.statistics.statistics.toString();
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
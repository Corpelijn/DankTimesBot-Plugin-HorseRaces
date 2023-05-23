import { BotCommand } from "../../src/bot-commands/bot-command";
import { Chat } from "../../src/chat/chat";
import { ChatSettingTemplate } from "../../src/chat/settings/chat-setting-template";
import { User } from "../../src/chat/user/user";
import { PluginEvent } from "../../src/plugin-host/plugin-events/plugin-event-types";
import { AbstractPlugin } from "../../src/plugin-host/plugin/plugin";
import { ChatManager } from "./chat-manager";
import { Validation } from "./util/validation";
import TelegramBot from "node-telegram-bot-api";
import { Statistics } from "./statistics/statistics";
import { ChatResetEventArguments } from "../../src/plugin-host/plugin-events/event-arguments/chat-reset-event-arguments";
//import { AlterUserScoreArgs } from "../../src/chat/alter-user-score-args";


export class Plugin extends AbstractPlugin {
    // Commands
    public static readonly BET_CMD = ["hrbet"];
    public static readonly START_CMD = ["hrrace", "hrstart", "hrjoin"];
    public static readonly ODDS_CMD = ["hrodds", "hrodd"];
    public static readonly DOPE_CMD = ["hrdope", "hrdrug", "hrdrugs"];
    public static readonly STAT_CMD = ["hrstat", "hrstats"];
    public static readonly BETS_CMD = ["hrbets", "hractivebets", "hractivebet"];
    public static readonly INFO_CMD = ["horseraces", "horserace", "hrinfo", "hrhelp"];

    // Settings
    public static readonly MAX_ODDS_SETTING = "horserace.maxodds";
    public static readonly PRERACE_DURATION_SETTING = "horserace.preraceduration";
    public static readonly RACE_INTERVAL_SETTING = "horserace.raceinterval";

    // Score altering events
    public static readonly FIRST_PLACE_WINNING_EVENT = "horserace.1stplace";
    public static readonly SECOND_PLACE_WINNING_EVENT = "horserace.2ndplace";
    public static readonly THIRD_PLACE_WINNING_EVENT = "horserace.3rdplace";
    public static readonly RACE_INLAY = "horserace.raceinlay";
    public static readonly INJECT_DOPE = "horserace.horsedope";
    public static readonly PLACE_BET = "horserace.placebet";
    public static readonly WIN_BET = "horserace.winbet";

    // Storage
    private static readonly FILE_STORAGE = "horseraces.json";

    private chats = new Map<number, ChatManager>();

    constructor() {
        super("Horse Races Plugin", "2.0.1")

        this.subscribeToPluginEvent(PluginEvent.BotStartup, this._load.bind(this));
        this.subscribeToPluginEvent(PluginEvent.BotShutdown, this._save.bind(this));
        this.subscribeToPluginEvent(PluginEvent.HourlyTick, this._save.bind(this));
        this.subscribeToPluginEvent(PluginEvent.ChatReset, this._reset.bind(this));
    }

    /**
     * @override
     */
    public getPluginSpecificChatSettings(): Array<ChatSettingTemplate<any>> {
        return [
            new ChatSettingTemplate(Plugin.MAX_ODDS_SETTING, "the maximum odds exchange value", 5, (original) => Number(original), this._validateSetting.bind(this)),
            new ChatSettingTemplate(Plugin.RACE_INLAY, "the entry fee of the race", 10, (original) => Number(original), this._validateSetting.bind(this)),
            new ChatSettingTemplate(Plugin.PRERACE_DURATION_SETTING, "the time before the start of the race (where bets can be made) in seconds", 30, (original) => Number(original), this._validateSetting.bind(this)),
            new ChatSettingTemplate(Plugin.RACE_INTERVAL_SETTING, "the time before a new race can be started after the previous one in minutes", 5, (original) => Number(original), this._validateSetting.bind(this))
        ];
    }

    /**
     * @override
     */
    public getPluginSpecificCommands(): BotCommand[] {
        return [
            new BotCommand(Plugin.INFO_CMD, "prints information about the horse races plugin", this._help.bind(this), true),
            new BotCommand(Plugin.BET_CMD, "make a bet of your points on any of the horses", this._createBet.bind(this), false),
            new BotCommand(Plugin.START_CMD, "start a new horse race", this._startRace.bind(this), false),
            new BotCommand(Plugin.ODDS_CMD, "display the odds for each of the horses", this._showOdds.bind(this), false),
            new BotCommand(Plugin.DOPE_CMD, "give a horse an illegal boost during an event", this._dopeHorse.bind(this), false),
            new BotCommand(Plugin.STAT_CMD, "shows the horse raceing statistics", this._showStats.bind(this), false),
            new BotCommand(Plugin.BETS_CMD, "shows all bets made", this._showBets.bind(this), false),
            
            // new BotCommand(['give'], '', this._give.bind(this), false),
        ];
    }

    /** FOR DEBUGGING ONLY */
    // private _give(chat: Chat, user: User) {
    //     chat.alterUserScore(new AlterUserScoreArgs(user, 1000, 'test', ''));
    //     return ``;
    // }

    public parseNumber(input: string, user: User = undefined): number | null {
        if (user === undefined) {
            return super.parseScoreInput(input);
        }
        return super.parseScoreInput(input, user?.score);
    }

    public async sendTextMessage(chatId: number, message: string): Promise<void> {
        await this.telegramBotClient.sendMessage(chatId, message, { parse_mode: "HTML" });
    }

    private _load(): any {
        let obj = this.loadDataFromFile(Plugin.FILE_STORAGE);
        if (obj !== null) {
            (obj as Array<any>).forEach(chatStatistics => {
                let chat = super.getChat(chatStatistics.chatId);
                let chatManager = this._getOrCreateChatManager(chat);
                chatManager.setStatistics(Statistics.fromJSON(chatStatistics, chat.id, Array.from(chat.users.values())));
            });
        }
    }

    private _save(): any {
        var chatManagers = Array.from(this.chats.values()).map(chat => chat.getStatistics().toJSON());
        this.saveDataToFile(Plugin.FILE_STORAGE, chatManagers);
    }

    private _reset(args: ChatResetEventArguments): any {
        var chatManager = this._getOrCreateChatManager(args.chat);
        chatManager.setStatistics(new Statistics(args.chat.id, Array.from(args.chat.users.values())));
        this._save();
    }

    private _help(): any {
        return `🐎🐎 Welcome to the horse races 🐎🐎\n\n` +
            `Start a race with the command /${Plugin.START_CMD[0]}. Before the race starts, bets can be placed on participating players.\n` +
            `Type /${Plugin.START_CMD[2]} to pay the entry fee and participate in the race.\n\n` +
            `The race consists of multiple rounds. Each round the horses try to overtake each other. Players can inject drugs into their horse to give it more speed, but keep in mind that the horse can die and that the jury is watching.\n` +
            `At the end the top 3 horses get a price from the price pot.\n\n` +

            `/${Plugin.START_CMD[0]} to create a new horse race\n` +
            `/${Plugin.START_CMD[2]} to join a race\n` +
            `/${Plugin.BET_CMD[0]} to place a bet on a user\n` +
            `/${Plugin.ODDS_CMD[0]} shows the odds the bookkeeper is willing to offer on a bet\n` +
            `/${Plugin.BETS_CMD[0]} shows the bets made the bookkeeper is currently holding\n` +
            `/${Plugin.DOPE_CMD[0]} to give your horse an illegal boost\n` +
            `/${Plugin.STAT_CMD[0]} shows some statistics from betting and previous races`;
    }

    // ===================
    // Bookkeeper commands
    // ===================
    private _createBet(chat: Chat, user: User, msg: TelegramBot.Message, match: string): string {
        let chatManager = this._getOrCreateChatManager(chat);
        let params = match.split(' ').filter(i => i);

        // Check if this is a reply to a user
        let replyUserId = msg.reply_to_message?.from.id;
        let replyUser = null;
        if (replyUserId !== null && replyUserId !== undefined) {
            replyUser = chat.users.get(replyUserId);
        }
        return chatManager.createBet(user, params, replyUser);
    }

    private _showOdds(chat: Chat): string {
        let chatManager = this._getOrCreateChatManager(chat);
        this._save();
        return chatManager.showOdds();
    }

    private _showBets(chat: Chat): string | any {
        let chatManager = this._getOrCreateChatManager(chat);
        return chatManager.showBets();
    }

    // =============
    // Race commands
    // =============
    private _startRace(chat: Chat, user: User): string {
        let chatManager = this._getOrCreateChatManager(chat);
        return chatManager.startOrJoinRace(user);
    }

    private _dopeHorse(chat: Chat, user: User, msg: any, match: string): string {
        let chatManager = this._getOrCreateChatManager(chat);
        let params = match.split(' ').filter(i => i);
        return chatManager.dopeHorse(user, params);
    }

    // ===================
    // Statistics commands
    // ===================
    private _showStats(chat: Chat, user: User, msg: TelegramBot.Message, match: string): string {
        let chatManager = this._getOrCreateChatManager(chat);
        let params = match.split(' ').filter(i => i);
        let ofUser = null;

        if (msg.reply_to_message !== undefined && msg.reply_to_message !== null) {
            ofUser = chat.getOrCreateUser(msg.reply_to_message?.from.id, msg.reply_to_message?.from.username);
        }

        return chatManager.showStats(params, ofUser);
    }

    // =====================
    // Other private methods
    // =====================
    private _getOrCreateChatManager(chat: Chat): ChatManager {
        if (!this.chats.has(chat.id)) {
            this.chats.set(chat.id, new ChatManager(chat, this));
        }

        return this.chats.get(chat.id);
    }

    private _validateSetting(value: number) {
        if (!Validation.IsInteger(value) || Validation.IsZeroOrNegative(value)) {
            throw new Error(`Value must be a whole, positive number`);
        }
    }
}

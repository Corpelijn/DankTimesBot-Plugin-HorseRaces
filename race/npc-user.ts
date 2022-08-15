import { User } from "../../../src/chat/user/user";

export class NpcUser extends User
{
    public static readonly NPC0 = new NpcUser(0, "NPC 0");
    public static readonly NPC1 = new NpcUser(1, "NPC 1");

    private constructor(id: number, name: string) {
        super(id, name, 0, 0);
        
    }
}
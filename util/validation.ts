

export class Validation {
    public static IsNegative(value: number): boolean {
        return value < 0;
    }

    public static IsZeroOrNegative(value: number): boolean {
        return value <= 0;
    }

    public static IsInteger(value: number): boolean {
        return Math.round(value) === value;
    }
}
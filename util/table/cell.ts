import { Column } from "./column";
import { Row } from "./row";

export class Cell {
    constructor(public value: string, private row: Row, private column: Column) {
        
    }

    public toString(): string {
        var paddingLength = this.column.getWidth() - this.value.length + 1;
        var padding = '';
        if (paddingLength > 0) {
            padding = new Array(paddingLength).join(' ');
        }
        return `| ${this.value}${padding} `;
    }
}
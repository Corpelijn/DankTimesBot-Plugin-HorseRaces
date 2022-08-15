import { Cell } from "./cell";
import { Table } from "./table";

export class Column {
    private cells: Cell[];

    constructor(public name: string, private table: Table) {
        this.cells = [];
    }

    public addCell(cell: Cell) {
        this.cells.push(cell);
    }

    public getWidth() {
        var valueLength = 0;
        if (this.cells.length > 0) {
            valueLength = this.cells.map(c => c.value.length).sort((a, b) => b - a)[0];
        }
        return Math.max(this.name.length, valueLength);
    }

    public toString() {
        var paddingLength = this.getWidth() - this.name.length + 1;
        var padding = '';
        if (paddingLength > 0) {
            padding = new Array(paddingLength).join(' ');
        }
        return ` ${this.name}${padding} `;
    }
}
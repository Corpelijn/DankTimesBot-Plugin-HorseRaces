import { Cell } from "./cell";
import { Table } from "./table";

export class Row {
    private cells: Cell[];

    constructor(values: string[], private table: Table) {
        this.cells = [];

        for (var i = 0; i < values.length; i++) {
            var cell = new Cell(values[i], this, table.columns[i]);
            this.cells.push(cell);
            table.columns[i].addCell(cell);
        }
    }

    public toString(): string {
        var message = ``;
        for (var i = 0; i < this.cells.length; i++) {
            message += this.cells[i].toString();
        }
        return message + '|\n';
    }
}
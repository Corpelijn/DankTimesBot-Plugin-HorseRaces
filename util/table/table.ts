import { Column } from "./column";
import { Row } from "./row";


export class Table {
    public columns: Column[];
    public rows: Row[];

    constructor() {
        this.columns = [];
        this.rows = [];
    }

    public addColumn(name: string): Column {
        var column = new Column(name, this);
        this.columns.push(column);
        return column;
    }

    public addRow(values: string[]): Row {
        var row = new Row(values, this);
        this.rows.push(row);
        return row;
    }

    public toString(): string {
        var message = `<pre>`;

        for (var i = 0; i < this.columns.length; i++) {
            message += '|' + this.columns[i].toString();
        }
        message += `|\n`;

        for (var i = 0; i < this.columns.length; i++) {
            var dashesLength = this.columns[i].getWidth() + 1;
            var dashes = new Array(dashesLength).join('-');
            message += '+-' + dashes + '-';
        }
        message += `+\n`;

        for (var i = 0; i < this.rows.length; i++) {
            message += this.rows[i].toString();
        }

        message += `</pre>`;
        return message;
    }
}
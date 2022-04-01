import {
    DOMParser,
    Element,
} from "https://deno.land/x/deno_dom@v0.1.21-alpha/deno-dom-wasm.ts";
import { ConvertedOutput } from "./notebook.ts";

export interface DataFrame {
    headers: string[];
    rows: string[][];
}

export function parseDataFrame(table: Element): DataFrame {
    const [tableHead] = table.getElementsByTagName("thead");
    const headers = Array.from(tableHead.getElementsByTagName("th")).map(
        (th) => th.textContent,
    );
    const [tableBody] = table.getElementsByTagName("tbody");
    const rows = Array.from(tableBody.getElementsByTagName("tr")).map((row) => {
        const idx = row.getElementsByTagName("th")[0].textContent;
        const cells = Array.from(row.getElementsByTagName("td")).map(
            (td) => td.textContent,
        );
        return [idx, ...cells];
    });
    return {
        headers,
        rows,
    };
}

export function dataFrameToMarkdown({ headers, rows }: DataFrame): string {
    const pivot = new Map<string, string[]>();
    headers.forEach((header) => pivot.set(header, [header]));
    rows.forEach((row) => {
        row.forEach((value, index) => {
            const header = headers[index];
            const values = pivot.get(header);
            if (!values) {
                throw new Error("Column out of bounds");
            }
            values.push(value);
        });
    });
    let header = "|";
    let line = "|";
    const paddedRows = Array(rows.length).fill("|");

    for (const [_, column] of pivot) {
        const maxLength = column.reduce(
            (max, cell) => Math.max(max, cell.length),
            0,
        );
        const [paddedHeader, ...paddedCells] = column.map((value) =>
            value.padEnd(maxLength, " ")
        );
        header += ` ${paddedHeader} |`;
        line += ` ${"-".repeat(maxLength)} |`;
        paddedCells.forEach((cell, index) => {
            paddedRows[index] += ` ${cell} |`;
        });
    }
    const lines = [header, line, ...paddedRows];
    return lines.join("\n");
}

export function tryParseHTML(html: string): ConvertedOutput {
    const document = new DOMParser().parseFromString(html, "text/html");
    if (!document) {
        throw new Error("Failed to parse HTML");
    }
    const dataframe = document.querySelector("table.dataframe");
    if (dataframe) {
        return {
            block: dataFrameToMarkdown(parseDataFrame(dataframe)),
        };
    }
    throw Error(`Unable to parse HTML: ${html}`);
}

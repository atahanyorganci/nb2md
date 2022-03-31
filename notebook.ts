import { base64, crypto, path } from "./deps.ts";

export interface JupyterNotebook {
    cells: JupyterCell[];
    metadata: {
        kernelspec: {
            display_name: string;
            language: string;
            name: string;
        };
        language_info: {
            codemirror_mode: {
                name: string;
                version: string;
            };
            file_extension: string;
            mimetype: string;
            name: string;
            nbconvert_exporter: string;
            pygments_lexer: string;
            version: string;
        };
    };
    nbformat: number;
    nbformat_minor: number;
}

type JupyterCell = MarkdownCell | CodeCell | RawCell;

export interface MarkdownCell {
    cell_type: "markdown";
    metadata: Record<never, never>;
    source: string[];
}

export interface CodeCell {
    cell_type: "code";
    execution_count: number;
    metadata: {
        collapsed: boolean;
        scrolled: boolean | "auto";
    };
    outputs: Output[];
    source: string[];
}

type Output = StreamOutput | DisplayData | ErrorOutput | ExecuteResult;

export interface StreamOutput {
    output_type: "stream";
    name: "stdout" | "stderr";
    text: string[];
}

export interface DisplayData {
    output_type: "display_data";
    data: {
        "text/plain"?: string[];
        "image/png"?: string;
        "application/json"?: Record<never, unknown>;
    };
    metadata: {
        "image/png"?: {
            width: number;
            height: number;
        };
    };
}

export interface ExecuteResult {
    output_type: "execute_result";
    data: {
        "text/plain"?: string[];
        "image/png"?: string;
        "application/json"?: {
            json: string;
        };
    };
    metadata: {
        "image/png"?: {
            width: number;
            height: number;
        };
    };
}

export interface ErrorOutput {
    output_type: "error";
    ename: string;
    evalue: string;
    traceback: string[];
}

export interface RawCell {
    cell_type: "raw";
    metadata: {
        format: string;
    };
    source: string[];
}

export interface ConvertOptions {
    skipOutput: boolean;
    imageDir: string;
}

export interface ConvertedOutput {
    block?: string;
    image?: {
        name: string;
        binary: Uint8Array;
    };
}

export async function loadNotebook(filePath: string): Promise<JupyterNotebook> {
    const text = await Deno.readTextFile(filePath);
    const json = JSON.parse(text);
    return json;
}

function cellToBlock(cell: JupyterCell): string {
    return cell.source.map((line) => line.replace(/\s+$/, "")).join("\n");
}

const TICKS = "```";

async function convertExecuteResult(
    { data }: ExecuteResult,
): Promise<ConvertedOutput> {
    if (data["image/png"]) {
        const image = base64.decode(data["image/png"]);
        const imageHash = await crypto.subtle.digest("SHA-1", image);
        const imageName = `${base64.encode(imageHash)}.png`;
        return {
            image: {
                name: imageName,
                binary: image,
            },
        };
    } else if (data["application/json"]) {
        const json = data["application/json"].json;
        const block = `\n\n${TICKS}json\n${json}${TICKS}`;
        return {
            block,
        };
    } else if (data["text/plain"]) {
        const block = data["text/plain"]
            .map((line) => line.replace(/\s+$/, ""))
            .join("\n");
        return { block };
    } else {
        throw new Error("Unknown output type");
    }
}

function convertDisplayData(_displayData: DisplayData): never {
    throw new Error("Method not implemented.");
}

function convertStreamOutput({ name, text }: StreamOutput): string {
    const stream = text.map((line) => line.replace(/\s+$/, "")).join("\n");
    return `${TICKS}${name}\n${stream}\n${TICKS}`;
}

async function convertCodeOutput(output: Output): Promise<ConvertedOutput> {
    switch (output.output_type) {
        case "stream":
            return { block: convertStreamOutput(output) };
        case "display_data":
            return convertDisplayData(output);
        case "execute_result":
            return await convertExecuteResult(output);
        default:
            throw new Error(`Unknown output type: ${output.output_type}`);
    }
}

export async function convertNotebook(
    notebook: JupyterNotebook,
    outputPath: string,
    { skipOutput, imageDir }: ConvertOptions,
): Promise<void> {
    if (!skipOutput) {
        await Deno.mkdir(imageDir, { recursive: true });
    }
    const outputDir = path.dirname(outputPath);
    const imageDirRelative = path.relative(outputDir, imageDir);
    const language = notebook.metadata.language_info.name;
    const blocks = notebook.cells.map(async (cell) => {
        const cellType = cell.cell_type;
        const source = cellToBlock(cell);
        switch (cellType) {
            case "markdown":
                return source;
            case "code": {
                let sourceCode = `${TICKS}${language}\n${source}\n${TICKS}`;
                if (skipOutput) {
                    return sourceCode;
                }
                const awaitables = cell.outputs.map(async (output) => {
                    const { block, image } = await convertCodeOutput(output);
                    if (block) {
                        sourceCode += `\n${block}`;
                    }
                    if (image) {
                        const imagePath = path.join(imageDir, image.name);
                        const relativePath = path.join(
                            imageDirRelative,
                            image.name,
                        );
                        await Deno.writeFile(imagePath, image.binary);
                        sourceCode += `\n\n![](${relativePath})`;
                    }
                });
                await Promise.all(awaitables);
                return sourceCode;
            }
            case "raw":
                return source;
            default:
                throw new Error(`Unknown cell type: ${cellType}`);
        }
    });
    const blocksText = await Promise.all(blocks);
    const text = blocksText.join("\n\n");
    await Deno.writeTextFile(outputPath, text);
}

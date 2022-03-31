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

export async function loadNotebook(filePath: string): Promise<JupyterNotebook> {
    const text = await Deno.readTextFile(filePath);
    const json = JSON.parse(text);
    return json;
}

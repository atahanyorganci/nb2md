import { Command, path } from "./deps.ts";
import {
    convertNotebook,
    ConvertOptions,
    JupyterNotebook,
    loadNotebook,
} from "./notebook.ts";

type Arguments = [input: string];

interface Options extends ConvertOptions {
    output: string;
}

interface GlobalOptions {
    verbose?: boolean;
}

await new Command<Options, Arguments, GlobalOptions>()
    .name("nb2md")
    .version("0.1.0")
    .description("Convert a Jupyter notebook to markdown")
    .arguments("<input:string>")
    .option<{ output: string }>(
        "-o, --output [input:string]",
        "Path to the output file",
        { required: true },
    )
    .option("--skip-output [skipOutput:boolean]", "Skip code cell output", {
        default: false,
    })
    .option("--image-dir [imageDir:string]", "Path to the image directory", {
        default: "images",
    })
    .action(async ({ output, skipOutput, imageDir }, input) => {
        const inputPath = path.resolve(input);
        const outputPath = path.resolve(output);
        let notebook: JupyterNotebook;
        try {
            notebook = await loadNotebook(inputPath);
        } catch (error) {
            console.error(error.message);
            Deno.exit(1);
        }
        console.log(`Converting ${inputPath} to ${outputPath}`);
        await convertNotebook(notebook, outputPath, { skipOutput, imageDir });
    })
    .parse(Deno.args);

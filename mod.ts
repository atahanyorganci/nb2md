import { Command } from "./deps.ts";

type Arguments = [input: string];

interface Options {
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
        { required: true }
    )
    .action(({ output }, input) => {
        console.log(`Converting ${input} to ${output}`);
    })
    .parse(Deno.args);

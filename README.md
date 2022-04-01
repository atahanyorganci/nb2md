# nb2md

[![deno module](https://shield.deno.dev/x/nb2md)](https://deno.land/x/nb2md)
![deno compatibility](https://shield.deno.dev/deno/^1.20)

Convert Jupyter notebooks to markdown

## Installation

```
deno install --allow-read --allow-write https://deno.land/x/init@v0.1.0/mod.ts
```

## Features

- Convert markdown cells into prose
- Based on notebook language convert code cells into fenced code blocks
- Convert `STDOUT` and `STDERR` into verbatim text
- Handle execute output
  - `image/png` base64 encoded PNGs are decoded and save to image dir
  - `text/html` HTML produced by `pandas.DataFrame` is converted into markdown tables
  - `text/plain` is directly appended to output document
  - `application/json` is embedded into output document as JSON fenced code blocks

## Usage

Convert a Jupyter notebook v4 into markdown

```shell
$ nb2md notebook.ipynb -o notebook.md
```

Skip output of code cells, default `false`
```shell
$ nb2md notebook.ipynb -o notebook.md --skip-output
```

Customize image directory, default `images`
```shell
$ nb2md notebook.ipynb -o notebook.md --image-dir img
```

## Options

- `--help` or `-h` will print the CLI documentation to the terminal.
- `--version` or `-v` will print the version number to the terminal
- `--output` or `-o` path to output file, **required**
- `--skip-output` skip code cell output, default `fasle`
- `--image-dir` path to the image directory, default `'images'`

## Contributing

You are welcome to report any bugs, other issues, or feature requests! If you want to add a fix/feature/other improvement fork this repository and make a pull request with your changes.

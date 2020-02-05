# New additions in the addons directory

{toc}

## Using commonmark (as in addons branch)

The below will parse `exam-source-file.md` and generate `exam-source-file.html` and `exam-source-file.exam` in `/tmp`

```
bin/commonmark -t exam --outdir /tmp --nostdout exam-source-file.md
```

## New blocks:

### {toc}: for table of contents (done)

`{toc:depth}` on a line by itself will cause a table of contents (from
header nodes, e.g., nodes starting with #...) to be inserted up to
`depth`.  If no `:depth` is included (e.g., `{toc}`), then there is no
maximum depth.

### include other files

### tables

### attributes, e.g., CSS

## New Inlines:

### `{question}`: to insert a number for a question

`{question:depth}` will insert a question number, where depth will
determine which level of the number is increased.  If no `:depth` is
included, then it will increment the top-level question number.

### Local Names for links within a document

## Other exam question stuff

- `{radio:begin}`
- `{answer:a}`




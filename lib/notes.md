- Parsing a string begins with the `parse` method in blocks.c:805
  - Each line is parsed with `incorporateLine` in blocks.c:625
  - After all lines have been added `finalize` in blocks.c:774 finishes things up.
  - the parse tree is returned
  
# incorporateLine (in blocks.c)

- Starting from the document root, descend following lastchild which
  is still open and using the `continue` function for each block type
  to find the block which is waiting for more input and can take the
  line, `ln`, we are currently incorporating.  We exit the while loop
  if `continue` function returns 1 (and we set `all_matched` to 1) or
  we run out of blocks which have a `lastChild` which is `open`.
  - if `all_matched` is 1, it means the container we were checking
    can't take anymore lines, so go up to parent and exit
  - if we run out of blocks, then we are at document level
  
# added \{toc\}

- required an addition to `blockStarts` to recognize it
- required an addition to `blocks` to handle `continue`, `finalize`, and `canContain`, and `acceptsLines`.  All identical with heading since \{toc\} can't contain any text
- added code, `tochelper` to generate the toc in `renderer.js`.
- added code to render the toc in html with the `toc` function.

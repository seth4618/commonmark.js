
<style>
td { border: 1px black solid; }
</style>

A basic 3 column table.  One row per line

{table:begin::|}
a | b | c
d | e | f
{table:end}

Same as above, but does not specify default separater

{table:begin}
a | b | c
d | e | f
{table:end}

Same as above, but uses special separater

{table:begin::&}
a & b & c
d & e & f
{table:end}

Illegal spec because of trailing colon

{table:begin:}
a | b | c
d | e | f
{table:end}

Illegal spec because of trailing colons

{table:begin::}
a | b | c
d | e | f
{table:end}

Each line is a row

{table:begin}
a | 
b | c
d 
| e | f
{table:end}

Since during parse we allow blocks the below doesn't quite capture what we want, but I am not sure how to change that.  So, table below will put `> d\n| e | f` into a single cell.

{table:begin}
a | 
b | >c
> d 
| e | f
{table:end}


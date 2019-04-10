<style>
td { border: 1px black solid; }
</style>

A basic 3 column table.  One row per line, but that is not required.

{table:begin:3:|}
a | b | c |
d | e | f |
{table:end}

A basic 3 column table.  two rows, but they don't have to be on the same line

{table:begin:3:|}
a | 
b | c |
d 
| e | f |
{table:end}

A basic 3 column table.  two rows, but they don't have to be on the same line and blank lines inside are ignored.

{table:begin:3:|}
a | 
b | c |

d 
| e | f |
{table:end}

A basic 3 column table.  two rows, but they don't have to be on the same line and blank lines inside are ignored between rows as well as between columns.

{table:begin:3:|}
a | 
b | c |

d 

| e | f |
{table:end}

Different separator

{table:begin:3:&}
a & 
b & c &

d 

& e & f &
{table:end}

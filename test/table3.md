Before the table.

{table:begin:3:|}
EXAMPLE    | `*x` | `0x2FB8`
{question} | `*((int *) x)` | {blank:10}
{question} | `*(x + 10)` | {blank:10}
{question} | 
`*(((char *) x) + 7)` | 
> {blank:10}

{question} | `*(((char *)(x + 3)) + 3)` | {blank:10}
{question} | `*((short *)(((int *) x) + 9))` | {blank:10}
{question} | `*(((short *)(((int *) x) + 6)) + 8)` | {blank:10}
{question} | `*((int *) (((char *)(x + 3)) + 5))` | {blank:10}
{table:end}

after the table.

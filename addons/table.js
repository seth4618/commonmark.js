"use strict";

let Node = null;

const debugAnswer = false;
const nodetype = 'table';
const reToken = /^\{\s*table\s*:\s*(begin|end)\s*(?::\s*([0-9]*)\s*:\s*([^ }]+)\s*)?\}/;
const C_LEFT_BRACE = 123;

const peek = function(ln, pos) {
    if (pos < ln.length) {
        return ln.charCodeAt(pos);
    } else {
        return -1;
    }
};

var addCell = function() {
    // see if we need a new row
    //console.log("AC: %d %d | %s", this.cols, this.counter, this.row ? this.row.tostring() : "(null)");
    if ((this.row == null)||(this.counter == this.cols)||this.needNewRow) {
        this.row = new Node('row', this.lastpos);
        this.rows.push(this.row);
        this.counter = 0;
        this.needNewRow = false;
    }
    const col = new Node('col', this.lastpos);
    this.row.appendChild(col);
    this.cell = col;
    this.counter += 1;
};

var addNode2cell = function(node) {
    if (this.cell == null) {
        this.addCell();
    }
    if (node == null) return;
    this.cell.appendChild(node);
};

var td2string = function() {
    return [ 'cols:', this.cols, 
             ' sepr:', this.sepr, 
             ' cntr:', this.counter, 
             ' rowid:', this.row?this.row._uid:'(null)',
             ' colid:', this.cell?this.cell._uid:'(null)',
             ' rows:', this.rows.length,
             ' NNR:', this.needNewRow ? "YES" : "no" ].join("");
};

// assumption is string has implied new line at end.
var addString2cell = function(string) {
    const trimmed = string.trim();
    const pieces = string.split(this.sepr);
    let needNewCell = false;
    for (let p of pieces) {
        if (needNewCell) {
            this.cell = null;
            needNewCell = false;
        }
        p = p.trim();
        let n = null;
        if (p != "") {
            n = new Node('paragraph', this.lastpos);
            n._string_content = p;
        }
        //console.log('Adding para with [%s] to %s', p, this.tostring());
        this.addNode2cell(n);
        needNewCell = true;	// before adding text here, make sure to add another cell.
    }
};

RegExp.escape= function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

var TableData = function(cols, sepr, sp) {
    //const synthSepr = (cols > 0) ? RegExp.escape(sepr) : [ RegExp.escape(sepr) , "|\n" ].join("");
    //console.log('New TD: %s', synthSepr);
    const synthSepr = RegExp.escape(sepr);
    return {
        // object data
        cols: cols,	  // number of columns per row
        sepr: new RegExp(synthSepr),	  // column separator
        rows: [],	  // processed rows
        row: null,	  // current row
        cell: null,	  // current cell
        counter: 0,	  // number of cells in this row
        lastpos: sp,      // last source position
        needNewRow: false,// used when one row per line
        // object methods
        addString2cell: addString2cell,
        addNode2cell: addNode2cell,
        addCell: addCell,
        tostring: td2string
    };
};

// break the subtree into rows and cols
const createRowsAndColumns = function(parser, block) {
    //console.log(block.asstring());
    const columns = block.columns;
    const sepr = block.separator;
    let tabledata = new TableData(columns, sepr || "|", block.sourcepos);
    const children = block.detachChildren();
    for (let child of children) {
        tabledata.lastpos = child.sourcepos;
        if (child.type == 'paragraph') {
            //console.log('if ==> %s', child.tostring());
            if (columns == 0) {
                // break into lines and end each line with a new row
                const lines = child._string_content.split("\n");
                for (let line of lines) {
                    //console.log('para ==> [%s]', line);
                    tabledata.addString2cell(line);
                    tabledata.cell = null;
                    tabledata.needNewRow = true;
                }
            } else {
                tabledata.addString2cell(child._string_content);
            }
        } else {
            // add this node to the current cell
            //console.log('else ==> %s', child.tostring());
            tabledata.addNode2cell(child);
        }
    }
    // if content is empty, then just return
    const len = tabledata.rows.length;
    if (len == 0) return;
    // eliminate last row if it contains only 1 cell which is emptry
    const lastrow = tabledata.rows[tabledata.rows.length-1];
    if (lastrow.firstChild && (lastrow.firstChild.firstChild == null) && (lastrow.firstChild.next == null)) {
        tabledata.rows.pop();
    }
    // now turn array of rows into row nodes and attach to table
    for (let r of tabledata.rows) {
        block.appendChild(r);
    }
    //console.log('-------------');
    //console.log(block.asstring());
};

const blockfuncs =  {
    continue: function(parser) {
        var ln = parser.currentLine;
        var match;
        if ((peek(ln, parser.nextNonspace) === C_LEFT_BRACE) &&
            (match = ln.slice(parser.nextNonspace).match(reToken)) &&
            (match[1] == 'end')) {
            // we are done with the table
            parser.advanceOffset(match[0].length, true); // to end of marker
            return 1;
        } else {
            // keep going
            return 0;
        }
    },
    finalize: createRowsAndColumns,
    canContain: function(t) { return true; },
    acceptsLines: false
};

const blockStart = function(parser) {
    var match;
    if (!parser.indented &&
        (peek(parser.currentLine, parser.nextNonspace) === C_LEFT_BRACE) &&
        (match = parser.currentLine.slice(parser.nextNonspace).match(reToken)) &&
        (match[1] == 'begin')) {
        // we matched a {table:begin:<cols>:<sepr>}, advance parser
        if (match.length == 3) {
            // some wierdness
            return 0;
        }
        parser.advanceNextNonspace();
        parser.advanceOffset(match[0].length, false);
        parser.closeUnmatchedBlocks();
        var container = parser.addChild(nodetype, parser.nextNonspace);
        if (match.length >= 3)
            container.separator = match[3];
        //console.log('%d %s', match.length, match);
        if ((match.length == 4)&&((typeof match[2] !== 'undefined') && (match[2].trim().length > 0))) {
            // this is a table that can contain blocks
            container.columns = parseInt(match[2]);
            container.lineisrow = false;
        } else {
            // this is a table where each line is a row
            container.columns = 0;
            container.lineisrow = true;
        }
        //console.log('columns=%d, separator=%s %s', container.columns, container.separator, container.lineisrow?"line per row":"");
        return 1;
    } else {
        return 0;
    }
};


function renderHTML(node, entering) {
    if (entering) {
        //console.log(node.asstring());
        this.tag('table', [], false);
    } else {
        this.tag('/table');
        this.cr();
    }
}

function renderXML(node, attrs) {
}

function renderRowHTML(node, entering) {
    if (entering) {
        this.tag('tr', [], false);
    } else {
        this.tag('/tr');
        this.cr();
    }
}

function renderColHTML(node, entering) {
    if (entering) {
        this.tag('td', [], false);
    } else {
        this.tag('/td');
        this.cr();
    }
}

function renderRowXML(node, attrs) {
}

function renderColXML(node, attrs) {
}

function cleanupNode(node) {
    //console.log(node.tostring());
    if (node.type == 'col') {
        let par = node.firstChild;
        if ((par != null) && (par.type == 'paragraph')) {
            let child = par.firstChild;
            child.unlink();
            par.replace(child);
        }
        //console.log(node.tostring());
    } else {
        for (let child = node.firstChild; child; child = child.next) {
            if (child.isContainer() && child.isBlock()) {
             //   console.log(node.tostring());
                cleanupNode(child);
            }
        }
    }
}

// get rid of paragraphs inside table
function cleanup(parser, root) {
    cleanupNode(root);
    //console.log('------------- postprocess');
    //console.log(root.asstring());
}

const renderers = [
    [nodetype, renderHTML, renderXML ],
    ['row', renderRowHTML, renderRowXML ],
    ['col', renderColHTML, renderColXML ] ];


const install = function(abp, html, xml) {
    Node = abp(nodetype, blockStart, blockfuncs, true, [ ], '{', cleanup);
    Node.checkAndAddName('row', [], true, true);
    Node.checkAndAddName('col', [], true, true);
    for (let info of renderers) {
        if (html) {html[info[0]] = info[1];}
        if (xml) xml.addRenderer(info[0], info[2]);
    }
};


module.exports = install;

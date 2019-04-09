"use strict";

let Node = null;

const debugAnswer = false;
const nodetype = 'table';
const reToken = /^\{\s*table\s*:\s*(begin|end)\s*(?::\s*([0-9]+)\s*:\s*([^ }]+)\s*)?\}/;
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
    if ((this.row == null)||(this.counter == this.cols)) {
        this.row = new Node('row', this.lastpos);
        this.rows.push(this.row);
        this.counter = 0;
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

var addString2cell = function(string) {
    const pieces = string.split(this.sepr);
    for (let p of pieces) {
        p = p.trim();
        let n = null;
        if (p != "") {
            n = new Node('paragraph', this.lastpos);
            n._string_content = p;
        }
        this.addNode2cell(n);
        this.cell = null;
    }
};

RegExp.escape= function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

var TableData = function(cols, sepr, sp) {
    return {
        // object data
        cols: cols,	  // number of columns per row
        sepr: new RegExp(RegExp.escape(sepr)),	  // column separator
        rows: [],	  // processed rows
        row: null,	  // current row
        cell: null,	  // current cell
        counter: 0,	  // number of cells in this row
        lastpos: sp,    // last source position
        // object methods
        addString2cell: addString2cell,
        addNode2cell: addNode2cell,
        addCell: addCell
    };
};

// break the subtree into rows and cols
const createRowsAndColumns = function(parser, block) {
    //console.log(block.asstring());
    const columns = block.columns;
    const sepr = block.separator;
    let tabledata = new TableData(columns, sepr, block.sourcepos);
    const children = block.detachChildren();
    for (let child of children) {
        tabledata.lastpos = child.sourcepos;
        if (child.type == 'paragraph') {
            tabledata.addString2cell(child._string_content);
        } else {
            // add this node to the current cell
            tabledata.addNode2cell(child);
        }
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
        parser.advanceNextNonspace();
        parser.advanceOffset(match[0].length, false);
        parser.closeUnmatchedBlocks();
        var container = parser.addChild(nodetype, parser.nextNonspace);
        container.columns = parseInt(match[2]);
        container.separator = match[3];
        //console.log('columns=%d, separator=%s', container.columns, container.separator);
        return 1;
    } else {
        return 0;
    }
};


function renderHTML(node, entering) {
    if (entering) {
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

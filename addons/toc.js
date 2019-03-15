"use strict";

const peek = function(ln, pos) {
    if (pos < ln.length) {
        return ln.charCodeAt(pos);
    } else {
        return -1;
    }
};

const blockfuncs =  {
    continue: function() {
        // a toc can never container > 1 line, so fail to match:
        return 1;
    },
    finalize: function() { return; },
    canContain: function() { return false; },
    acceptsLines: false
};

const C_OPEN_BRACE = 123;

const reTableOfContents = /^\{toc(?::([0-9]+))?\}\s*$/;

const blockStart = function(parser) {
    var match;
    if (!parser.indented &&
        (peek(parser.currentLine, parser.nextNonspace) === C_OPEN_BRACE) &&
        (match = parser.currentLine.slice(parser.nextNonspace).match(reTableOfContents))) {
        // we matched a {toc[:depth]}, advance parser
        parser.advanceNextNonspace();
        parser.advanceOffset(match[0].length, false);
        parser.closeUnmatchedBlocks();
        // add node for the TOC
        var container = parser.addChild('toc', parser.nextNonspace);
        container.maxdepth = parseInt(match[1]|"0");
        return 2;
    } else {
        return 0;
    }
};

/**
 *  generate a toc to a certain depth.  Will be actually rendered by the specific renderer
 *
 *  @param ast {Node} Where to start on the TOC
 *  @param maxdepth {Integer} max depth to show
 */
function tochelper(ast, maxdepth) {
    let walker = ast.walker();	// used to walk entire tree, looking for headings
    let event = null;		// used by walker
    let table = [];      	// the TOC which will be returned.  Each entry is a line in the table
    let text;			// used to collect text for each entry
    let collecting = false;     // whether we are collecting a TOC entry
    let entry;			// current entry under construction; which we will put in `table`
    
    if (maxdepth == 0) 
        maxdepth = 10000;	// 0 means infinite and 10k is pretty close to infinity :)
    
    while ((event = walker.next())) {
        const node = event.node;
        if (node.type == 'heading') {
            if (event.entering) {
                if (node.level <= maxdepth) {
                    // make a TOC entry
                    collecting = true;
                    text = [];
                    entry = [ node.level ];
                }
            } else {
                if (node.level <= maxdepth) {
                    // finish the TOC entry
                    collecting = false;
                    entry.push(text.join(' '));
                    table.push(entry);
                }
            }
        } else if (collecting) {
            if (node.type == 'text') {
                text.push(node.literal);
            } 
        }
    }
    return table;
}

function tocHtmlRenderer(node, entering) {
    this.cr();
    if (entering) {
        let table = tochelper(node.getRoot(), node.maxdepth);
        let currentDepth = 0;
        this.tag('div', [[ 'class', 'toc' ]]);
        for (let line of table) {
            if (currentDepth < line[0]) {
                // create a new level
                this.tag('ol');
            } else if (currentDepth > line[0]) {
                // close out last level
                this.tag('/ol');
            }
            // add this entry
            this.tag('li');
            this.out(line[1]);
            this.tag('/li');
            currentDepth = line[0];
        }
        this.tag('/div');
    }
    this.cr();
}

function tocXmlRenderer(node, attrs) {
    attrs.push(['depth', node.maxdepth]);
    // should we be inserting the entries here or not?  For now, not.
}

const install = function(abp, html, xml) {
    abp('toc', blockStart, blockfuncs, false, [ ['depth', 'litr'] ], '{');
    if (html) {html.toc = tocHtmlRenderer;}
    if (xml) xml.addRenderer('toc', tocXmlRenderer);
};

module.exports = install;

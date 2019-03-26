"use strict";

const fs = require('fs');
const path = require('path');
const URL = require('url');
const process = require('process');

// <<URI>> will inline all of URI into document.

const peek = function(ln, pos) {
    if (pos < ln.length) {
        return ln.charCodeAt(pos);
    } else {
        return -1;
    }
};

const reProtocol = /^[a-z]+:\/\//;

const doInclude = function(parser, block) {
    // see if we have path information.  If we do, then use to allow
    // relative uri specifictions.  Otherwise, just open uri and hope
    // for best.
    const parentPath = parser.getPath();
    console.log(parentPath);
    var includePath = block.uri;
    const fileonly = (parentPath && (parentPath.match(reProtocol) != null)) ? false : true;
    const absolute = (!fileonly || (includePath.indexOf('/') == 0));
    var fetchURL = null;
    var fetchPath = null;
    if ((parentPath !== undefined)&&!absolute) {
        // include specified not absolute, see if we can join to basepath of parser
        if (parentPath.match(reProtocol)) {
            // base path is a URI, break into pieces and glue on path
            fetchURL = new URL(includePath, parentPath);
        } else {
            // base path is a path (i.e., on local system)
            fetchPath = path.normalize(path.join(parentPath, includePath));
        }
    } else {
        if (fileonly) {
            fetchPath = includePath;
        } else {
            fetchURL = new URL(includePath);
        }
    }
    if (fetchURL)
        throw "Have not done URL stuff yet";
    console.log(fetchPath);
    const inp = fs.readFileSync(fetchPath, 'utf8');
    var subparser = parser.clone();
    subparser.processInlines = function() {};
    const doc = subparser.parse(inp);
    // add all nodes as children of the include node
    block._firstChild = doc.firstChild;
    block._lastChild = doc.lastChild;
    for (let node=block.firstChild; node; node=node.next)
        node._parent = block;
};

const blockfuncs =  {
    continue: function() {
        // an include can never container > 1 line, so fail to match:
        return 1;
    },
    finalize: doInclude,
    canContain: function() { return false; },
    acceptsLines: false
};

const C_LESSTHAN = 60;

var reInclude = /^<<([a-zA-Z0-9:\/._\-?&=;]+)>>\s*$/;

const blockStart = function(parser) {
    var match;
    if (!parser.indented &&
        (peek(parser.currentLine, parser.nextNonspace) === C_LESSTHAN) &&
        (match = parser.currentLine.slice(parser.nextNonspace).match(reInclude))) {
        // we matched a <<url>>, advance parser
        parser.advanceNextNonspace();
        parser.advanceOffset(match[0].length, false);
        parser.closeUnmatchedBlocks();
        // add node for the include.  When we get around to finalizing we will recurse
        var container = parser.addChild('include', parser.nextNonspace);
        container.uri = match[1];
        return 2;
    } else {
        return 0;
    }
};

function renderHTML(node, entering) {
    this.cr();
}

function renderXML(node, attrs) {
    attrs.push(['uri', node.url]);
}

const install = function(abp, html, xml) {
    abp('include', blockStart, blockfuncs, true, [ ['uri', 'litr'] ], '<');
    if (html) {html.include = renderHTML;}
    if (xml) xml.addRenderer('include', renderXML);
};

module.exports = install;

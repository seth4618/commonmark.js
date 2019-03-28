var Node;			// will be defined on install

const debugAnswer = false;
const nodetype = 'radio';
const reToken = /^\{\s*radio\s*:\s*(begin|end)\s*\}/;
const C_LEFT_BRACE = 123;

const peek = function(ln, pos) {
    if (pos < ln.length) {
        return ln.charCodeAt(pos);
    } else {
        return -1;
    }
};

const blockfuncs =  {
    continue: function(parser) {
        var ln = parser.currentLine;
        if (debugAnswer) console.log('radio continue?: '+ln);
        if (debugAnswer) console.log(parser.show());
        var match;
        if ((peek(ln, parser.nextNonspace) === C_LEFT_BRACE) &&
            (match = ln.slice(parser.nextNonspace).match(reToken)) &&
            (match[1] == 'end')) {
            // we are done with the radio
            if (debugAnswer) console.log('done with readio');
            parser.advanceOffset(match[0].length, true); // to end of marker
            return 1;
        } else {
            // keep going
            if (debugAnswer) console.log('more');
            return 0;
        }
    },
    finalize: function() { return; },
    canContain: function(t) { return (t === 'answer'); },
    acceptsLines: false
};

const blockStart = function(parser) {
    var match;
    if (debugAnswer) console.log('blockstart for radio:'+parser.currentLine);
    if (!parser.indented &&
        (peek(parser.currentLine, parser.nextNonspace) === C_LEFT_BRACE) &&
        (match = parser.currentLine.slice(parser.nextNonspace).match(reToken)) &&
        (match[1] == 'begin')) {
        // we matched a {radio:begin}, advance parser
        parser.advanceNextNonspace();
        parser.advanceOffset(match[0].length, false);
        parser.closeUnmatchedBlocks();
        var container = parser.addChild(nodetype, parser.nextNonspace);
        if (debugAnswer) console.log('RADIO start');
        return 1;
    } else {
        if (debugAnswer) console.log('FAIL');
        return 0;
    }
};


function renderHTML(node, entering) {
    if (entering) {
        if (debugAnswer) console.log('render radio');
        if (debugAnswer) console.log(node.asstring(true));
        this.tag('div', [['class', 'mcquestion']], false);
    } else {
        this.tag('/div');
        this.cr();
    }
}

function renderXML(node, attrs) {
}

const reAnswer = /^\{answer\s*(?::([^}]+))*\}\s*/;
const reAnswerOrRadio = /^\{(answer\s*(:[^}]*)*)|(radio\s*:\s*end)\}\s*/;

const answerFuncs =  {
    continue: function(parser) {
        var ln = parser.currentLine;
        var match;
        if (debugAnswer) console.log('>>>>continue answer?');
        if (debugAnswer) console.log(ln);
        if (debugAnswer) console.log(parser.show());
        match = ln.slice(parser.nextNonspace).match(reAnswerOrRadio);
        if (debugAnswer) console.log(match);
        if ((peek(ln, parser.nextNonspace) === C_LEFT_BRACE) &&
            (match = ln.slice(parser.nextNonspace).match(reAnswerOrRadio))) {
            // we matched answer or radio, so no more continuing
            if (debugAnswer) console.log('<<< stop answer');
            //parser.advanceOffset(match[0].length, true); // to end of marker
            return 1;
        } else {
            // keep going
            if (debugAnswer) console.log('<<< more answer');
            return 0;
        }
    },
    finalize: function() { return; },
    canContain: function(t) { return (t !== 'answer')&&(t !== 'radio');  },
    acceptsLines: false
};

const answerStart = function(parser, container) {
    var match;
    if (debugAnswer) console.log('Seeing if answer can start:'+parser.currentLine);
    if (debugAnswer) console.log(parser.show());
    if (debugAnswer) console.log('container: %s', container.tostring());
  if (!parser.indented &&
      (container.type == 'radio') &&
        (peek(parser.currentLine, parser.nextNonspace) === C_LEFT_BRACE) &&
        (match = parser.currentLine.slice(parser.nextNonspace).match(reAnswer))) {
        // we matched a {answer}, advance parser
        parser.advanceNextNonspace();
        parser.advanceOffset(match[0].length, false);
        parser.closeUnmatchedBlocks();
      let an = parser.addChild('answer', parser.nextNonspace);
      an.key = match[1];
      if (debugAnswer) console.log('starting answer');
      if (debugAnswer) console.log(parser.show());
      if (debugAnswer) console.log('--A--');
        return 1;
    } else {
        if (debugAnswer) console.log('FAILING answer');
        return 0;
    }
};


function answerHTML(node, entering) {
    if (entering) {
        this.lit('<!-- '+node.key+' -->');
        if (debugAnswer) console.log('render answer:'+node.key);
        if (debugAnswer) console.log(node.asstring(true));
    }
}

function answerXML(node, attrs) {
}

////////////////////////////////////////////////////////////////
// blank:x

const reBlank = /^\{blank\s*(?::([0-9]+))*\s*\}/;

const parseBlank =  function(block) {
    const blank = this.match(reBlank);
    if (blank === null) {
        return false;
    }
    const match = blank.match(reBlank);
    const width = match[1];
    let node = new Node('blank');
    node.qwidth = width || "6";
    block.appendChild(node);
    return true;
};


function blankHTML(node, entering) {
    if (entering) {
        this.cr();
        this.lit('<!-- blank -->');
        this.lit('<!-- '+node.qwidth+' -->');
        this.cr();
    }
}

function blankXML(node, attrs) {
}

////////////////////////////////////////////////////////////////
// solutions

const reSolution = /^\{solution\s*:\s*(begin|end)\s*(?::([^}]+))*\s*\}\s*/;

const solutionFuncs =  {
    continue: function(parser) {
        var ln = parser.currentLine;
        var match;
        if ((peek(ln, parser.nextNonspace) === C_LEFT_BRACE) &&
            (match = ln.slice(parser.nextNonspace).match(reSolution)) &&
            (match[1] == 'end')) {
            // we are done with the solution block
            parser.advanceOffset(match[0].length, true); // to end of marker
            return 1;
        } else {
            // keep going
            return 0;
        }
    },
    finalize: function() { return; },
    canContain: function(t) { return false; return (t === 'paragraph');  },
    acceptsLines: true
};

const solutionStart = function(parser, container) {
    var match;
    if (!parser.indented &&
        (peek(parser.currentLine, parser.nextNonspace) === C_LEFT_BRACE) &&
        (match = parser.currentLine.slice(parser.nextNonspace).match(reSolution)) &&
        (match[1] == 'begin')) {
        // we matched a {solution:begin/end:<num>}, advance parser
        parser.advanceNextNonspace();
        parser.advanceOffset(match[0].length, false);
        parser.closeUnmatchedBlocks();
        let node = parser.addChild('solution', parser.nextNonspace);
        node.solkey = match[2];
        return 1;
    } else {
        return 0;
    }
};


function solutionHTML(node, entering) {
    if (entering) {
        this.cr();
        this.lit('<!-- solution -->');
        this.lit('<!-- '+node._string_content+' -->');
        this.cr();
    }
}

function solutionXML(node, attrs) {
}

const installers = [ [nodetype, blockStart, blockfuncs, renderHTML, renderXML],
                     ['answer', answerStart, answerFuncs, answerHTML, answerXML],
                     ['solution', solutionStart, solutionFuncs, solutionHTML, solutionXML] ];  

const inliners = [ ['blank', parseBlank, blankHTML, blankXML] ];


const installBlocks = function(abp, html, xml) {
    for (const info of installers) {
        const n = abp(info[0], info[1], info[2], true, [], '{');
        if (n === false) throw "Cannot install "+info[0]+" as a block node";
        if ((Node == undefined)&&(Node == null)) Node = n;
        if (html) {html[info[0]] = info[3];}
        if (xml) xml.addRenderer(info[0], info[4]);
    }
};

const installInlines = function(aip, html, xml) {
    for (const info of inliners) {
        aip(C_LEFT_BRACE, info[0], info[1], false, [ ]);
        if (html) {
            html[info[0]] = info[2]; 
        }
        if (xml) {
            xml.addRenderer(info[0], info[3]);
        }
    }
};

module.exports = {blocks: installBlocks, inlines: installInlines};

"use strict";

function Renderer() {}

/**
 *  Walks the AST and calls member methods for each Node type.
 *
 *  @param ast {Node} The root of the abstract syntax tree.
 */
function render(ast) {
    var walker = ast.walker()
    , event
    , type;
    
    this.buffer = '';
    this.lastOut = '\n';
    
    this.questionNumbers = [ 0, 0, 0, 0 ];
    this.lastQuestionLevel = 0;

    while((event = walker.next())) {
        type = event.node.type;
        if (this[type]) {
            this[type](event.node, event.entering);
        }
    }
    return this.buffer;
}

/**
 *  Concatenate a literal string to the buffer.
 *
 *  @param str {String} The string to concatenate.
 */
function lit(str) {
  this.buffer += str;
  this.lastOut = str;
}

/**
 *  Output a newline to the buffer.
 */
function cr() {
  if (this.lastOut !== '\n') {
    this.lit('\n');
  }
}

/**
 *  Concatenate a string to the buffer possibly escaping the content.
 *
 *  Concrete renderer implementations should override this method.
 *
 *  @param str {String} The string to concatenate.
 */
function out(str) {
  this.lit(str);
}

/**
 *  Escape a string for the target renderer.
 *
 *  Abstract function that should be implemented by concrete 
 *  renderer implementations.
 *
 *  @param str {String} The string to escape.
 */
function esc(str) {
  return str;
}

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


Renderer.prototype.render = render;
Renderer.prototype.out = out;
Renderer.prototype.lit = lit;
Renderer.prototype.cr  = cr;
Renderer.prototype.esc  = esc;
Renderer.prototype.tochelper = tochelper;

module.exports = Renderer;

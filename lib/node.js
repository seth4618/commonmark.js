"use strict";

let nodeNames = {
    'document': 1,
    'block_quote': 1,
    'list': 1,
    'item': 1,
    'paragraph': 1,
    'heading': 1,
    'emph': 1,
    'strong': 1,
    'link': 1,
    'image': 1,
    'custom_inline': 1,
    'custom_block': 1,
    'text': [ ['literal', 'litr'] ],
    'code': 1,
    'linebreak': 1,
    'html_inline': 1,
    'softbreak': 1,
    'thematic_break': 1,
    'code_block': 1,
    'html_block': 1
};

let blockNodes = {
    'document': 1,
    'block_quote': 1,
    'list': 1,
    'item': 1,
    'paragraph': 1,
    'heading': 1,
    'thematic_break': 1,
    'code_block': 1,
    'html_block': 1
};

var resumeAt = function(node, entering) {
    this.current = node;
    this.entering = (entering === true);
};

var next = function(){
    var cur = this.current;
    var entering = this.entering;

    if (cur === null) {
        return null;
    }

    var container = isContainer(cur);

    if (entering && container) {
        if (cur._firstChild) {
            this.current = cur._firstChild;
            this.entering = true;
        } else {
            // stay on node but exit
            this.entering = false;
        }

    } else if (cur === this.root) {
        this.current = null;

    } else if (cur._next === null) {
        this.current = cur._parent;
        this.entering = false;

    } else {
        this.current = cur._next;
        this.entering = true;
    }

    return {entering: entering, node: cur};
};

var NodeWalker = function(root) {
    return { current: root,
             root: root,
             entering: true,
             next: next,
             resumeAt: resumeAt };
};

let uid = 0;

var Node = function(nodeType, sourcepos) {
    this._uid = uid++;
    this._type = nodeType;
    this._parent = null;
    this._firstChild = null;
    this._lastChild = null;
    this._prev = null;
    this._next = null;
    this._sourcepos = sourcepos;
    this._lastLineBlank = false;
    this._open = true;
    this._string_content = null;
    this._literal = null;
    this._listData = {};
    this._info = null;
    this._destination = null;
    this._title = null;
    this._isFenced = false;
    this._fenceChar = null;
    this._fenceLength = 0;
    this._fenceOffset = null;
    this._level = null;
    this._onEnter = null;
    this._onExit = null;
};

function ptr2id(name, node) {
    if (node) return [ name, node._uid ].join(':');
    return  [ name, '-' ].join(':');
}

Node.prototype.tostring = function() {
    let result = [ this._uid ];

    let lninfo = '';
    if (typeof this.sourcepos == 'object') {
        lninfo = [ this.sourcepos[0][0], ':', this.sourcepos[0][1] ].join('');
    }
    result.push(lninfo);

    result.push(this._type);
    result.push(ptr2id('^', this._parent));
    result.push(ptr2id('<', this._prev));
    result.push(ptr2id('>', this._next));
    result.push(ptr2id('1c', this._firstChild));
    result.push(ptr2id('Lc', this._lastChild));
    result.push('open:'+this._open);
    if (this._type == 'attrlist') {
        result.push(['info', this.attrinfo].join(':'));
        result.push(['use', this.use].join(':'));
        result.push(['render', this.renderattr].join(':'));
    }
    if (this._string_content) result.push(['SC', this._string_content].join(':'));
    return result.join('\t');
}

Node.addedContainers = {};

// check to see if 'name' is already in 'nodeNames'.  If not, add it and return true.
// if it is, return false.
Node.checkAndAddName = function(name, strhelper, isContainer, isBlock) {
    if (name in nodeNames) return false;
    if ((typeof strhelper) != 'object') strhelper = 1;
    nodeNames[name] = strhelper;
    if (isContainer) Node.addedContainers[name] = 1;
    if (isBlock) blockNodes[name] = 1;
    return true;    
};

function isContainer(node) {
    switch (node._type) {
    case 'document':
    case 'block_quote':
    case 'list':
    case 'item':
    case 'paragraph':
    case 'heading':
    case 'emph':
    case 'strong':
    case 'link':
    case 'image':
    case 'custom_inline':
    case 'custom_block':
        return true;
    default:
        return ((node._type in Node.addedContainers)&&(Node.addedContainers[node._type] == 1));
    }
}

var proto = Node.prototype;

Object.defineProperty(proto, 'isContainer', {
    get: function () { return isContainer(this); }
});

Object.defineProperty(proto, 'type', {
    get: function() { return this._type; }
});

Object.defineProperty(proto, 'firstChild', {
    get: function() { return this._firstChild; }
});

Object.defineProperty(proto, 'lastChild', {
    get: function() { return this._lastChild; }
});

Object.defineProperty(proto, 'next', {
    get: function() { return this._next; }
});

Object.defineProperty(proto, 'prev', {
    get: function() { return this._prev; }
});

Object.defineProperty(proto, 'parent', {
    get: function() { return this._parent; }
});

Object.defineProperty(proto, 'sourcepos', {
    get: function() { return this._sourcepos; }
});

Object.defineProperty(proto, 'literal', {
    get: function() { return this._literal; },
    set: function(s) { this._literal = s; }
});

Object.defineProperty(proto, 'destination', {
    get: function() { return this._destination; },
    set: function(s) { this._destination = s; }
});

Object.defineProperty(proto, 'title', {
    get: function() { return this._title; },
    set: function(s) { this._title = s; }
});

Object.defineProperty(proto, 'info', {
    get: function() { return this._info; },
    set: function(s) { this._info = s; }
});

Object.defineProperty(proto, 'level', {
    get: function() { return this._level; },
    set: function(s) { this._level = s; }
});

Object.defineProperty(proto, 'listType', {
    get: function() { return this._listData.type; },
    set: function(t) { this._listData.type = t; }
});

Object.defineProperty(proto, 'listTight', {
    get: function() { return this._listData.tight; },
    set: function(t) { this._listData.tight = t; }
});

Object.defineProperty(proto, 'listStart', {
    get: function() { return this._listData.start; },
    set: function(n) { this._listData.start = n; }
});

Object.defineProperty(proto, 'listDelimiter', {
    get: function() { return this._listData.delimiter; },
    set: function(delim) { this._listData.delimiter = delim; }
});

Object.defineProperty(proto, 'onEnter', {
    get: function() { return this._onEnter; },
    set: function(s) { this._onEnter = s; }
});

Object.defineProperty(proto, 'onExit', {
    get: function() { return this._onExit; },
    set: function(s) { this._onExit = s; }
});

Node.prototype.isBlock = function() {
    return (this._type in blockNodes);
};

Node.prototype.appendChild = function(child) {
    child.unlink();
    child._parent = this;
    if (this._lastChild) {
        this._lastChild._next = child;
        child._prev = this._lastChild;
        this._lastChild = child;
    } else {
        this._firstChild = child;
        this._lastChild = child;
    }
};

Node.prototype.prependChild = function(child) {
    child.unlink();
    child._parent = this;
    if (this._firstChild) {
        this._firstChild._prev = child;
        child._next = this._firstChild;
        this._firstChild = child;
    } else {
        this._firstChild = child;
        this._lastChild = child;
    }
};

// replace this with newnode in the tree
Node.prototype.replace = function(newnode) {
    if (this._prev) {
        this._prev._next = newnode;
        newnode._prev = this._prev;
    } else if (this._parent) {
        this._parent._firstChild = newnode;
        newnode._prev = null;
    }
    if (this._next) {
        this._next._prev = newnode;
        newnode._next = this._next;
    } else if (this._parent) {
        this._parent._lastChild = this._prev;
        newnode._next = null;
    }
    newnode._parent = this._parent;
    this._parent = null;
    this._next = null;
    this._prev = null;
};

Node.prototype.unlink = function() {
    if (this._prev) {
        this._prev._next = this._next;
    } else if (this._parent) {
        this._parent._firstChild = this._next;
    }
    if (this._next) {
        this._next._prev = this._prev;
    } else if (this._parent) {
        this._parent._lastChild = this._prev;
    }
    this._parent = null;
    this._next = null;
    this._prev = null;
};

Node.prototype.insertAfter = function(sibling) {
    sibling.unlink();
    sibling._next = this._next;
    if (sibling._next) {
        sibling._next._prev = sibling;
    }
    sibling._prev = this;
    this._next = sibling;
    sibling._parent = this._parent;
    if (!sibling._next) {
        sibling._parent._lastChild = sibling;
    }
};

Node.prototype.insertBefore = function(sibling) {
    sibling.unlink();
    sibling._prev = this._prev;
    if (sibling._prev) {
        sibling._prev._next = sibling;
    }
    sibling._next = this;
    this._prev = sibling;
    sibling._parent = this._parent;
    if (!sibling._prev) {
        sibling._parent._firstChild = sibling;
    }
};

Node.prototype.walker = function() {
    var walker = new NodeWalker(this);
    return walker;
};

Node.prototype.getRoot = function() {
    let root = this;
    while (root._parent != null) root = root._parent;
    return root;
};

Node.prototype.ashelper = function(depth, output, plain) {
    //console.log(depth, this.type);
    //console.log(this);
    var sp = this.sourcepos;
    const space = plain?' ':'&nbsp;';
    var lninfo = plain?" ":'&nbsp;&nbsp;&nbsp;';
    if (typeof sp == 'object') {
        lninfo = [ this.sourcepos[0][0], ':', this.sourcepos[0][1] ].join('');
    } 
    var line = [  space.repeat(depth), lninfo, ' ', this.type ];
    const extras = nodeNames[this.type];
    if ((typeof extras)=='object') {
        for (const extra of extras) {
            if (plain) 
                line.push([ ':', this[extra[0]]]);
            else
                line.push([ ':', '<span class="', this[extra[1]], '">', this[extra[0]], '</span>' ]);
        }
    }
    depth += 1;
    line.push('\t'+this.tostring());
    output.push(line.join(''));
    var n;
    for (n = this.firstChild; n != null; n=n.next) {
        n.ashelper(depth, output, plain);
    }
};

Node.prototype.asstring = function(plain) {
    if (plain === undefined) plain = true;
    var output = [];
    var depth = 0;
    this.ashelper(depth, output, plain);
    //console.log(output);
    return output.join(plain?'\n':'<br>\n')+'\n';
};


module.exports = Node;


/* Example of use of walker:

 var walker = w.walker();
 var event;

 while (event = walker.next()) {
 console.log(event.entering, event.node.type);
 }

 */

// used to parse {: attr-list :} inline element.  Which will attach
// attr-list to closest preceding html element, or, if at start of
// paragraph will create div with attr-list surrounding all its
// children

var Node;			// will be defined on install

const nodetype = 'attrlist';
const reAttrHere = /^\{:\s*(.+?)\s*:}/;
const reAttrPair = /([a-zA-Z0-9_]+)\s*=\s*((?:'[^']+')|(?:"[^"]+"))\s*/;

// Attempt to parse attr-list node
const parseAttrList = function(block) {
    var question = this.match(reAttrHere);
    if (question === null) {
        return false;
    }
    if (question.indexOf('=') == -1) {
        // no =, so not a reasonable attr
        console.log('Attributes are required to have values enclosed by double quotes');
        return false;
    }
    const match = question.match(reAttrHere);
    // we have the text of attribute list, turn it into pairs
    let remaining = match[1];
    let pairs = [];
    while (remaining.length > 0) {
        const oneattr = remaining.match(reAttrPair);
        if (oneattr == null) return false;
        const whole = oneattr[2];
        const stripped = whole.substring(1, whole.length-1);
        pairs.push([ oneattr[1], stripped ]);
        remaining = remaining.slice(oneattr[0].length);
    }
    let node = new Node(nodetype);
    node.attrinfo = pairs;
    block.appendChild(node);
    return true;
};

function renderHTML(node, entering) {
    if (entering) {
        if (!('renderattr' in node) || (node.renderattr == null)) return;
        
        // parse attrs into one pair broken by =
        const eqpos = node.renderattr.indexOf('=');
        this.tag(node.use, node.renderattr);
    } else if (('use' in node) && (node.use)) {
        this.tag('/'+node.use);
        if (node.use == 'div') this.cr();
    }
}

function renderXML(node, attrs) {
}

// called after tree is complete.  Used to move attrs nodes to correct place.
// if next node is a block node: make block a child of this node and will render this as div with attrs
// otherwise sweep back within same parent looking for a span, make it a child of this node and render as span with attrs
function rearrange(block) {
    let walker = block.walker();
    var event;
    
    while ((event = walker.next())) {
        const type = event.node.type;
        if (!event.entering) continue;
        const node = event.node;
        if ((type == nodetype)&&(node.attrinfo != null)) {
            const node = event.node;
            if (node.next && node.next.isBlock() && ((node.prev === null)||(node.prev.isBlock()))) {
                // wrap next node under this block
                let wrapme = node.next;
                wrapme.unlink();
                node.appendChild(wrapme);
                node.renderattr = node.attrinfo;
                node.use = 'div';
                node.attrinfo = null;
            } else {
                // find prev inline element (or if none, then parent)
                let wrapme = null;
                for (wrapme = node.prev; wrapme; wrapme = wrapme.prev) {
                    if (wrapme.type != 'text') break;
                }
                let wrapper = new Node(nodetype);
                wrapper.renderattr = node.attrinfo;
                wrapper.attrinfo = node.attrinfo = node.renderattr = null;
                wrapper.use = 'span';
                if (wrapme == null) {
                    // there was no previous inline, get parent
                    wrapme = node.parent;
                    wrapper.use = 'div';
                } else {
                }
                wrapme.replace(wrapper);
                wrapper.appendChild(wrapme);
            }
        }
    }
    return block;
}

const C_LEFT_BRACE = 123;

const install = function(aip, html, xml) {
    Node = aip(C_LEFT_BRACE, nodetype, parseAttrList, true, [ ['attrinfo', 'litr'], ['renderattr', 'litr'], ['use', 'litr'] ]);
    if (html) {
        html[nodetype] = renderHTML; 
    }
    if (xml) {
        xml.addRenderer(nodetype, renderXML);
    }

};

module.exports = {install: install, rearrange: rearrange};

const C_LEFT_BRACE = 123;

const reAnchor = /^\{\#([A-Za-z0-9_-]+)\}/;

// attempt to parse an anchor
var parseAnchor = function(block) {
    const anchor = this.match(reAnchor);
    if (anchor === null) return false;
    const match = anchor.match(reAnchor);
    // we have a match for an anchor
    let node = new Node('anchor');
    node.anchorName = match[1];
    block.appendChild(node);
    return true;
}

function renderHTML(node, entering) {
    if (entering) {
        this.tag('span', [['id', node.anchorName]], true);
    }
}

function renderXML(node, attrs) {
    attrs.push( ['name', node.anchorName] );
}

const install = function(aip, html, xml) {
    Node = aip(C_LEFT_BRACE, 'anchor', parseAnchor, false, [ ['level', 'litr'] ]);
    if (html) {
        html.anchor = renderHTML; 
    }
    if (xml) {
        xml.addRenderer('anchor', renderXML);
    }

};

module.exports = install;

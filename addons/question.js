var Node;			// will be defined on install

const reQuestionHere = /^\{question(?::([0-9]+))?\}/;

// Attempt to parse {question:level}, include a question node which
// will be numbered accordingly when we render this node
const parseQuestion = function(block) {
    var question = this.match(reQuestionHere);
    if (question === null) {
        return false;
    }
    const match = question.match(reQuestionHere);
    // we have a question marker
    let node = new Node('question');
    node.level = parseInt(match[1] || "1");
    block.appendChild(node);
    return true;
};


let questionLevelTypes = [ '1', 'A', 'i', 'a' ];
const romanNumbers = [
    "?",
    "i",
    "ii",
    "iii",
    "iv",
    "v",
    "vi",
    "vii",
    "viii",
    "ix",
    "x" 
];
    
function formatQuestionNumber(level, numbers) {
    while (level >= questionLevelTypes) {
        questionLevelTypes.push([ '1', 'A', 'i', 'a' ]);
    }
    let result = [];
    for (let i=1; i<=level; i++) {
        const number = numbers[i];
        switch (questionLevelTypes[i-1]) {
        case '1':
            result.push(""+number);
            break;
        case 'A':
            result.push(String.fromCharCode(number+'A'.charCodeAt(0)-1));
            break;
        case 'i':
            while (number > romanNumbers.length) {
                const base = romanNumbers.length-10;
                for (let i=1; i<=10; i++) {
                    romanNumbers.push("x"+romanNumbers[base+i]);
                }
            }
            result.push(romanNumbers[number]);
            break;
        case 'a':
            result.push(String.fromCharCode(number+'a'.charCodeAt(0)-1));
            break;
        default:
            result.push("????");
        }
    }
    return result.join('.');
}

function questionHtmlRenderer(node, entering) {
    if (entering) {
        const level = node.level;
        while (level >= this.questionNumbers.length) this.questionNumbers.push(0);
        this.tag('span', [['class', 'qnum']]);
        this.questionNumbers[level]++;
        this.out(formatQuestionNumber(level, this.questionNumbers));
        this.tag('/span');
        while (level < this.lastQuestionLevel) {
            // reset number so if we go back to the level we are at right number
            this.questionNumbers[this.lastQuestionLevel] = 0;
            this.lastQuestionLevel--;
        }
        this.lastQuestionLevel = level;
    }
}

function questionHtmlInit() {
    console.log("Initializing question");
    this.questionNumbers = [ 0, 0, 0, 0 ];
    this.lastQuestionLevel = 0;
}

function questionXmlRenderer(node, attrs) {
    const level = node.level;
    while (level >= this.questionNumbers.length) this.questionNumbers.push(0);
    this.questionNumbers[level]++;
    attrs.push( ['number', formatQuestionNumber(level, this.questionNumbers) ]);
    while (level < this.lastQuestionLevel) {
        // reset number so if we go back to the level we are at right number
        this.questionNumbers[this.lastQuestionLevel] = 0;
        this.lastQuestionLevel--;
    }
    this.lastQuestionLevel = level;
}

const C_LEFT_BRACE = 123;

const install = function(aip, html, xml) {
    Node = aip(C_LEFT_BRACE, 'question', parseQuestion, [ ['level', 'litr'] ]);
    if (Node === false) throw "Cannot install 'question'";
    if (html) {
        html.question = questionHtmlRenderer; 
        html.addInit(questionHtmlInit);
    }
    if (xml) {
        xml.addRenderer('question', questionXmlRenderer);
        xml.addInit(questionHtmlInit);
    }

};

module.exports = install;

// renderer for exams

"use strict";

var Renderer = require('../lib/render/renderer');

function ExamRenderer(options) {
    options = options || {};
    this.options = options;
    this.numqs = 0;
    this.total = 0;
    this.qtypes = [];
}

function getNumQuestions() {
    return this.numqs;
}


function checkExamTypes() {
    if (this.total != 0) return false;
    return true;
}

function getExamTypes () {
    if (this.total != 0) {
        const diff = this.total > 0 ? this.total : -this.total;
        return [ "There are ", diff, " too ", (this.total > 0 ? "few" : "many"), " solution lines.\n" ].join("");
    }
    return this.qtypes.join(',')+"\n\n";
}

function solution(node, entering) {
    if (entering) {
        const line = node._string_content.trim();
        const lines = line.split('\n').length;
        this.total -= lines;
        this.numqs++;
        this.lit(line);
        this.cr();
    } 
}

function radio(node, entering) {
    if (entering) {
        this.total++;
        this.qtypes.push('radio');
    }
}

function blank(node, entering) {
    if (entering) {
        this.total++;
        this.qtypes.push('text');
    }
}

// quick browser-compatible inheritance
ExamRenderer.prototype = Object.create(Renderer.prototype);

ExamRenderer.prototype.radio = radio;
ExamRenderer.prototype.blank = blank;
ExamRenderer.prototype.solution = solution;
ExamRenderer.prototype.getHeader = getExamTypes;
ExamRenderer.prototype.checkExamTypes = checkExamTypes;
ExamRenderer.prototype.getNumQuestions = getNumQuestions;

module.exports = ExamRenderer;

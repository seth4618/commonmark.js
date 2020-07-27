"use strict";

/*eslint-env browser*/
/*global $, _ */

var commonmark = window.commonmark;
var writer = new commonmark.HtmlRenderer({ sourcepos: true });
var htmlwriter = new commonmark.HtmlRenderer({ sourcepos: false });
var reader = new commonmark.Parser();
var addons = window.addons;
const Menu = window.Menu;

addons.toc(reader.addParserFunction('block'), writer, null);
addons.question(reader.addParserFunction('inline'), writer, null);
addons.localAnchor(reader.addParserFunction('inline'), writer, null);
addons.include(reader.addParserFunction('block'), writer, null);
addons.attr(reader.addParserFunction('inline'), writer, null);
addons.examRadio.blocks(reader.addParserFunction('block'), writer, null);
addons.examRadio.inlines(reader.addParserFunction('inline'), writer, null);
addons.table(reader.addParserFunction('block'), writer, null);

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] === variable){
            return decodeURIComponent(pair[1]);
        }
    }
    return null;
}

var render = function(parsed) {
    if (parsed === undefined) {
        return;
    }
    var startTime = new Date().getTime();
    var result = writer.render(parsed);
    var endTime = new Date().getTime();
    var renderTime = endTime - startTime;
    var preview = $("#preview iframe").contents().find('body').html(result);
    $("#rendertime").text(renderTime);
    //var asstr = parsed.asstring(false);
    //$('#tree').empty().append($('<div>'+asstr+'</div>'));
};

var syncScroll = function() {
    var textarea = $("#text");
    var preview = $("#preview iframe").contents().find('body');
    var lineHeight = parseFloat(textarea.css('line-height'));
    // NOTE this assumes we don't have wrapped lines,
    // so we have set white-space:nowrap on the textarea:
    var lineNumber = Math.floor(textarea.scrollTop() / lineHeight) + 1;
    var elt = preview.find("*[data-sourcepos^='" + lineNumber + ":']").last();
    if (elt.length > 0) {
        if (elt.offset()) {
            console.log("Moving scrollTop to ", elt.offset().top - 100);
            preview.animate({
                scrollTop: elt.offset().top - 100
            }, 50);
        }
    }
};

var markSelection = function() {
    var cursorPos = $("#text").prop("selectionStart");
    // now count newline up to this pos
    var textval = $("#text").val();
    var lineNumber = 1;
    for (var i = 0; i < cursorPos; i++) {
        if (textval.charAt(i) === '\n') {
            lineNumber++;
        }
    }
    var preview = $("#preview iframe").contents().find('body');
    var elt = preview.find("[data-sourcepos^='" + lineNumber + ":']").last();
    if (elt.length > 0) {
        preview.find(".selected").removeClass("selected");
        elt.addClass("selected");
    }
    syncScroll();
};

var parseAndRender = function() {
    var textarea = $("#text");
    var startTime = new Date().getTime();
    var parsed = reader.parse(textarea.val());
    var endTime = new Date().getTime();
    var parseTime = endTime - startTime;
    $("#parsetime").text(parseTime);
    $(".timing").css('visibility', 'visible');
    render(parsed);
    markSelection();
};

let $editor = null;

function actualQuestionInsertion(val) {
    $editor.focus();
    const start = $editor.getSelection().start;
    $editor.insertText('{question:'+val+'}', start, "select");
    $editor.focus();
    setTimeout(function() { $editor.focus(); $editor.setSelection(start+10, start+11); }, 100);
}

function insertQuestion() {
    $editor.collapseSelection(true);
    $('#level-dialog').dialog("open");
}

// return true if cursor is at start of line
function atLineStart() {
    const currentSelection = $editor.getSelection();
    if (currentSelection.start == 0) return true;
    $editor.setSelection(currentSelection.start-1, currentSelection.end);
    const sel = $editor.getSelection();
    const prevchar = sel.text.charAt(0);
    $editor.setSelection(currentSelection.start, currentSelection.end);
    return (prevchar == '\n');
}

function showError(msg) {
    const $dialog = $('#error-dialog');
    $dialog.empty();
    $dialog.append('<p>'+msg+'</p>');
    $dialog.dialog("open");
}

function insertRadio() {
    $editor.collapseSelection(true);
    const currentSelection = $editor.getSelection();
    $editor.insertText('{radio:begin}\n{answer:a} answer-a\n{radio:end}\n', $editor.getSelection().start, "collapseToStart");
    $editor.setSelection(currentSelection.start+14, currentSelection.start+14+19);
}

function insertBlank() {
    $editor.collapseSelection(true);
    const currentSelection = $editor.getSelection();
    $editor.insertText('{blank:10}', $editor.getSelection().start, "collapseToStart");
    $editor.setSelection(currentSelection.start+7, currentSelection.start+9);
}

function insertSolutionBlock() {
    if (!atLineStart()) {
        showError('Need to be at the start of a line to insert a solution block');
        return;
    }
    $editor.collapseSelection(true);
    const currentSelection = $editor.getSelection();
    $editor.insertText('{solution:begin}\nanswer, points, ... [no comma after last one]\n{solution:end}\n', currentSelection.start, "collapseToStart");
    $editor.setSelection(currentSelection.start+17, currentSelection.start+17+45);
}

function actualTableInsertion(cols, sepr) {
    const start = $editor.getSelection().start;
    const startTable = '{table:begin:'+cols+':'+sepr+'}\n';
    let seprs = new Array(cols);
    for (let i=0; i<cols; i++) seprs[i] = 'Col-'+(i+1);
    const seprline = seprs.join(' '+sepr+' ');
    $editor.insertText(startTable+seprline+'|\n{table:end}\n', start, "collapseToStart");
    console.log(start, startTable.length);
    setTimeout(function() { $editor.focus(); $editor.setSelection(start+startTable.length, start+startTable.length+5); }, 100);
}

function insertTable() {
    if (!atLineStart()) {
        showError('Need to be at the start of a line to insert a table');
        return;
    }
    $editor.collapseSelection(true);
    $('#table-dialog').dialog("open");
}

function initRenderer()
{
    $("#preview iframe").contents().find('head').html('<link href="bootstrap.min.css" rel="stylesheet"><link href="dingus.css" rel="stylesheet">');


    var textarea = $("#text");
    $editor = textarea;
    var initial_text = getQueryVariable("text");
    var smartSelected = getQueryVariable("smart") === "1";
    $("#smart").prop('checked', smartSelected);
    reader.options.smart = smartSelected;
    if (initial_text) {
        textarea.val(initial_text);
    }

    parseAndRender();

    $("#clear-text-box").click(function() {
        textarea.val('');
        parseAndRender();
    });

    $('#insert-question').click(insertQuestion);
    $('#insert-radio').click(insertRadio);
    $('#insert-blank').click(insertBlank);
    $('#insert-solution-block').click(insertSolutionBlock);
    $('#insert-table').click(insertTable);
    

    textarea.bind('input propertychange',
                  _.debounce(parseAndRender, 50, { maxWait: 100 }));
    //textarea.on('scroll', _.debounce(syncScroll, 50, { maxWait: 50 }));
    textarea.on('scroll', syncScroll);
    textarea.on('keydown click focus',
                _.debounce(markSelection, 50, { maxWait: 100}));

    $("#smart").click(function() {
        reader.options.smart = false;
        parseAndRender();
    });
}


$(document).ready(function() {
    const iframe = $('#preview iframe')[0];
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write('<head>  <meta charset="utf-8">  <title>commonmark.js preview</title>  <link href="bootstrap.min.css" rel="stylesheet">  <link href="dingus.css" rel="stylesheet">  <style>    body { margin: 0; padding: 0; }    .selected { background-color: #eeeeee; }  </style></head><body><div>filler</div></body>');
    iframe.contentWindow.document.close();
    initRenderer();
    
    $('#error-dialog').dialog({
	autoOpen: false,
	width: 400,
        modal: true,
        classes: {
            "ui-dialog-title": "custom-red"
        }
    });

    $('#level-dialog').dialog({
        autoOpen: false,
	width: 400,
        modal: true,
        buttons: {
            'Insert': function () {
                var name = $('input[name="level"]').val();
                actualQuestionInsertion(name);
                $(this).dialog('close');
            },
            'Cancel': function () {
                $(this).dialog('close');
            }
        }
    });

    $('#table-dialog').dialog({
        autoOpen: false,
	width: 400,
        modal: true,
        buttons: {
            'Insert': function () {
                var cols = $('input[name="cols"]').val();
                var sepr = $('input[name="sepr"]').val();
                actualTableInsertion(parseInt(cols), sepr);
                $(this).dialog('close');
            },
            'Cancel': function () {
                $(this).dialog('close');
            }
        }
    });
    
});

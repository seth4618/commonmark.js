"use strict";

/*eslint-env browser*/
/*global $, _ */

var commonmark = window.commonmark;
var writer = new commonmark.HtmlRenderer({ sourcepos: true });
var htmlwriter = new commonmark.HtmlRenderer({ sourcepos: false });
var reader = new commonmark.Parser();
var addons = window.addons;

addons.toc(reader.addParserFunction('block'), writer, null);
addons.question(reader.addParserFunction('inline'), writer, null);
addons.localAnchor(reader.addParserFunction('inline'), writer, null);
addons.include(reader.addParserFunction('block'), writer, null);
addons.attr.install(reader.addParserFunction('inline'), writer, null);
addons.examRadio.blocks(reader.addParserFunction('block'), writer, null);
addons.examRadio.inlines(reader.addParserFunction('inline'), writer, null);

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
    parsed = addons.attr.rearrange(parsed);
    var result = writer.render(parsed);
    var endTime = new Date().getTime();
    var renderTime = endTime - startTime;
    var preview = $("#preview iframe").contents().find('body');
    preview.get(0).innerHTML = result;
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

$(document).ready(function() {
  $('iframe').on('load', function() {
    var textarea = $("#text");
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
  });
});

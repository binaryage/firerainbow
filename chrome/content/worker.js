// import codemirror
Editor = {};var indentUnit = 2;
importScripts("chrome://firerainbow/content/codemirror/util.js");
importScripts("chrome://firerainbow/content/codemirror/tokenize.js");
importScripts("chrome://firerainbow/content/codemirror/tokenizejavascript.js");
importScripts("chrome://firerainbow/content/codemirror/parsejavascript.js");
importScripts("chrome://firerainbow/content/codemirror/parsecss.js");
importScripts("chrome://firerainbow/content/codemirror/parsexml.js");
importScripts("chrome://firerainbow/content/codemirror/parsehtmlmixed.js");
importScripts("chrome://firerainbow/content/codemirror/stringstream.js");

// steal some firebug escaping magic
var entityConversionLists = this.entityConversionLists = {
    normal : {
        whitespace : {
            '\t' : '\u200c\u2192',
            '\n' : '\u200c\u00b6',
            '\r' : '\u200c\u00ac',
            ' '  : '\u200c\u00b7'
        }
    },
    reverse : {
        whitespace : {
            '&Tab;' : '\t',
            '&NewLine;' : '\n',
            '\u200c\u2192' : '\t',
            '\u200c\u00b6' : '\n',
            '\u200c\u00ac' : '\r',
            '\u200c\u00b7' : ' '
        }
    }
};

var normal = entityConversionLists.normal,
    reverse = entityConversionLists.reverse;

function addEntityMapToList(ccode, entity)
{
    var lists = Array.slice(arguments, 2),
        len = lists.length,
        ch = String.fromCharCode(ccode);
    for (var i = 0; i < len; i++)
    {
        var list = lists[i];
        normal[list]=normal[list] || {};
        normal[list][ch] = '&' + entity + ';';
        reverse[list]=reverse[list] || {};
        reverse[list]['&' + entity + ';'] = ch;
    }
}

var e = addEntityMapToList,
    white = 'whitespace',
    text = 'text',
    attr = 'attributes',
    css = 'css',
    editor = 'editor';

e(0x0022, 'quot', attr, css);
e(0x0026, 'amp', attr, text, css);
e(0x0027, 'apos', css);
e(0x003c, 'lt', attr, text, css);
e(0x003e, 'gt', attr, text, css);
e(0xa9, 'copy', text, editor);
e(0xae, 'reg', text, editor);
e(0x2122, 'trade', text, editor);

e(0x00a0, 'nbsp', attr, text, white, editor);
e(0x2002, 'ensp', attr, text, white, editor);
e(0x2003, 'emsp', attr, text, white, editor);
e(0x2009, 'thinsp', attr, text, white, editor);
e(0x200c, 'zwnj', attr, text, white, editor);
e(0x200d, 'zwj', attr, text, white, editor);
e(0x200e, 'lrm', attr, text, white, editor);
e(0x200f, 'rlm', attr, text, white, editor);
e(0x200b, '#8203', attr, text, white, editor); // zero-width space (ZWSP)

//************************************************************************************************
// Entity escaping

var entityConversionRegexes = {
        normal : {},
        reverse : {}
    };

var escapeEntitiesRegEx = {
    normal : function(list)
    {
        var chars = [];
        for ( var ch in list)
        {
            chars.push(ch);
        }
        return new RegExp('([' + chars.join('') + '])', 'gm');
    },
    reverse : function(list)
    {
        var chars = [];
        for ( var ch in list)
        {
            chars.push(ch);
        }
        return new RegExp('(' + chars.join('|') + ')', 'gm');
    }
};

function getEscapeRegexp(direction, lists)
{
    var name = '', re;
    var groups = [].concat(lists);
    for (i = 0; i < groups.length; i++)
    {
        name += groups[i].group;
    }
    re = entityConversionRegexes[direction][name];
    if (!re)
    {
        var list = {};
        if (groups.length > 1)
        {
            for ( var i = 0; i < groups.length; i++)
            {
                var aList = entityConversionLists[direction][groups[i].group];
                for ( var item in aList)
                    list[item] = aList[item];
            }
        } else if (groups.length==1)
        {
            list = entityConversionLists[direction][groups[0].group]; // faster for special case
        } else {
            list = {}; // perhaps should print out an error here?
        }
        re = entityConversionRegexes[direction][name] = escapeEntitiesRegEx[direction](list);
    }
    return re;
}

function createSimpleEscape(name, direction)
{
    return function(value)
    {
        var list = entityConversionLists[direction][name];
        return String(value).replace(
                getEscapeRegexp(direction, {
                    group : name,
                    list : list
                }),
                function(ch)
                {
                    return list[ch];
                }
               );
    }
}

var escapeForSourceLine = createSimpleEscape('text', 'normal');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function run(lines) {
    var nextLine = null;

    var firstLine = "";
    var lineNo = 0;
    while (lineNo<lines.length) {
        firstLine = lines[lineNo];
        firstLine = firstLine.replace(/^\s*|\s*$/g,"");
        if (firstLine!="") break;
        lineNo++;
    }
    // determine what parser to use
    var parser = JSParser;
    // use HTML mixed parser if you encounter these substrings on first line
    if (firstLine.indexOf('<!DOCTYPE')!=-1 || firstLine.indexOf("<html")!=-1 || 
        firstLine.indexOf("<body")!=-1 || firstLine.indexOf("<head")!=-1) parser = HTMLMixedParser;
    var parser = parser.make(stringStream({
        next: function() {
            if (nextLine===null) throw StopIteration;
            var result = nextLine;
            nextLine = null;
            return result;
        }
    }));


    var lineToBeColorized = 0;
    var styleLibrary = {};
    var colorizedLines = [];

    while (lineToBeColorized < lines.length) {
        // extract line code from node
        // note: \n is important to simulate multi line text in stream (for example multi-line comments depend on this)
        nextLine = lines[lineToBeColorized]+"\n";

        parsedLine = [];

        forEach(parser,
            function(token) {
                // colorize token
                var val = token.value;
                parsedLine.push('<span class="' + token.style + '">' + escapeForSourceLine(val) + '</span>');
                styleLibrary[token.style] = true;
            }
        );

        // apply coloring to the line
        var newLine = parsedLine.join('').replace(/\n/g, '');
        colorizedLines.push(newLine);
        postMessage({msg: 'progress', lineNo: lineToBeColorized++, line: newLine});

        // move for next line
        lineToBeColorized++;
    }    
    postMessage({msg: 'done', styleLibrary: styleLibrary});
}

onmessage = function(e) {
    switch (e.data.command) {
        case 'run': run(e.data.lines); break;
        default: throw "Unkwnown command for worker!";
    }
}
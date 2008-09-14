// This source contains copy&pasted various bits from Firebug sources.
//

// open custom scope
FBL.ns(function() {
    with (FBL) {
        // some people reported that rainbow was initialised twice
        // see http://getsatisfaction.com/xrefresh/topics/too_many_recursions_problem_with_rainbow
        // this is a way how to prevent it ()
        if (!FBL.rainbowInitialised) {
            FBL.rainbowInitialised = true;

            // test for feature added in r686 (http://code.google.com/p/fbug/source/detail?r=686)
            // note: previous rainbow did break firebug without this test
            var cssPanelAvailable = !!Firebug.CSSStyleSheetPanel;
            if (!cssPanelAvailable)
            {
                var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
                consoleService.logStringMessage("Rainbow requires Firebug 1.2+ (your have "+Firebug.getVersion()+").");
                consoleService.logStringMessage('Please update your Firebug extension to latest version (http://getfirebug.com).');
            }
            else
            {
                const nsIPrefBranch = Ci.nsIPrefBranch;
                const nsIPrefBranch2 = Ci.nsIPrefBranch2;

                const rainbowPrefService = Cc["@mozilla.org/preferences-service;1"];
                const rainbowPrefs = rainbowPrefService.getService(nsIPrefBranch2);

                const rainbowWebsite = "http://xrefresh.com/rainbow";
                const rainbowPrefDomain = "extensions.rainbow";

                const currentCodeVersion = 2;

                if (Firebug.TraceModule)
                {
                    Firebug.TraceModule.DBG_RAINBOW = false;
                    var type = rainbowPrefs.getPrefType('extensions.firebug.DBG_RAINBOW');
                    if (type!=nsIPrefBranch.PREF_BOOL) try {
                        rainbowPrefs.setBoolPref('extensions.firebug.DBG_RAINBOW', false);
                    } catch(e) {}
                }

                FBL.getSourceLineRange = function(lines, min, max, maxLineNoChars)
                {
                    var html = [];
                    for (var i = min; i <= max; ++i)
                    {
                        // Make sure all line numbers are the same width (with a fixed-width font)
                        var lineNo = i + "";
                        while (lineNo.length < maxLineNoChars)
                            lineNo = " " + lineNo;

                        var line;
                        if (lines.colorizedLines && lines.colorizedLines[i-1]) 
                            line = lines.colorizedLines[i-1]; 
                        else 
                            line = escapeHTML(lines[i-1]);

                        html.push(
                            '<div class="sourceRow"><a class="sourceLine">',
                            lineNo,
                            '</a><span class="sourceRowText">',
                            line,
                            '</span></div>'
                        );
                    }
                    return html.join("");
                };

                Firebug.ScriptPanel.prototype.reViewOriginal = Firebug.ScriptPanel.prototype.reView;
                Firebug.ScriptPanel.prototype.reView = function(sourceBox) {
                    var scrollTop = sourceBox.scrollTop;
                    var scrollStep = sourceBox.lineHeight;
                    if (!scrollStep || scrollStep < 1) {
                        var newBottomLine = 0;
                    } else {
                        var newBottomLine = Math.round((scrollTop + sourceBox.clientHeight)/scrollStep);
                    }
                    Firebug.RainbowExtension.colorizeSourceBox(this, sourceBox, newBottomLine);
                    return this.reViewOriginal(sourceBox);
                };

                ////////////////////////////////////////////////////////////////////////
                // Firebug.RainbowExtension, here we go!
                //
                Firebug.RainbowExtension = extend(Firebug.Module,
                {
                    valid: false,
                    pings: 0,
                    styleLibrary: {},

                    /////////////////////////////////////////////////////////////////////////////////////////
                    checkFirebugVersion: function()
                    {
                        var version = Firebug.getVersion();
                        if (!version) return false;
                        var a = version.split('.');
                        if (a.length<2) return false;
                        // we want Firebug version 1.2+ (including alphas/betas and other weird stuff)
                        return parseInt(a[0], 10)>=1 && parseInt(a[1], 10)>=2;
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    initialize: function()
                    {
                        return Firebug.Module.initialize.apply(this, arguments);
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    showPanel: function(browser, panel)
                    {
                        if (!this.valid) return;
                        if (FBTrace && FBTrace.DBG_RAINBOW) FBTrace.dumpProperties("Rainbow: showPanel", panel);
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    initContext: function(context)
                    {
                        if (FBTrace && FBTrace.DBG_RAINBOW) FBTrace.dumpProperties("Rainbow: initContext", context);
                        Firebug.Module.initContext.apply(this, arguments);
                        // check firebug version
                        if (!this.checkFirebugVersion())
                        {
                            if (FBTrace && FBTrace.DBG_RAINBOW) FBTrace.dumpProperties("Rainbow requires Firebug 1.2+ (your version is "+Firebug.getVersion()+")");
                            return;
                        }
                        this.hookPanel(context);
                        this.valid = true;
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    // convert old code to be compatible with current rainbow
                    convertOldCode: function(code, version)
                    {
                        switch (version) {
                            case 1: return code.replace(/\.(\w+)\s*\{/g, ".js-$1 {"); // conversion for mixed html coloring
                        }
                        return code;
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    getCodeVersion: function(code)
                    {
                        var vc = code.match(/\/\* version:(.*) \*\//);
                        if (!vc) return 1;
                        return parseInt(vc[1], 10);
                    },
                    colorizeSourceBox: function(panel, sourceBox, newBottomLine) {
                        if (FBTrace && FBTrace.DBG_RAINBOW) FBTrace.dumpProperties("Rainbow: colorizeSourceBox", sourceBox);
                        this.pingDaemon(panel, sourceBox, newBottomLine);
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    hookPanel: function(context)
                    {
                        if (FBTrace && FBTrace.DBG_RAINBOW) FBTrace.dumpProperties("Rainbow: hookPanel", context);
                        var chrome = context ? context.chrome : FirebugChrome;
                        var code = this.getPref('coloring');
                        var version = this.getCodeVersion(code);
                        if (version<currentCodeVersion)
                        {
                            // backward compatibility with old rainbow versions
                            code = this.convertOldCode(code, version);
                            this.storeCode(code);
                        }
                        this.panelBar1 = chrome.$("fbPanelBar1");
                        this.initSyntaxColoring(this.panelBar1);
                        this.applySyntaxColoring(code, this.panelBar1);
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    storeCode: function(code)
                    {
                        var code = "/* version:"+currentCodeVersion+" */\n"+code;
                        this.setPref('coloring', code);
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    startDaemon: function(panel, sourceBox, newBottomLine)
                    {
                        // daemon is here to perform colorization in background
                        // the goal is not to block Firebug functionality and don't hog CPU for too long
                        // daemonInterval and linesPerCall properties define how intensive this background process should be
                        this.bottomLine = newBottomLine;
                        this.lastScriptPanel = panel;
                        if (this.currentSourceBox===sourceBox) return;

                        this.stopDaemon(); // never let run two or more daemons concruently!
                        if (FBTrace && FBTrace.DBG_RAINBOW) FBTrace.dumpProperties("Rainbow: startDaemon");

                        // find active source box - here we will keep daemon state (parser state)
                        if (!sourceBox) return;
                        if (!sourceBox.lines) return;
                        if (sourceBox.colorized) return; // already colorized
                        
                        this.currentSourceBox = sourceBox;
                        if (sourceBox.lineToBeColorized==undefined) sourceBox.lineToBeColorized = 0;
                        if (!sourceBox.lines.colorizedLines) sourceBox.lines.colorizedLines = [];

                        // init daemon state
                        if (!sourceBox.stream) sourceBox.stream = Editor.rainbowStream();

                        if (!sourceBox.parser) {
                            var firstLine = "";
                            var lineNo = 0;
                            while (lineNo<sourceBox.lines.length) {
                                firstLine = sourceBox.lines[lineNo];
                                firstLine = firstLine.replace(/^\s*|\s*$/g,"");
                                if (firstLine!="") break;
                                lineNo++;
                            }
                            // determine what parser to use
                            var parser = JSParser;
                            // use HTML mixed parser if you encounter these substrings on first line
                            if (firstLine.indexOf('<!DOCTYPE')!=-1 || firstLine.indexOf("<html")!=-1 || 
                                firstLine.indexOf("<body")!=-1 || firstLine.indexOf("<head")!=-1) parser = HTMLMixedParser;
                            sourceBox.parser = parser.make(sourceBox.stream);
                        }

                        var linesPerCall = this.getPref('linesPerCall', 20);
                        var daemonInterval = this.getPref('daemonInterval', 100);

                        // run daemon
                        var that = this;
                        this.daemonTimer = setInterval(
                            function() {
                                if (FBTrace && FBTrace.DBG_RAINBOW) FBTrace.sysout("Rainbow: daemon processing lines "+sourceBox.lineToBeColorized+"-"+(sourceBox.lineToBeColorized+linesPerCall));
                                var count = linesPerCall;
                                while (count--) {
                                    var currentLineNo = sourceBox.lineToBeColorized;
                                    // finish if no more nodes
                                    if (currentLineNo >= sourceBox.lines.length) {
                                        // do review to be sure actual view gets finaly colorized
                                        if (that.lastScriptPanel) that.lastScriptPanel.reView(sourceBox);
                                        that.stopDaemon();
                                        sourceBox.colorized = true;
                                        // free up memory
                                        sourceBox.parser = undefined;
                                        sourceBox.stream = undefined;
                                        return;
                                    }
                                    // extract line code from node
                                    // note: \n is important to simulate multi line text in stream (for example multi-line comments depend on this)
                                    var code = sourceBox.lines[currentLineNo]+"\n";
                                    sourceBox.stream.reinit(code);
                                    var line = [];
                                    // parts accumulated for current line
                                    // process line tokens
                                    forEach(sourceBox.parser,
                                        function(token) {
                                            // colorize token
                                            var val = token.value;
                                            line.push('<span class="' + token.style + '">' + escapeHTML(val) + '</span>');
                                            that.styleLibrary[token.style] = true;
                                        }
                                    );

                                    // apply coloring to line
                                    sourceBox.lines.colorizedLines.push(line.join(""));

                                    // move for next line
                                    sourceBox.lineToBeColorized++;
                                }
                                
                                if (sourceBox.lineToBeColorized>=that.bottomLine && sourceBox.lineToBeColorized-linesPerCall<=that.bottomLine) {
                                    // just crossed actual view, do a reView
                                    if (that.lastScriptPanel) that.lastScriptPanel.reView(sourceBox);
                                }
                            },
                        daemonInterval);
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    stopDaemon: function()
                    {
                        if (!this.daemonTimer) return;
                        if (FBTrace && FBTrace.DBG_RAINBOW) FBTrace.dumpProperties("Rainbow: stopDaemon");
                        clearInterval(this.daemonTimer);
                        this.daemonTimer = undefined;
                        this.currentSourceBox = undefined;
                        this.bottomLine = undefined;
                        this.lastScriptPanel = undefined;
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    pingDaemon: function(panel, sourceBox, newBottomLine)
                    {
                        if (!this.valid) return;
                        
                        // trivial implementation of buffered deferred triggering of daemon
                        this.pings++;
                        var pingMarker = this.pings;
                        var that = this;
                        setTimeout(function(){
                            if (that.pings!=pingMarker) return;
                            that.startDaemon(panel, sourceBox, newBottomLine);
                        }, 200);
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    // initializes syntax coloring helpers for panel
                    initSyntaxColoring: function(panelBar)
                    {
                        // here we append <style id='rainbow-style-sheet' type='text/css'>/* Syntax coloring */</style> into head element
                        // this style element we will use to apply coloring rules to all script boxes in the panel
                        if (this.lookupStyleElement(panelBar)) return; // already done

                        var browser = panelBar.browser;
                        var doc = browser.contentDocument;

                        var styleElement = doc.createElement("style");
                        styleElement.setAttribute("id", "rainbow-style-sheet");
                        styleElement.setAttribute("type", "text/css");
                        styleElement.appendChild(doc.createTextNode('/* Syntax coloring */'));

                        var headElement;
                        var headElementList = doc.getElementsByTagName("head");
                        if (headElementList.length) headElement = headElementList[0]; else headElement = doc.documentElement;
                        headElement.appendChild(styleElement);
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    // returns our rainbow-style-sheet element from given panel
                    lookupStyleElement: function(panelBar)
                    {
                        var browser = panelBar.browser;
                        var doc = browser.contentDocument;
                        var styleElement = doc.getElementById('rainbow-style-sheet');
                        return styleElement;
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    // applies new coloring rules to given panel
                    applySyntaxColoring: function(code, panelBar)
                    {
                        var styleElement = this.lookupStyleElement(panelBar);
                        if (!styleElement) return;
                        styleElement.innerHTML = '';
                        var browser = panelBar.browser;
                        var doc = browser.contentDocument;
                        styleElement.appendChild(doc.createTextNode(code));
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    // serializes CSS rules and stores them into coloring property (save)
                    saveSyntaxColoring: function(rules)
                    {
                        var code = rules;
                        if (typeof code != 'string')
                        {
                            var s = [];
                            for (var i=0; i<rules.length; i++)
                            {
                                var rule = rules[i];
                                s.push(rule.selector);
                                s.push('{');
                                for (var j=0; j<rule.props.length; j++)
                                {
                                    var prop = rule.props[j];
                                    if (prop.disabled) continue;
                                    s.push(prop.name);
                                    s.push(':');
                                    s.push(prop.value);
                                    if (prop.important) s.push(' !important');
                                    s.push(';');
                                }
                                s.push('}');
                            }
                            code = s.join('');
                        }
                        this.storeCode(code);
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    // opens dialog to import color preset (color preset is just a piece of CSS)
                    importPreset: function()
                    {
                        var params = {
                            out:null
                        };
                        window.openDialog("chrome://rainbow/content/import.xul", "", "chrome, dialog, modal, resizable=yes", params).focus();
                        if (params.out) {
                            var code = params.out.code;
                            this.applySyntaxColoring(code, this.panelBar1);
                            this.saveSyntaxColoring(code);
                            this.invalidatePanels();
                        }
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    generateCodeFromLibrary: function() {
                        var niceColors = ["red", "blue", "magenta", "brown", "black", 
                                          "darkgreen", "blueviolet", "cadetblue", "crimson", "darkgoldenrod",
                                          "darkgrey", "darkslateblue", "firebrick", "midnightblue", "orangered", "navy"];
                        var code = ".panelNode-script { font-family: Monaco, Monospace, Courier New !important; font-size: 11px; background-color: #fff; color: black; }";
                        code += " .sourceRow.hovered { background-color: #EEEEEE; }";
                        code += " .sourceLine { border-bottom: 1px solid #EEEEEE; border-right: 1px solid #CCCCCC; background: #EEEEEE no-repeat 2px 0px; color: #888888; }";
                        code += " .sourceLine:hover { text-decoration: none; }";
                        code += " .scriptTooltip { border: 1px solid #CBE087; background: LightYellow; color: #000000; }";
                        code += " .sourceRow[exeLine=\"true\"] { outline: 1px solid #D9D9B6; background-color: lightgoldenrodyellow; }";

                        for (var x in this.styleLibrary) {
                            if (this.styleLibrary.hasOwnProperty(x)) {
                                var color = niceColors[Math.floor(Math.random()*niceColors.length)];
                                code += " ."+x+" { color: "+color+"; }";
                            }
                        }
                        return code;
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    // generates template color preset based on visited scripts
                    randomizePreset: function()
                    {
                        var code = this.generateCodeFromLibrary();
                        this.applySyntaxColoring(code, this.panelBar1);
                        this.saveSyntaxColoring(code);
                        this.invalidatePanels();
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    // opens rainbow website in a new tab
                    visitWebsite: function()
                    {
                        openNewTab(rainbowWebsite);
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    getPref: function(name, def)
                    {
                        var prefName = rainbowPrefDomain + "." + name;

                        var type = rainbowPrefs.getPrefType(prefName);
                        if (type == nsIPrefBranch.PREF_STRING)
                            return rainbowPrefs.getCharPref(prefName);
                        else if (type == nsIPrefBranch.PREF_INT)
                            return rainbowPrefs.getIntPref(prefName);
                        else if (type == nsIPrefBranch.PREF_BOOL)
                            return rainbowPrefs.getBoolPref(prefName);
                        return def;
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    setPref: function(name, value)
                    {
                        var prefName = rainbowPrefDomain + "." + name;

                        var type = rainbowPrefs.getPrefType(prefName);
                        if (type == nsIPrefBranch.PREF_STRING)
                            rainbowPrefs.setCharPref(prefName, value);
                        else if (type == nsIPrefBranch.PREF_INT)
                            rainbowPrefs.setIntPref(prefName, value);
                        else if (type == nsIPrefBranch.PREF_BOOL)
                            rainbowPrefs.setBoolPref(prefName, value);
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    clearPref: function(name)
                    {
                        var prefName = rainbowPrefDomain + "." + name;
                        return rainbowPrefs.clearUserPref(prefName);
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    invalidatePanels: function()
                    {
                        for (var i = 0; i < TabWatcher.contexts.length; ++i)
                        {
                            var panel = TabWatcher.contexts[i].getPanel("script", true);
                            if (!panel) continue;
                            panel.context.invalidatePanels("rainbow");
                            panel.refresh();
                        }
                    }
                });

                /////////////////////////////////////////////////////////////////////////////////////////
                /////////////////////////////////////////////////////////////////////////////////////////
                /////////////////////////////////////////////////////////////////////////////////////////

                function SyntaxColoringPanel() {}

                SyntaxColoringPanel.prototype = extend(Firebug.CSSStyleSheetPanel.prototype,{
                    name: "rainbow",
                    title: "Colors",
                    parentPanel: "script",
                    order: 1000,

                    /////////////////////////////////////////////////////////////////////////////////////////
                    initialize: function()
                    {
                        Firebug.CSSStyleSheetPanel.prototype.initialize.apply(this, arguments);
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    destroy: function(state)
                    {
                        Firebug.CSSStyleSheetPanel.prototype.destroy.apply(this, arguments);
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    lookupStyleSheet: function(browser)
                    {
                        var doc = browser.contentDocument;
                        var styleElement = doc.getElementById('rainbow-style-sheet');
                        if (!styleElement) return;
                        return styleElement.sheet;
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    markChange: function()
                    {
                        Firebug.CSSStyleSheetPanel.prototype.markChange.apply(this, arguments);
                        var that = this;
                        setTimeout(function () {
                            var browser = that.context.chrome.getPanelBrowser(that.parentPanel);
                            var sheet = that.lookupStyleSheet(browser);
                            if (!sheet) return;
                            var rules = that.getStyleSheetRules(that.context, sheet);
                            Firebug.RainbowExtension.saveSyntaxColoring(rules);
                        }, 1000);
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    refresh: function()
                    {
                        this.show();
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    show: function()
                    {
                        var browser = this.context.chrome.getPanelBrowser(this.parentPanel);
                        var sheet = this.lookupStyleSheet(browser);
                        if (!sheet) return;
                        this.updateLocation(sheet);
                    },
                    /////////////////////////////////////////////////////////////////////////////////////////
                    getOptionsMenuItems: function()
                    {
                        return [
                        {
                            label: 'Import Color Preset ...',
                            nol10n: true,
                            command: bind(Firebug.RainbowExtension.importPreset, Firebug.RainbowExtension)
                        },
                        {
                            label: 'Randomize Color Preset',
                            nol10n: true,
                            command: bind(Firebug.RainbowExtension.randomizePreset, Firebug.RainbowExtension)
                        },
                        '-',
                        {
                            label: 'Rainbow Website ...',
                            nol10n: true,
                            command: bind(Firebug.RainbowExtension.visitWebsite, Firebug.RainbowExtension)
                        }
                        ];
                    }
                });

                Firebug.registerModule(Firebug.RainbowExtension);
                Firebug.registerPanel(SyntaxColoringPanel);
                }
            }
        }
    }
); // close custom scope

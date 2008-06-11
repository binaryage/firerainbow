// This source contains copy&pasted various bits from Firebug sources.
//
// open custom scope
FBL.ns(function() {
    with (FBL) {

        const nsIPrefBranch = Ci.nsIPrefBranch;
        const nsIPrefBranch2 = Ci.nsIPrefBranch2;

        const rainbowPrefService = Cc["@mozilla.org/preferences-service;1"];
        const rainbowPrefs = rainbowPrefService.getService(nsIPrefBranch2);

        const rainbowWebsite = "http://xrefresh.com/rainbow"
        const rainbowPrefDomain = "extensions.rainbow";

        FBL.getSourceLineRange = function(lines, min, max, maxLineNoChars)
        {
            var html = []; // parts accumulated for whole range
            if (!lines.parser)
            {
                var src = lines.join('\n')+'\n';
                var stream = Editor.singleStringStream(src);
                lines.parser = Editor.Parser.make(stream);
            }
            var line = []; // parts accumulated for current line
            var lineNumber = min; // lineNumber keeps
            forEach(lines.parser, function(token)
            {
                if (token.value == "\n"){
                    // make sure all line numbers are the same width (with a fixed-width font)
                    var lineNo = lineNumber + "";
                    while (lineNo.length < maxLineNoChars)
                        lineNo = " " + lineNo;

                    html.push(
                        '<div class="sourceRow"><a class="sourceLine">',
                        lineNo,
                        '</a><span class="sourceRowText">'
                        );
                    html = html.concat(line);
                    html.push('</span></div>');

                    // was this last line ?
                    if (lineNumber==max) throw StopIteration;

                    // prepare for next line
                    line = [];
                    lineNumber++;
                }
                else
                {
                    // colorize token
                    var val = token.value;
                    var trimval = val.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                    if (trimval.length!=val.length)
                    {
                      var start = val.indexOf(trimval);
                      var left = val.substring(0, start);
                      var right = val.substring(start+trimval.length);
                      line.push(left+'<span class="'+token.style+'">'+escapeHTML(trimval)+'</span>'+right);
                    }
                    else
                      line.push('<span class="'+token.style+'">'+escapeHTML(trimval)+'</span>');
                }
            });
            return html.join("");
        };

        ////////////////////////////////////////////////////////////////////////
        // Firebug.RainbowExtension, here we go!
        //
        Firebug.RainbowExtension = extend(Firebug.Module,
        {
            rainbowOptionUpdateMap: {},

            /////////////////////////////////////////////////////////////////////////////////////////
            initialize: function()
            {
                rainbowPrefs.addObserver(rainbowPrefDomain, this, false);
            },
            /////////////////////////////////////////////////////////////////////////////////////////
            initContext: function(context)
            {
                Firebug.Module.initContext.apply(this, arguments);
                this.hookPanel(context);
            },
            /////////////////////////////////////////////////////////////////////////////////////////
            reattachContext: function(browser, context)
            {
                Firebug.Module.reattachContext.apply(this, arguments);
                this.hookPanel(context);
            },
            /////////////////////////////////////////////////////////////////////////////////////////
            hookPanel: function(context)
            {
                var chrome = context ? context.chrome : FirebugChrome;
                var code = this.getPref('coloring');
                this.panelBar1 = chrome.$("fbPanelBar1");
                this.initSyntaxColoring(this.panelBar1);
                this.applySyntaxColoring(code, this.panelBar1);
            },
            /////////////////////////////////////////////////////////////////////////////////////////
            shutdown: function()
            {
                rainbowPrefs.removeObserver(rainbowPrefDomain, this, false);
            },
            /////////////////////////////////////////////////////////////////////////////////////////
            initSyntaxColoring: function(panelBar)
            {
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
            lookupStyleElement: function(panelBar)
            {
                var browser = panelBar.browser;
                var doc = browser.contentDocument;
                var styleElement = doc.getElementById('rainbow-style-sheet');
                return styleElement;
            },
            /////////////////////////////////////////////////////////////////////////////////////////
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
                this.setPref('coloring', code);
            },
            /////////////////////////////////////////////////////////////////////////////////////////
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
            showPanel: function(browser, panel)
            {
                var isRainbowExtension = panel && panel.name == "rainbow";
            },
            /////////////////////////////////////////////////////////////////////////////////////////
            visitWebsite: function()
            {
                openNewTab(rainbowWebsite);
            },
            /////////////////////////////////////////////////////////////////////////////////////////
            // nsIPrefObserver
            observe: function(subject, topic, data)
            {
                var name = data.substr(rainbowPrefDomain.length+1);
                var value = this.getPref(name);
            },
            /////////////////////////////////////////////////////////////////////////////////////////
            getPref: function(name)
            {
                var prefName = rainbowPrefDomain + "." + name;

                var type = rainbowPrefs.getPrefType(prefName);
                if (type == nsIPrefBranch.PREF_STRING)
                    return rainbowPrefs.getCharPref(prefName);
                else if (type == nsIPrefBranch.PREF_INT)
                    return rainbowPrefs.getIntPref(prefName);
                else if (type == nsIPrefBranch.PREF_BOOL)
                    return rainbowPrefs.getBoolPref(prefName);
                return null;
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
            invalidatePanels: function()
            {
                for (var i = 0; i < TabWatcher.contexts.length; ++i)
                {
                    var panel = TabWatcher.contexts[i].getPanel("script", true);
                    if (panel)
                    {
                        panel.context.invalidatePanels("rainbow");
                        panel.refresh();
                    }
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
); // close custom scope

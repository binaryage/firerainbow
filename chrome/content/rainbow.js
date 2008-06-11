// This source contains copy&pasted various bits from Firebug sources.

// open custom scope
FBL.ns(function() {
    with (FBL) {

        const nsIPrefBranch = Ci.nsIPrefBranch;
        const nsIPrefBranch2 = Ci.nsIPrefBranch2;

        const rainbowPrefService = Cc["@mozilla.org/preferences-service;1"];
        const rainbowPrefs = rainbowPrefService.getService(nsIPrefBranch2);

        const rainbowWebsite = "http://xrefresh.com/rainbow"
        const rainbowPrefDomain = "extensions.rainbow";

        // this function overrides firebug internal function !
        FBL.getSourceLineRange = function(lines, min, max, maxLineNoChars)
        {
            var html = []; // parts accumulated for whole range
            var line;
            if (!Firebug.RainbowExtension.isDisabled()) // TODO: implement scriptSyntaxHighlighting switch
            {
                if (!lines.parser)
                {
                    var src = lines.join('\n')+'\n';
                    var stream = Editor.singleStringStream(src);
                    lines.parser = Editor.Parser.make(stream);
                }
                line = []; // parts accumulated for current line
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
                        line.push(
                            '<span class="'+token.style+'">',
                            escapeHTML(token.value),
                            '</span>'
                            );
                    }
                });
            }
            else
            {
                for (var i = min; i <= max; ++i)
                {
                    // make sure all line numbers are the same width (with a fixed-width font)
                    var lineNo = i + "";
                    while (lineNo.length < maxLineNoChars) lineNo = " " + lineNo;
                    line = escapeHTML(lines[i-1]);

                    html.push(
                        '<div class="sourceRow"><a class="sourceLine">',
                        lineNo,
                        '</a><span class="sourceRowText">',
                        line,
                        '</span></div>'
                        );
                }
            }
            return html.join("");
        };

        ////////////////////////////////////////////////////////////////////////
        // Firebug.RainbowExtension, here we go!
        //
        Firebug.RainbowExtension = extend(Firebug.Module,
        {
            cachedDisabled: false,
            rainbowOptionUpdateMap: {},

            /////////////////////////////////////////////////////////////////////////////////////////
            initialize: function()
            {
                rainbowPrefs.addObserver(rainbowPrefDomain, this, false);
                this.cachedDisabled = this.getPref('disabled');

                var that = this;
                this.loadHook = function() {
                    var code = that.getPref('coloring');
                    that.initSyntaxColoring(code);
                    that.applySyntaxColoring(code);
                };
                var panelBar1 = $("fbPanelBar1");
                var browser1 = panelBar1.browser;
                browser1.addEventListener("load", this.loadHook, true);
            },
            /////////////////////////////////////////////////////////////////////////////////////////
            shutdown: function()
            {
                rainbowPrefs.removeObserver(rainbowPrefDomain, this, false);
            },
            /////////////////////////////////////////////////////////////////////////////////////////
            initSyntaxColoring: function(code)
            {
                var panelBar1 = $("fbPanelBar1");
                var browser1 = panelBar1.browser;
                browser1.removeEventListener("load", this.loadHook, true);

                var doc = browser1.contentDocument;
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
            lookupStyleElement: function()
            {
                var panelBar1 = $("fbPanelBar1");
                var browser1 = panelBar1.browser;
                var doc = browser1.contentDocument;
                var styleElement = doc.getElementById('rainbow-style-sheet');
                return styleElement;
            },
            /////////////////////////////////////////////////////////////////////////////////////////
            applySyntaxColoring: function(code)
            {
                var styleElement = this.lookupStyleElement();
                if (!styleElement) return;
                styleElement.innerHTML = '';
                var panelBar1 = $("fbPanelBar1");
                var browser1 = panelBar1.browser;
                var doc = browser1.contentDocument;
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
                    this.applySyntaxColoring(code);
                    this.saveSyntaxColoring(code);
                    this.invalidatePanels();
                }
            },
            /////////////////////////////////////////////////////////////////////////////////////////
            isDisabled: function()
            {
                return this.cachedDisabled;
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
                this.updatePref(name, value);
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
            },
            /////////////////////////////////////////////////////////////////////////////////////////
            updatePref: function(name, value)
            {
                // Prevent infinite recursion due to pref observer
                if (name in this.rainbowOptionUpdateMap)
                    return;

                this.rainbowOptionUpdateMap[name] = 1;
                if (name == "disabled")
                {
                    this.cachedDisabled = value;
                    alert('This action will take effect after restarting Firebug.');
                    this.invalidatePanels();
                }

                delete this.rainbowOptionUpdateMap[name];
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
            lookupStyleSheet: function()
            {
                var panelBar1 = $("fbPanelBar1");
                var browser1 = panelBar1.browser;
                var doc = browser1.contentDocument;
                var styleElement = doc.getElementById('rainbow-style-sheet');
                var styleSheet = styleElement.sheet;
                if (styleSheet.editStyleSheet) styleSheet = styleSheet.editStyleSheet.sheet;
                return styleSheet;
            },
            /////////////////////////////////////////////////////////////////////////////////////////
            markChange: function()
            {
                Firebug.CSSStyleSheetPanel.prototype.markChange.apply(this, arguments);
                var that = this;
                setTimeout(function () {
                    var sheet = that.lookupStyleSheet();
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
                var sheet = this.lookupStyleSheet();
                this.updateLocation(sheet);
            },
            /////////////////////////////////////////////////////////////////////////////////////////
            getOptionsMenuItems: function()
            {
                return [
                //            {label: 'Disable Rainbow', nol10n: true, type: "checkbox", checked: Firebug.RainbowExtension.isDisabled(),
                //                command: bindFixed(Firebug.RainbowExtension.setPref, Firebug.RainbowExtension, 'disabled', !Firebug.RainbowExtension.isDisabled()) },
                {
                    label: 'Import Preset ...',
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
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

        FBL.getSourceLineRangeOld = FBL.getSourceLineRange;
        FBL.getSourceLineRange = function(lines, min, max, maxLineNoChars)
        {
            var res = FBL.getSourceLineRangeOld.apply(this, arguments);
            Firebug.RainbowExtension.daemonPing();
            return res;
        };

        ////////////////////////////////////////////////////////////////////////
        // Firebug.RainbowExtension, here we go!
        //
        Firebug.RainbowExtension = extend(Firebug.Module,
        {
            working: false,
            pingCounter: 0,
            daemonTimer: null,
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
            daemonStart: function()
            {
                this.daemonStop();
                this.currentDoc = this.panelBar1.browser.contentDocument;
                this.currentNode = this.currentDoc.getElementsByTagName('body')[0];
                this.stream = Editor.rainbowStream();
                this.parser = Editor.Parser.make(this.stream);
                var that = this;
                var linesPerCall = this.getPref('linesPerCall', 20);
                var daemonInterval = this.getPref('daemonInterval', 50);
                this.daemonTimer = setInterval(function(){
                    var count = linesPerCall;
                    while (--count) {
                      that.currentNode = getNextByClass(that.currentNode, 'sourceRowText');
                      if (!that.currentNode) {
                          that.daemonStop();
                          return;
                      }
                      var code = that.currentNode.textContent;
                      that.stream.reset(code);
                      //FBTrace.dumpProperties("x=", that.currentNode.textContent);
                      var line = []; // parts accumulated for current line
                      forEach(that.parser, function(token) {
                          // colorize token
                          var val = token.value;
                          var trimval = val.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                          if (trimval.length!=val.length)
                          {
                            var start = val.indexOf(trimval);
                            var left = val.substring(0, start);
                            var right = val.substring(start+trimval.length);
                            line.push((left?('<span class="whitespace">'+left+'</span>'):'')+'<span class="'+token.style+'">'+escapeHTML(trimval)+'</span>'+(right?('<span class="whitespace">'+right+'</span>'):''));
                          }
                          else
                            line.push('<span class="'+token.style+'">'+escapeHTML(val)+'</span>');
                      });
                      //FBTrace.dumpProperties("x=", line.join(""));
                      that.currentNode.innerHTML = line.join("");
                    }
                }, daemonInterval);
            },
            /////////////////////////////////////////////////////////////////////////////////////////
            daemonStop: function()
            {
                this.stream = undefined;
                this.parser = undefined;
                this.currentDoc = undefined;
                this.currentNode = undefined;
                if (!this.daemonTimer) return;
                clearInterval(this.daemonTimer);
                this.daemonTimer = null;
            },
            /////////////////////////////////////////////////////////////////////////////////////////
            daemonPing: function()
            {
                this.pingCounter++;
                var that = this;
                var cnt = this.pingCounter;
                setTimeout(function(){
                    if (that.pingCounter!=cnt) return;
                    that.daemonStart();
                }, 500);
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

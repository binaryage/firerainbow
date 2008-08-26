// This source contains copy&pasted various bits from Firebug sources.
//

// open custom scope
FBL.ns(function() {
    with (FBL) {
        
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

            const rainbowWebsite = "http://xrefresh.com/rainbow"
            const rainbowPrefDomain = "extensions.rainbow";

            if (Firebug.TraceModule)
            {
              Firebug.TraceModule.DBG_RAINBOW = false;
              var type = rainbowPrefs.getPrefType('extensions.firebug.DBG_RAINBOW');
              if (type!=nsIPrefBranch.PREF_BOOL) try {
                  rainbowPrefs.setBoolPref('extensions.firebug.DBG_RAINBOW', false);
              } catch(e) {}
            }

            ////////////////////////////////////////////////////////////////////////
            // Firebug.RainbowExtension, here we go!
            //
            Firebug.RainbowExtension = extend(Firebug.Module,
            {
                valid: false,
                pings: 0,

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
                    var isScriptPanel = panel && panel.name == "script";
                    
                    // this is a way how to get notified when new source is (possibly) available for coloring
                    if (isScriptPanel && !panel.showSourceBoxOriginal)
                    {
                        panel.showSourceBoxOriginal = panel.showSourceBox;
                        panel.showSourceBox = function(sourceBox) {
                            res = this.showSourceBoxOriginal(sourceBox);
                            Firebug.RainbowExtension.pingDaemon();
                            return res;
                        }
                    }
                    
                    // stop daemon if leaving script panel and start it again if needed
                    var that = this;
                    if (isScriptPanel) setTimeout(function() {
                        that.hookPanel(panel.context);
                        that.resumeDaemon();
                    }, 1000); else this.stopDaemon();
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
                hookPanel: function(context)
                {
                    if (FBTrace && FBTrace.DBG_RAINBOW) FBTrace.dumpProperties("Rainbow: hookPanel", context);
                    var chrome = context ? context.chrome : FirebugChrome;
                    var that = this;
                    // monkey patching of chrome to get notified when (possibly) new sourceBox is available as result of switching to a new script
                    if (!chrome.onPanelNavigateOriginal)
                    {
                        chrome.onPanelNavigateOriginal = chrome.onPanelNavigate;
                        chrome.onPanelNavigate = function() {
                            var res = this.onPanelNavigateOriginal();
                            that.resumeDaemon();
                            return res;
                        }
                    }
                    var code = this.getPref('coloring');
                    this.panelBar1 = chrome.$("fbPanelBar1");
                    this.initSyntaxColoring(this.panelBar1);
                    this.applySyntaxColoring(code, this.panelBar1);
                },
                /////////////////////////////////////////////////////////////////////////////////////////
                resumeDaemon: function()
                {
                    // find active source box - here we will keep daemon state (parser state)
                    if (FBTrace && FBTrace.DBG_RAINBOW) FBTrace.dumpProperties("Rainbow: resumeDaemon");
                    var sourceBox = this.findVisibleSourceBox(this.panelBar1.browser);
                    if (!sourceBox) return;
                    if (!sourceBox.parser || sourceBox.colorized) return; // even not started
                    return this.startDaemon();
                },
                /////////////////////////////////////////////////////////////////////////////////////////
                startDaemon: function(silent)
                {
                    // daemon is here to perform colorization in background
                    // the goal is not to block Firebug functionality and don't hog CPU for too long
                    // daemonInterval and linesPerCall properties define how intensive this background process should be

                    this.stopDaemon(); // never let run two or more daemons concruently!
                    if (FBTrace && FBTrace.DBG_RAINBOW) FBTrace.dumpProperties("Rainbow: startDaemon");

                    // find active source box - here we will keep daemon state (parser state)
                    var sourceBox = this.findVisibleSourceBox(this.panelBar1.browser);
                    if (!sourceBox) return;
                    if (!sourceBox.currentNode) sourceBox.currentNode = getNextByClass(sourceBox, 'sourceRowText'); // slower lookup
                    if (!sourceBox.currentNode) return; // not yet ready
                    if (sourceBox.colorized) return; // already colorized

                    // init daemon state
                    if (!sourceBox.stream) sourceBox.stream = Editor.rainbowStream();
                    
                    if (!sourceBox.parser)
                    {
                        // advance currentNode to first non-whitespace line
                        var firstLine = "";
                        while (sourceBox.currentNode) {
                            firstLine = sourceBox.currentNode.textContent;
                            firstLine = firstLine.replace(/^\s*|\s*$/g,"");
                            if (firstLine!="") break;
                            sourceBox.currentNode = this.fastNextLineLookup(sourceBox.currentNode);
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
                    this.daemonTimer = setInterval(function(){
                        var count = linesPerCall;
                        while (count--) {
                          // finish if no more nodes
                          if (!sourceBox.currentNode) {
                              that.stopDaemon();
                              sourceBox.colorized = true;
                              // free up memory
                              sourceBox.parser = undefined;
                              sourceBox.stream = undefined;
                              sourceBox.currentNode = undefined;
                              return;
                          }
                          // extract line code from node
                          // note: \n is important to simulate multi line text in stream (for example multi-line comments depend on this)
                          var code = sourceBox.currentNode.textContent+'\n';
                          sourceBox.stream.reinit(code);
                          var line = []; // parts accumulated for current line
                          // process line tokens
                          forEach(sourceBox.parser, function(token) {
                              // colorize token
                              var val = token.value;
                              var trimval = val.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                              if (trimval.length!=val.length)
                              {
                                  // this path is here to process surrounding token whitespaces
                                  var start = val.indexOf(trimval);
                                  var left = val.substring(0, start);
                                  var right = val.substring(start+trimval.length);
                                  line.push((left?('<span class="whitespace">'+left+'</span>'):'')+'<span class="'+token.style+'">'+escapeHTML(trimval)+'</span>'+(right?('<span class="whitespace">'+right+'</span>'):''));
                              }
                              else
                              {
                                  // fast path for token without surrounding whitespaces
                                  line.push('<span class="'+token.style+'">'+escapeHTML(val)+'</span>');
                              }
                          });
                          // apply coloring to line
                          sourceBox.currentNode.innerHTML = line.join("");

                          // move for next node
                          sourceBox.currentNode = that.fastNextLineLookup(sourceBox.currentNode);
                        }
                    }, daemonInterval);
                },
                /////////////////////////////////////////////////////////////////////////////////////////
                stopDaemon: function()
                {
                    if (!this.daemonTimer) return;
                    if (FBTrace && FBTrace.DBG_RAINBOW) FBTrace.dumpProperties("Rainbow: stopDaemon");
                    clearInterval(this.daemonTimer);
                    this.daemonTimer = undefined;
                },
                /////////////////////////////////////////////////////////////////////////////////////////
                pingDaemon: function()
                {
                    if (!this.valid) return;
                    // trivial implementation of buffered deferred triggering of daemon
                    this.pings++;
                    var pingMarker = this.pings;
                    var that = this;
                    setTimeout(function(){
                        if (that.pings!=pingMarker) return;
                        that.startDaemon();
                    }, 200);
                },
                /////////////////////////////////////////////////////////////////////////////////////////
                findVisibleSourceBox: function(browser)
                {
                    // XPath should be much faster than traversing DOM in JS ...
                    var nodes = getElementsByXPath(browser.contentDocument, '//*[contains(@class, \'sourceBox\')][@collapsed=\'false\']');
                    if (nodes.length>0) return nodes[0];
                },
                /////////////////////////////////////////////////////////////////////////////////////////
                fastNextLineLookup: function(node)
                {
                    // this expects specific HTML structure generated by firebug (as observed in v1.2)
                    // this may possibly break in future versions, but we prefer speed over maintanability
                    var parent = node.parentNode;
                    if (!parent) return;
                    var sibling = parent.nextSibling;
                    if (!sibling) return;
                    return getChildByClass(sibling, 'sourceRowText');
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
                    this.setPref('coloring', code);
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
); // close custom scope

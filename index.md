---
title: FireRainbow
layout: wikistyle
repo: http://github.com/darwin/firerainbow
support: http://getsatisfaction.com/xrefresh/products/xrefresh_rainbow_for_firebug
download: http://addons.mozilla.org/en-US/firefox/addon/9603
version: Version 0.9
---

FireRainbow brings javascript syntax highlighting to [Firebug][firebug]
===================

<img class="welcome shadow" src="http://cloud.github.com/downloads/darwin/firerainbow/firerainbow-screenshot.png" alt="screenshot">

Installation
------------

You need [Firebug 1.3][firebug] for latest version to work. 
If you are still stuck on Firebug 1.2, install [version 0.7][v07].

Preferred way is to [install this firefox extension][rainbow] via addons.mozilla.com.

Note: Some people have reported they are unable to download and install extension via addons.mozilla.com. In this case you may [try workaround][workaround].

Current State
-------------

* Version 0.9 is tested to work with offcial Firebug 1.3
* Version 0.8 is tested to work with alpha Firebug 1.3
* Version 0.7 is tested to work with official Firebug 1.2

Contributors
------------

* **Marijn Haverbeke** - this extension uses his great [CodeMirror][codemirror] for javascript/html/css parsing.

History
-------

* v0.9 (29.01.2009)
  * updated parser with CodeMirror 0.60
  * fixed glitch when script didn't get colorized on first display in Firebug 1.4
  * tested to work with official Firebug 1.3 and Firefox 3.0.5 (worked also with alpha Firebug 1.4 and nightly Firefox 3.1)

* v0.8 (15.11.2008)
  * reimplemented for changes in Firebug 1.3 (not compatible with Firebug 1.2 anymore)
  * added "Reset to default Color Preset" feature
  * changed extension guid, to distinguish from 0.7

* v0.7 (27.08.2008)
  * added mixed HTML/CSS/JS coloring
  * added "Randomize Color Preset" feature
  * when installed with old firebug, error message is written into Firefox's error console
  * fixed bug preventing proper coloring in some rare cases

* v0.6 (14.06.2008)
  * public beta release
  * hacked first version for Firebug 1.2

[firebug]: https://addons.mozilla.org/en-US/firefox/addon/1843
[rainbow]: https://addons.mozilla.org/en-US/firefox/addon/9603
[codemirror]: http://marijn.haverbeke.nl/codemirror/
[homepage]: http://xrefresh.com/rainbow
[presets]: http://xrefresh.com/presets
[contact]: mailto:antonin@hildebrand.cz
[workaround]: http://getsatisfaction.com/xrefresh/topics/unable_to_download_rainbow_for_firebug
[satisfaction]: http://getsatisfaction.com
[v07]: https://addons.mozilla.org/en-US/developers/details/7575
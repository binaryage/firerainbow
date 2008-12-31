FireRainbow
===================

FireRainbow brings javascript syntax highlighting to [Firebug 1.3][firebug].
![screenshot][screenshot]

Prerequisites
-------------

You need [Firebug 1.3][firebug].

Installation
------------

Preferred way is to install this firefox extension via addons.mozilla.com.
The latest version is [available here][rainbow].

Some people have reported they are unable to download and install extension via addons.mozilla.com. In this case you may [try workaround][workaround].

Color Presets
-------------

Sample [color presets are here][presets]. Your preset modifications [are welcome][contact].

Current State
-------------

* Version 0.9 is tested to work with beta Firebug 1.3 and alpha Firebug 1.4
* Version 0.8 is tested to work with alpha Firebug 1.3
* Version 0.7 is tested to work with official Firebug 1.2

Contributors
------------

* **Marijn Haverbeke** - this extension uses his great [CodeMirror][codemirror] for javascript/html/css parsing.

Support
-------

The support [forum is here][support] (powered by [getsatisfaction.com][satisfaction]).

History
-------

* v0.9 (to be released)
  * updated parser with CodeMirror 0.60
  * fixed glitch when script didn't get colorized on first display in Firebug 1.4

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

[screenshot]: http://github.com/darwin/firerainbow/tree/master/support/screenshot.png?raw=true "FireRainbow"
[firebug]: https://addons.mozilla.org/en-US/firefox/addon/1843
[rainbow]: https://addons.mozilla.org/en-US/firefox/addon/9603
[codemirror]: http://marijn.haverbeke.nl/codemirror/
[homepage]: http://xrefresh.com/rainbow
[presets]: http://xrefresh.com/presets
[contact]: mailto:antonin@hildebrand.cz
[workaround]: http://getsatisfaction.com/xrefresh/topics/unable_to_download_rainbow_for_firebug
[support]: http://getsatisfaction.com/xrefresh/products/xrefresh_rainbow_for_firebug
[satisfaction]: http://getsatisfaction.com
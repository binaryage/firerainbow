---
title: FireRainbow
subtitle: brings javascript syntax highlighting to Firebug
layout: product
icon: /shared/img/firerainbow-icon.png
repo: http://github.com/darwin/firerainbow
support: http://github.com/darwin/firerainbow/issues
downloadtitle: Install v1.0
download: https://addons.mozilla.org/en-US/firefox/addon/9603
downloadboxwidth: 210px
donate: https://addons.mozilla.org/en-US/firefox/addons/contribute/9603?source=addon-detail
subdownload: 
subdownloadlink:
mainshot: /shared/img/firerainbow-mainshot.png
mainshotfull: /shared/img/firerainbow-mainshot-full.png
overlaysx: 880px
overlaysy: 608px
overlaycx: 25px
overlaycy: 10px
---

<div class="advertisement">
	<div class="plug">Recommended reading:</div>
	<a href="http://www.amazon.com/gp/product/0596517742?ie=UTF8&tag=firerainbow-20&linkCode=as2&camp=1789&creative=9325&creativeASIN=0596517742"><img border="0" src="/shared/img/amazon/41xtPRcBfXL._SL110_.jpg"></a><img src="http://www.assoc-amazon.com/e/ir?t=firerainbow-20&l=as2&o=1&a=0596517742" width="1" height="1" border="0" alt="" style="border:none !important; margin:0px !important;" />
	
	<a href="http://www.amazon.com/gp/product/0596101996?ie=UTF8&tag=firerainbow-20&linkCode=as2&camp=1789&creative=9325&creativeASIN=0596101996"><img border="0" src="/shared/img/amazon/41IVmVYhRNL._SL110_.jpg"></a><img src="http://www.assoc-amazon.com/e/ir?t=firerainbow-20&l=as2&o=1&a=0596101996" width="1" height="1" border="0" alt="" style="border:none !important; margin:0px !important;" />

	<a href="http://www.amazon.com/gp/product/0596529309?ie=UTF8&tag=firerainbow-20&linkCode=as2&camp=1789&creative=9325&creativeASIN=0596529309"><img border="0" src="/shared/img/amazon/41HmS6aFftL._SL110_.jpg"></a><img src="http://www.assoc-amazon.com/e/ir?t=firerainbow-20&l=as2&o=1&a=0596529309" width="1" height="1" border="0" alt="" style="border:none !important; margin:0px !important;" />

	<div class="offer"><a href="mailto:antonin@binaryage.com">advertise here</a></div>
</div>
<script type="text/javascript" src="http://www.assoc-amazon.com/s/link-enhancer?tag=firerainbow-20&o=1">
</script>

## Features

* Mixed syntax highlighting 
	* Javascript
	* HTML
	* CSS
* Advanced features:
	* Color theme can be defined using Firebug's CSS panel
	* Highlighting is applied incrementally (good performance)
	* Color themes available [on GitHub](http://github.com/darwin/firerainbow/tree/master/themes)

### Compatibility

* Version 1.0 is tested to work with alpha Firebug 1.4
* Version 0.9 is tested to work with offcial Firebug 1.3
* Version 0.8 is tested to work with alpha Firebug 1.3
* Version 0.7 is tested to work with official Firebug 1.2

## Installation

You need [Firebug 1.3][firebug]+ for latest version to work. The preferred way is to **[install this Firefox extension][rainbow]** via addons.mozilla.com.

Note: If you are still stuck with Firebug 1.2, install [version 0.7][v07].

Note: Some people have reported they are unable to download and install extension via addons.mozilla.com. In this case you may [try workaround][workaround].

### Installation from sources

    git clone git://github.com/darwin/firerainbow.git
    cd firerainbow
    rake
    
<a href="images/compilation.png"><img style="border: 2px solid #888;-moz-border-radius:2px;-webkit-border-radius:2px;" src="images/compilation.png" width="300"></a>

If all went right, you should be able to find your fresh XPI under `build/firerainbow-X.Y.xpi`. You can install XPI file into Firefox by opening it via File -> Open File ...

## Themes

Themes are available at **[http://github.com/darwin/firerainbow/tree/master/themes](http://github.com/darwin/firerainbow/tree/master/themes)**

<br>
<a href="http://github.com/darwin/firerainbow/tree/master/themes"><img style="border: 2px solid #888;-moz-border-radius:2px;-webkit-border-radius:2px;" src="images/themes.png" width="500"></a>

Feel free to fork the project and contribute your very own theme.

## History

* **v1.0** (24.05.2009)
  * [[darwin][darwin]] robust colorization of compressed scripts with long lines (previously parser halted) 
  * [[darwin][darwin]] updated parser to CodeMirror 0.61
  * [[darwin][darwin]] new home for themes in github project
  * [[darwin][darwin]] compatibility with Firebug 1.4

* **v0.9** (29.01.2009)
  * [[darwin][darwin]] updated parser to CodeMirror 0.60
  * [[darwin][darwin]] fixed glitch when script didn't get colorized on first display in Firebug 1.4
  * [[darwin][darwin]] tested to work with official Firebug 1.3 and Firefox 3.0.5 (worked also with alpha Firebug 1.4 and nightly Firefox 3.1)

* **v0.8** (15.11.2008)
  * [[darwin][darwin]] reimplemented for changes in Firebug 1.3 (not compatible with Firebug 1.2 anymore)
  * [[darwin][darwin]] added "Reset to default Color Preset" feature
  * [[darwin][darwin]] changed extension guid, to distinguish from 0.7

* **v0.7** (27.08.2008)
  * [[darwin][darwin]] added mixed HTML/CSS/JS coloring
  * [[darwin][darwin]] added "Randomize Color Preset" feature
  * [[darwin][darwin]] when installed with old firebug, error message is written into Firefox's error console
  * [[darwin][darwin]] fixed bug preventing proper coloring in some rare cases

* **v0.6** (14.06.2008)
  * [[darwin][darwin]] public beta release
  * [[darwin][darwin]] hacked first version for Firebug 1.2

### Contributors

* **Marijn Haverbeke** - this extension uses his great [CodeMirror][codemirror] for javascript/html/css parsing.


[firebug]: https://addons.mozilla.org/en-US/firefox/addon/1843
[rainbow]: https://addons.mozilla.org/en-US/firefox/addon/9603
[codemirror]: http://marijn.haverbeke.nl/codemirror/
[homepage]: http://xrefresh.com/rainbow
[contact]: mailto:antonin@hildebrand.cz
[workaround]: http://getsatisfaction.com/xrefresh/topics/unable_to_download_rainbow_for_firebug
[satisfaction]: http://getsatisfaction.com
[v07]: https://addons.mozilla.org/en-US/developers/details/7575
[darwin]: http://github.com/darwin
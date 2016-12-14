---
layout: product
title: FireRainbow enables javascript syntax highlighting for Firebug
product: firerainbow
product_title: FireRainbow
product_subtitle: javascript syntax highlighting for Firebug
product_icon: /shared/img/icons/firerainbow-256.png
repo: http://github.com/binaryage/firerainbow
download: https://addons.mozilla.org/firefox/addon/firerainbow
downloadtitle: Install via Mozilla Addons
buttons: <a href="/test" class="button button-300 product-button-thumbup"><div><div><div class="trial-note">after restart</div>Visit Test Page<div class="product-specs">to check that your  installation works well</div></div></div></a>
meta_title: FireRainbow enables javascript syntax highlighting for Firebug
meta_keywords: firebug,firefox,addon,firerainbow,syntax,highlighting,javascript,binaryage,productivity,software,web,development
meta_description: FireRainbow enables javascript syntax highlighting for Firebug
meta_image: /shared/img/icons/firerainbow-256.png
build_tabs: 1
ogmeta: {
    site_name: "BinaryAge website",
    description: "FireRainbow enables javascript syntax highlighting for Firebug",
    email: "support@binaryage.com",
    type: "product",
    title: "FireRainbow",
    url: "http://firerainbow.binaryage.com",
    image: "http://www.binaryage.com/shared/img/icons/firerainbow-256.png"
}
---

{% contentfor product-buttons %}
<div class="product-buttons">
  <div class="button-container">
    <a href="{{page.download}}" id="o-download-button" class="button product-button-download">
      <span><i class="fa fa-download fa-lg"></i>{{page.downloadtitle}}</span>
    </a>
  </div>
</div>
{% endcontentfor %}

## Features

<a href="/shared/img/firerainbow-mainshot-full.png"><img src="/shared/img/firerainbow-mainshot-full.png" widht="800"></a>

* **Mixed syntax highlighting** powered by [CodeMirror][codemirror]
  * Javascript
  * HTML
  * CSS
* Advanced features:
  * Color theme can be modified using Firebug's CSS panel
  * Highlighting is applied incrementally (good performance)
  * Color themes available [on GitHub](http://github.com/binaryage/firerainbow/tree/master/themes)
  * Uses WebWorkers to perform parsing in a non-blocking fashion

### Compatibility

Both Firefox and Firebug are moving targets. Please make sure you use compatible versions. I'm unable to test all possible combinations.

<ul style="margin-bottom: 0px !important">
<li><b>Version 1.5</b> is tested to work with official <b>Firebug 1.5 - 1.9</b> (Firefox 3.5 - 11.0)
</ul>
<a style="margin-top: 0px !important" href="javascript:$('.older-compatibility').toggle(); $(this).hide()">show compatibility of older versions &darr;</a>
<ul class="older-compatibility" style="display:none">
<li><b>Version 1.4</b> is tested to work with official <b>Firebug 1.5</b>, <b>Firebug 1.6</b> and <b>Firebug 1.7</b>, also should be compatible with beta Firebug 1.8 (Firefox 3.5 - 5.0)</li>
<li><b>Version 1.3</b> is tested to work with official <b>Firebug 1.5</b>, <b>Firebug 1.6</b> and <b>Firebug 1.7</b> (Firefox 3.5 - 4.0)</li>
<li><b>Version 1.2</b> is tested to work with official <b>Firebug 1.5</b> and <b>Firebug 1.6</b> (Firefox 3.5 - 4.0)</li>
<li><b>Version 1.1</b> is tested to work with official <b>Firebug 1.5</b> (Firefox 3.5 and 3.6) <- it is not compatible with <b>Firebug 1.4</b> anymore!</li>
<li><b>Version 1.0</b> is tested to work with official <b>Firebug 1.4</b> (Firefox 3.0 and 3.5)</li>
<li><b>Version 0.9</b> is tested to work with official <b>Firebug 1.3</b></li>
<li><b>Version 0.8</b> is tested to work with alpha <b>Firebug 1.3</b></li>
<li><b>Version 0.7</b> is tested to work with official <b>Firebug 1.2</b></li>
</ul>

## Installation

### **[Install this Firefox extension][rainbow]** via addons.mozilla.com.

You need [Firebug 1.5][firebug]+ for the latest version to work. 

### Troubles?

If you are still stuck with Firebug 1.4, install [version 1.0][v10].

If you are still stuck with Firebug 1.2, install [version 0.7][v07].

Note: Some people have reported they are unable to download and install the extension via addons.mozilla.com. In this case you may [try this workaround][workaround].

### Install bleeding edge version from sources

    git clone git://github.com/binaryage/firerainbow.git
    cd firerainbow
    rake
    
If everything went ok, you should be able to find your fresh XPI under `build/firerainbow-X.Y.xpi`. 

You can install XPI file in Firefox by opening it via File -> Open File ...

## Themes

Themes are available at **[http://github.com/binaryage/firerainbow/tree/master/themes](http://github.com/binaryage/firerainbow/tree/master/themes)**

<br>
<a href="http://github.com/binaryage/firerainbow/tree/master/themes"><img style="border: 2px solid #888;-moz-border-radius:2px;-webkit-border-radius:2px;" src="images/themes.png" width="500"></a>

Feel free to fork the project and contribute your very own theme.

## Changelog

### Contributors

* **Marijn Haverbeke** - this extension uses his great [CodeMirror][codemirror] for javascript/html/css parsing.

### History

* **v1.5** (07.01.2012)
  * fixed compatibility with Firebug 1.9
  * by default do not override font settings from Firebug

* **v1.4** (26.06.2011)
  * marked as compatible with Firefox 5.*
  * fixed compatibility with Firebug 1.8
  
* **v1.3** (30.04.2011)
  * marked as compatible with Firefox 4.0
  * updated CodeMirror to v1.0

* **v1.2** (02.11.2010)
  * compatibility with Firebug 1.6 and early Firebug 1.7 alpha
  * updated CodeMirror to v0.9
  * CodeMirror wrapped into its own namespace (should resolve conflicts with other extensions)
  * using WebWorkers to compute highlighting (better performance)
  * fixed bug when coloring was not triggered for file when scrolled to the top

* **v1.1** (20.01.2010)
  * fixed Firebug 1.5 compatibility and dropped Firebug 1.4 compatibility
  * marked as compatible with Firebug 1.6

* **v1.0** (24.05.2009)
  * robust colorization of compressed scripts with long lines (previously parser halted) 
  * updated parser to CodeMirror 0.61
  * new home for themes in github project
  * compatibility with Firebug 1.4

* **v0.9** (29.01.2009)
  * updated parser to CodeMirror 0.60
  * fixed glitch when script didn't get colorized on first display in Firebug 1.4
  * tested to work with official Firebug 1.3 and Firefox 3.0.5 (worked also with alpha Firebug 1.4 and nightly Firefox 3.1)

* **v0.8** (15.11.2008)
  * reimplemented for changes in Firebug 1.3 (not compatible with Firebug 1.2 anymore)
  * added "Reset to default Color Preset" feature
  * changed extension guid, to distinguish from 0.7

* **v0.7** (27.08.2008)
  * added mixed HTML/CSS/JS coloring
  * added "Randomize Color Preset" feature
  * when installed with old firebug, error message is written into Firefox's error console
  * fixed bug preventing proper coloring in some rare cases

* **v0.6** (14.06.2008)
  * public beta release
  * hacked first version for Firebug 1.2


[firebug]: https://addons.mozilla.org/en-US/firefox/addon/1843
[rainbow]: https://addons.mozilla.org/en-US/firefox/addon/9603
[codemirror]: http://marijn.haverbeke.nl/codemirror/
[homepage]: http://xrefresh.com/rainbow
[contact]: mailto:antonin@hildebrand.cz
[workaround]: http://getsatisfaction.com/xrefresh/topics/unable_to_download_rainbow_for_firebug
[satisfaction]: http://getsatisfaction.com
[v07]: https://addons.mozilla.org/en-US/developers/details/7575
[v10]: https://addons.mozilla.org/en-US/firefox/addons/versions/9603#version-1.0
[darwin]: http://github.com/darwin

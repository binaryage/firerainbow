---
title: Home
layout: wikistyle
---

Introduction to Pages
=====================

The GitHub Pages feature allows you to publish content to the web by simply pushing content to one of your GitHub hosted repositories. There are two different kinds of Pages that you can create: User Pages and Project Pages.

User Pages
----------

Let's say your GitHub username is "alice". If you create a GitHub repository named `alice.github.com` and then commit a file named `index.html` there and push it to GitHub, then this file will be automatically published to [http://alice.github.com/](http://alice.github.com/).

On the first push, it can take up to ten minutes before the content is available.

Real World Example: [github.com/defunkt/defunkt.github.com](http://github.com/defunkt/defunkt.github.com/) &rarr; [http://defunkt.github.com/](http://defunkt.github.com/).

Project Pages
-------------

Let's say your GitHub username is "bob" and you have an existing repository named `fancypants`. If you create a new root branch named `gh-pages` in your repository, any content pushed there will be published to [http://bob.github.com/fancypants/](http://bob.github.com/fancypants/).

In order to create a new root branch, first ensure that your working directory is clean by committing or stashing any changes. <span style="color: #a00;">The following operation will lose any uncommitted changes!</span>

    cd /path/to/fancypants
    git symbolic-ref HEAD refs/heads/gh-pages
    rm .git/index
    git clean -fdx

After running this you'll have an empty working directory (don't worry, your main repo is still on the `master` branch). Now you can create some content in this branch and push it to GitHub. For example:

    echo "My GitHub Page" > index.html
    git add .
    git commit -a -m "First pages commit"
    git push origin gh-pages

On the first push, it can take up to ten minutes before the content is available.

Real World Example: [github.com/defunkt/ambition@gh-pages](http://github.com/defunkt/ambition/tree/gh-pages) &rarr; [http://defunkt.github.com/ambition](http://defunkt.github.com/ambition).

Using Jekyll For Complex Layouts
================================

In addition to supporting regular HTML content, GitHub Pages support [Jekyll](http://github.com/mojombo/jekyll/), a simple, blog aware static site generator written by our own Tom Preston-Werner. Jekyll makes it easy to create site-wide headers and footers without having to copy them across every page. It also offers intelligent blog support and other advanced templating features.

Every GitHub Page is run through Jekyll when you push content to your repo. Because a normal HTML site is also a valid Jekyll site, you don't have to do anything special to keep your standard HTML files unchanged. Jekyll has a thorough [README](http://github.com/mojombo/jekyll/blob/master/README.textile) that covers its features and usage.

As of April 7, 2009, you can configure most Jekyll settings via your `_config.yml` file. Most notably, you can select your permalink style and choose to have your Markdown rendered with RDiscount instead of the default Maruku. The only options we override are as follows:

    source: <your pages repo>
    destination: <the build dir>
    lsi: false
    pygments: true

If your Jekyll site is not transforming properly after you push it to GitHub, it's useful to run the converter locally so you can see any parsing errors. In order to do this, you'll want to use the same version that we use.

We currently use <span style="font-weight: bold; color: #0a0;">Jekyll 0.5.0</span> and run it with the equivalent command:

    jekyll --pygments

If there's a feature you wish that Jekyll had, feel free to fork it and send a pull request. We're happy to accept user contributions.

Real World Example: [github.com/pages/pages.github.com](http://github.com/pages/pages.github.com/) &rarr; [http://pages.github.com/](http://pages.github.com/).

CNAME Support
=============

If you have a paid account or one of the collaborators on your repository has a paid account, GitHub Pages allows you to direct a domain name of your choice at your Page.

Let's say you own the domain name [example.com](http://example.com). Furthermore, your GitHub username is "charlie" and you have published a User Page at [http://charlie.github.com/](http://charlie.github.com/). Now you'd like to load up [http://example.com/](http://example.com) in your browser and have it show the content from [http://charlie.github.com/](http://charlie.github.com/).

Start by creating a file named `CNAME` in the root of your repository. It should contain your domain name like so:

    example.com

Push this new file up to GitHub.

Next, you'll need to visit your domain registrar or DNS host and add a CNAME record for your domain name. In this example, you would point [example.com](http://example.com) at [charlie.github.com](http://charlie.github.com/). It may take up to a full day for this change to propagate, so be patient.

Real World Example: [github.com/mojombo/mojombo.github.com](http://github.com/mojombo/mojombo.github.com/) &rarr; [http://tom.preston-werner.com/](http://tom.preston-werner.com/).
Power Editor
============
Power Editor is an HTML5 based application for managing Facebook ads. It's built entirely on the Facebook Ads API.

This is not only an example application. It's the same code that we use at Facebook to build our production Power Editor software which can be found at  https://www.facebook.com/ads/manage/powereditor. We've also set up a demo install at http://www.fbadsapp.com/.

Running locally
==============
install [node.js](http://nodejs.org/) and [npm](http://npmjs.org/)

    npm install uglify-js cssom mime express
    git clone git://github.com/facebook/powereditor.git
    cd powereditor
    node server/run.js

Open http://localhost:8001/

Licensing Information
=====================
This source code is licensed under one of two licenses. All use of uki-js (http://ukijs.org/) is subject to its BSD license. Non-product source code such as in common, server, storage and uki-fb is also released under the BSD license.

The remaining code (notably the "ads" directory) is subject to a license that allows you to use the source code under broad terms in conjunction with the Facebook Platform.


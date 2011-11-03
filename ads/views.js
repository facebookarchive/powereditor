/**
* Copyright 2011 Facebook, Inc.
*
* You are hereby granted a non-exclusive, worldwide, royalty-free license to
* use, copy, modify, and distribute this software in source code or binary
* form for use in connection with the web services and APIs provided by
* Facebook.
*
* As with any software that integrates with the Facebook platform, your use
* of this software is subject to the Facebook Developer Principles and
* Policies [http://developers.facebook.com/policy/]. This copyright notice
* shall be included in all copies or substantial portions of the software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
* THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
* DEALINGS IN THE SOFTWARE.
*
*
* View pack for ads
*
*/

var utils = require("../uki-core/utils");

utils.extend(exports,
    require("../uki-core/view/base"),
    require("../uki-core/view/container"),

    require("../uki-fb/view/selectable"),
    require("../uki-fb/view/focusable"),

    require("../uki-fb/view/button"),
    require("../uki-fb/view/checkbox"),
    require("../uki-fb/view/dataGrid"),
    require("../uki-fb/view/dataList"),
    { dataList: utils.extend(
        {},
        require("../uki-fb/view/dataList/editor"),
        require("../uki-fb/view/dataList/selectEditor"))
    },
    require("../uki-fb/view/dataTable"),
    require("../uki-fb/view/dataTree"),
    require("../uki-fb/view/dialog"),
    require("../uki-fb/view/fileInput"),
    require("../uki-fb/view/HTMLLayout"),
    require("../uki-fb/view/image"),
    require("../uki-fb/view/list"),
    require("../uki-fb/view/menu"),
    require("../uki-fb/view/pillButton"),
    require("../uki-fb/view/pillList"),
    require("../uki-fb/view/progressBar"),
    require("../uki-fb/view/radio"),
    require("../uki-fb/view/searchInput"),
    require("../uki-fb/view/select"),
    require("../uki-fb/view/selector"),
    require("../uki-fb/view/sideNav"),
    require("../uki-fb/view/splitPane"),
    require("../uki-fb/view/text"),
    require("../uki-fb/view/form"),
    require("../uki-fb/view/textArea"),
    require("../uki-fb/view/textInput"),
    require("../uki-fb/view/tokenizer"),
    { tokenizer: require("../uki-fb/view/tokenizer/token") },
    require("../uki-fb/view/typeahead"),

    require("./view/accountPane"),
    require("./view/adEditor"),
    require("./view/adErrors"),
    require("./view/adPane"),
    require("./view/adPreview"),
    require("./view/campaignList"),
    require("./view/campPane"),
    require("./view/campEditor"),
    require("./view/campErrors"),
    require("./view/content"),
    require("./view/dataTable/list"),
    require("./view/downloadProgress"),
    require("./view/bulkImportDialog"),
    require("./view/head"),
    require("./view/imageSelector"),
    require("./view/uploadDialog"),
    require("./view/logDialog"),
    require("./view/refreshDialog"),

    require("./view/contractEditor"),
    require("./view/contractPane"),
    require("./view/reachEstimate")
);

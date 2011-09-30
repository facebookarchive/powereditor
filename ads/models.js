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
* Models together
* All models correspond to a db table
*
*/


exports.Account         = require("./model/account").Account;
exports.Contract        = require("./model/contract").Contract;
exports.Topline         = require("./model/topline").Topline;
exports.Ad              = require("./model/ad").Ad;
exports.Image           = require("./model/image").Image;
exports.AdStat          = require("./model/adStat").AdStat;
exports.Campaign        = require("./model/campaign").Campaign;
exports.CampStat        = require("./model/campStat").CampStat;
exports.ConnectedObject = require("./model/connectedObject").ConnectedObject;
exports.BCT             = require("./model/bct").BCT;

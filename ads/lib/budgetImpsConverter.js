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
*/


var Converter = {
  convertToBudget: function(impressions, price) {
    if (!price) {
      return 0;
    }

    return (impressions / 1000) * price;
  },

  convertToImps: function(budget, price) {
    if (!price) {
      return 0;
    }

    return Math.round(((budget / 100) / price) * 1000);
  },

  inflateBudget: function(budget, inflation) {
    if (inflation > 0) {
      return budget * (1 + (inflation / 100));
    } else {
      return budget;
    }
  },

  uninflateBudget: function(budget, inflation) {
    if (inflation > 0) {
      return budget / (1 + (inflation / 100));
    } else {
      return budget;
    }
  },

  inflateImps: function(impression, inflation) {
    if (inflation > 0) {
      return Math.round(impression * (1 + (inflation / 100)));
    } else {
      return impression;
    }
  },

  uninflateImps: function(impression, inflation) {
    if (inflation > 0) {
      return Math.round(impression / (1 + (inflation / 100)));
    } else {
      return impression;
    }
  }
};


exports.Converter = Converter;

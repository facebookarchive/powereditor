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


var map =
{"ALL":["{amount}{symbol}","Lek"],"DZD":["{amount} {symbol}","\u062f.\u062c."],"ARS":["{symbol} {amount}","$"],"AMD":["{amount} {symbol}","\u0564\u0580."],"AUD":["{symbol}{amount}","$"],"EUR":["{symbol} {amount}","\u20ac"],"AZM":["{amount} {symbol}","\u043c\u0430\u043d."],"BHD":["{amount} {symbol}","\u062f.\u0628."],"BYB":["{amount} {symbol}","\u0440."],"BZD":["{symbol}{amount}","BZ$"],"BOB":["{symbol} {amount}","$b"],"BRL":["{symbol} {amount}","R$"],"BND":["{symbol}{amount}","$"],"BGL":["{amount} {symbol}","\u043b\u0432"],"CAD":["{amount}{symbol}","$"],"CLP":["{symbol} {amount}","$"],"COP":["{symbol} {amount}","$"],"CRC":["{symbol}{amount}","\u20a1"],"HRK":["{amount} {symbol}","kn"],"CZK":["{amount} {symbol}","K\u010d"],"DKK":["{symbol} {amount}","DKK"],"DOP":["{symbol} {amount}","RD$"],"USD":["{symbol}{amount}","$"],"EGP":["{amount} {symbol}","\u062c.\u0645."],"EEK":["{amount} {symbol}","kr"],"GEL":["{amount} {symbol}","Lari"],"GTQ":["{symbol}{amount}","Q"],"HNL":["{symbol} {amount}","L."],"HKD":["{symbol}{amount}","$"],"HUF":["{amount} {symbol}","Ft"],"ISK":["{amount} {symbol}","kr."],"INR":["{symbol} {amount}","\u0930\u0941"],"IDR":["{symbol}{amount}","Rp"],"IRR":["{amount} {symbol}","\u0631\u064a\u0627\u0644"],"IQD":["{amount} {symbol}","\u062f.\u0639."],"PKR":["{symbol}{amount}","Rs"],"ILS":["{symbol} {amount}","\u20aa"],"JMD":["{symbol}{amount}","J$"],"JPY":["{symbol}{amount}","\u00a5"],"JOD":["{amount} {symbol}","\u062f.\u0627."],"KZT":["{symbol}{amount}","\u0422"],"KES":["{symbol}{amount}","S"],"KRW":["{symbol}{amount}","\u20a9"],"KWD":["{amount} {symbol}","\u062f.\u0643."],"KGS":["{amount} {symbol}","\u0441\u043e\u043c"],"LVL":["{symbol} {amount}","Ls"],"LBP":["{amount} {symbol}","\u0644.\u0644."],"LYD":["{amount} {symbol}","\u062f.\u0644."],"CHF":["{symbol} {amount}","CHF"],"LTL":["{amount} {symbol}","Lt"],"MOP":["{symbol}{amount}","MOP"],"MKD":["{symbol}{amount}","\u0434\u0435\u043d."],"MYR":["{symbol}{amount}","R"],"MVR":["{symbol}{amount}","\u0783."],"MXN":["{symbol}{amount}","$"],"MNT":["{amount}{symbol}","\u20ae"],"MAD":["{amount} {symbol}","\u062f.\u0645."],"NZD":["{amount}{symbol}","$"],"NIO":["{symbol} {amount}","C$"],"NOK":["{symbol} {amount}","NOK"],"OMR":["{amount} {symbol}","\u0631.\u0639."],"PAB":["{symbol} {amount}","B\/."],"PYG":["{symbol} {amount}","Gs"],"CNY":["{amount} {symbol}","\uffe5"],"PEN":["{symbol} {amount}","S\/."],"PLN":["{amount} {symbol}","z\u0142"],"QAR":["{amount} {symbol}","\u0631.\u0642."],"PHP":["{symbol}{amount}","Php"],"ROL":["{amount} {symbol}","lei"],"RUR":["{amount}{symbol}","\u0440."],"SAR":["{amount} {symbol}","\u0631.\u0633."],"SGD":["{symbol}{amount}","$"],"SKK":["{amount} {symbol}","Sk"],"SIT":["{amount} {symbol}","SIT"],"ZAR":["{symbol} {amount}","R"],"SEK":["{amount} {symbol}","kr"],"SYP":["{amount} {symbol}","\u0644.\u0633."],"TWD":["{symbol}{amount}","NT$"],"THB":["{symbol}{amount}","\u0e3f"],"TTD":["{symbol}{amount}","TT$"],"TND":["{amount} {symbol}","\u062f.\u062a."],"TRY":["{amount} {symbol}","TL"],"AED":["{amount} {symbol}","\u062f.\u0625."],"UAH":["{amount} {symbol}","\u0433\u0440\u043d."],"GBP":["{symbol}{amount}","\u00a3"],"UYU":["{symbol} {amount}","$U"],"UZS":["{amount} {symbol}","\u0441\u045e\u043c"],"VEF":["{symbol} {amount}","Bs"],"VND":["{amount} {symbol}","\u20ab"],"YER":["{amount} {symbol}","\u0631.\u064a."],"ZWD":["{symbol}{amount}","Z$"],"FBZ":["{symbol}{amount}","C"]};

function getFormat(cur) {
  if (map[cur]) {
    return map[cur][0];
  }

  return null;
}

function getSymbol(cur) {
  if (map[cur]) {
    return map[cur][1];
  }

  return null;
}

exports.getFormat = getFormat;
exports.getSymbol = getSymbol;


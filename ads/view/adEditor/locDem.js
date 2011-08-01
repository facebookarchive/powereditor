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

var fun = require("../../../uki-core/function"),
    dom = require("../../../uki-core/dom"),
    view = require("../../../uki-core/view"),

    controls = require("../controls"),

    LocalDataSource =
        require("../../lib/typeahead/LocalDataSource").LocalDataSource,
    Completion        = require("../../model/completion").Completion,
    Base              = require("./base").Base,
    AdEditorConstants = require("./constants");

var LocDem = view.newClass('ads.adEditor.LocDem', Base, {

    _template: requireText('locDem/locDem.html'),

    _setupBindings: function(m) {
        ['countries', 'regions', 'cities', 'zips'].forEach(function(prop) {
            this.child(prop).binding({ model: m, modelProp: prop });
        }, this);
        var countries = this.model().countries(),
            newData = countries && countries.length && countries[0] || '';
        this.child('cities').data().queryData(newData);
        this.child('regions').data().queryData(newData);

        this.child('age').binding({ model: m, modelPrefix: 'age_' });
        this.child('exact_age').binding({
            model: m,
            modelProp: 'exact_age',
            modelEvent: 'change.broad_age'
        });

        this.child('radius')
            .binding({
                model: m,
                modelProp: 'use_radius',
                modelEvent: 'change.radius'
            })
            .selectBinding({ model: m, modelProp: 'radius' });

        this.child('sex').binding({ model: m, modelProp: 'sex' });
        this.child('loc').binding({ model: m, modelProp: 'loc_targeting' });
    },

    _prepare: function(callback) {
        Completion.prepare(['countries', 'regions'], callback);
        Completion.prepare(['cities'], fun.bind(this._regionChange, this));
    },

    _lockedModelChange: function(e) {
        if (!e || e.name === 'countries' || e.name === 'loc_targeting') {
            this._regionChange();
        }
    },

    _regionChange: function() {
        var countries = this.model().countries(),
            hasRegions = countries.length === 1 &&
              Completion.hasRegionsFor(countries[0]),
            hasCities = countries.length === 1 &&
              Completion.hasCitiesFor(countries[0]);
            hasZips = countries.length === 1 &&
              AdEditorConstants.SHOW_ZIP_TARGETING &&
              countries[0] === 'US';

        this.child('loc').visible(hasRegions || hasCities || hasZips);

        this.child('loc-regions').visible(hasRegions);
        this.child('loc-cities').visible(hasCities);
        this.child('loc-zips').visible(hasZips);

        this.child('regions').visible(hasRegions &&
            this.model().loc_targeting() == 'regions');
        this.child('cities').visible(hasCities &&
            this.model().loc_targeting() == 'cities');
        this.child('radius').visible(hasCities &&
            this.model().loc_targeting() == 'cities');
        this.child('zips').visible(hasZips &&
            this.model().loc_targeting() == 'zips');

        this.child('cities').data().queryEndpoint({
          search: Completion.createSearcher('cities', countries[0])
        });
        this.child('regions').data().queryEndpoint({
          search: Completion.createSearcher('regions', countries[0])
        });
    },

    _createDom: function(initArgs) {
        Base.prototype._createDom.call(this, initArgs);
        this.addClass('adEditor-locDem');
        this.content({
            location_label: 'Country',
            location: { view: 'List', horizontal: false,
                spacing: 'none', childViews: [
                { view: 'Tokenizer', inline: true, id: 'locDem-countries',
                    addClass: 'textField',
                    placeholder: 'Enter a country', childName: 'countries',
                    value2info: function(id) {
                      if (Completion.cached('countries')) {
                        var row = Completion.cached('countries').searchById(id);
                        return { text: row.value, id: row.id };
                      } else {
                        return { text: id, value: id };
                      }
                    },
                    data: (new LocalDataSource())
                        .maxResults(AdEditorConstants.MAX_RESULTS_DEFAULT)
                        .queryEndpoint({
                          search: Completion.createSearcher('countries')
                        })
                },
                { view: controls.RadioGroup, horizontal: false,
                    spacing: 'none', childName: 'loc',
                    childViews: [
                        { view: 'Radio', name: 'locDem-loc',
                          childName: 'loc-countries',
                          text: 'Everywhere', value: 'countries' },
                        { view: 'Radio', name: 'locDem-loc',
                          childName: 'loc-regions',
                          text: 'By State/Province', value: 'regions' },
                        { view: 'Radio', name: 'locDem-loc',
                          childName: 'loc-cities',
                          text: 'By City', value: 'cities' },
                        { view: 'Radio', name: 'locDem-loc',
                          childName: 'loc-zips',
                          text: 'By Zip Code', value: 'zips' }
                ]},
                { view: 'Tokenizer', inline: true, id: 'locDem-regions',
                    addClass: 'textField mts',
                    placeholder: 'Enter a state/province',
                    childName: 'regions',
                    value2info: function(v) {
                        return { id: v.id, text: v.name };
                    },
                    info2value: function(i) {
                        return { id: i.id, name: i.text };
                    },
                    data: (new LocalDataSource())
                        .maxResults(AdEditorConstants.MAX_RESULTS_DEFAULT)
                },
                { view: 'Tokenizer', inline: true, id: 'locDem-cities',
                    addClass: 'textField mts',
                    placeholder: 'Enter a city', childName: 'cities',
                    renderer: citiesRenderer,
                    value2info: function(v) {
                        return { id: v.id, text: v.name };
                    },
                    info2value: function(i) {
                        return { id: i.id, name: i.text };
                    },
                    data: (new LocalDataSource())
                        .maxResults(AdEditorConstants.MAX_RESULTS_DEFAULT)
                },
                { view: 'Tokenizer', inline: true, id: 'locDem-zips',
                    freeform: true,
                    addClass: 'textField mts',
                    placeholder: 'Enter a zip code',
                    childName: 'zips',
                    value2info: function(v) {
                      return { id: v, text: v };
                    },
                    info2value: function(i) {
                      return i.id;
                    },
                    data: (new LocalDataSource())
                        .maxResults(AdEditorConstants.MAX_RESULTS_DEFAULT)
                },
                { view: controls.Radius, childName: 'radius' }
            ]},

            age_label: 'Age',
            age: { view: 'List', horizontal: false, spacing: 'none',
                childViews: [
                    { view: controls.Age, childName: 'age',
                      name: 'locDem-age' },
                    { view: 'Checkbox',
                      text: 'Require exact age match',
                      childName: 'exact_age' }
                ]
            },

            sex_label: 'Sex',
            sex: { view: controls.Sex, name: 'locDem-sex', childName: 'sex' }
        });

        this._indexChildViews();
    }
});


function citiesRenderer(data, index) {
    var text = dom.escapeHTML(data.name),
    subtext = data.region,
    icon = data.icon,
    className = '';

    if (data.type) {
        className = ' class="' + data.type + '"';
    }

    return [
        '<li', className, '>',
            (icon ? '<img src="'  + icon + '" alt=""/>' : ''),
            (text ? '<span class="text">' +
                text +
                (subtext ? '<span class="locDem-regionSubtext">' +
                    dom.escapeHTML(subtext) + '</span>' : '') +
            '</span>' : ''),
        '</li>'
    ];
};


exports.LocDem = LocDem;

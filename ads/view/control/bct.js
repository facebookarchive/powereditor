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
 * Defines control(widget) for BCT(Broad Category Targeting)
 *
 */
requireCss("./bct/bct.css");

var fun   = require("../../../uki-core/function"),
  view  = require("../../../uki-core/view"),
  dom   = require("../../../uki-core/dom"),
  build = require("../../../uki-core/builder").build,
  find  = require("../../../uki-core/selector").find,
  utils = require("../../../uki-core/utils"),

  BCT = require("../../model/bct").BCT,

  Container  = require("../../../uki-core/view/container").Container,
  Binding    = require("../../../uki-fb/binding").Binding;

var bct = view.newClass('ads.control.bct', Container, {

  _setup: function() {
    this._selected_cluster_ids_set = {};
    this._cluster_to_name_map = {};
    return Container.prototype._setup.apply(this, arguments);
  },

  /**
   * Inherited function
   */
  binding: fun.newProp('binding', function(val) {
    if (this._binding) {
      this._binding.destruct();
    }

    this._binding =
      val &&
      new Binding(utils.extend({
        view: this,
        model: val.model,
        viewEvent: 'change.bct',
        commitChangesViewEvent: 'change.bct'
      }, val));
  }),

  /**
   * Inherited function
   */
  value: function(bct_data) {
    if (bct_data === undefined) {
      return this._getBCTData();
    } else {
      // set bct data
      this._setBCTData(bct_data);
      // load bct hierarch metadata and render
      this._loadBCTHierarchyMetaData(fun.bind(function() {
        this._render();
      }, this));
    }
  },

  /**
   * Set local variables from bct data
   */
  _setBCTData: function(bct_data) {
    // this._selected_cluster_ids_set is a map that mimicks a set
    // this._selected_cluster_ids_set[cluster_id] is true iff
    // the current ad has the cluster in its bct targeting
    this._selected_cluster_ids_set = {};
    for (var i = 0; i < bct_data.length; i++) {
      this._selected_cluster_ids_set[bct_data[i].id] = true;
    }
  },

  /**
   * Set bct_data from local variables
   */
  _getBCTData: function() {
    var bct_data = [];
    utils.forEach(
      this._selected_cluster_ids_set,
      function(value, key) {
        if (value) {
          bct_data.push({id: key, name: this._cluster_to_name_map[key]});
        }
      },
      this);
    return bct_data;
  },

  /**
   * Set local variables from hierarcy metadata. After this run
   * callback() function.
   */
  _loadBCTHierarchyMetaData: function(callback) {
    BCT.findAll(fun.bind(function(data) {
      // for each cluster_id, maps this to the cluster_name
      this._cluster_to_name_map = {};

      // for each parent category name, maps this to a list of its
      // child cluster ids
      this._parent_to_child_list_map = {};

      // cleanup BCT data
      data.forEach(fun.bind(function(datum) {
        var id = datum.id();
        var name = datum.name();
        var parent_category = datum.parent_category();
        if (parent_category !== undefined) {
          this._cluster_to_name_map[id] = name;
          if (!(parent_category in this._parent_to_child_list_map)) {
            this._parent_to_child_list_map[parent_category] = [];
          }
          this._parent_to_child_list_map[parent_category].push(id);
        }
      }, this));
      callback();
    }, this));
  },

  /**
   * Highest level render functions
   */
  _render: function() {
    // remove previously rendered components
    var left_pane = dom.createElement('div', {className: 'interests-bct-left'});
    this._td_left.replaceChild(left_pane, this._left_pane);
    this._left_pane = left_pane;

    var right_pane =
      dom.createElement('div', {className: 'interests-bct-right'});
    this._td_right.replaceChild(right_pane, this._right_pane);
    this._right_pane = right_pane;

    var total_selected_cluster_count = 0;

    utils.forEach(
      this._parent_to_child_list_map,
      fun.bind(function(cluster_ids, parent_category_name) {

      // if there is no selected parent cateogory, select the
      // first one
      if (this._selected_parent_category === undefined) {
        this._selected_parent_category = parent_category_name;
      }

      // compute selected_cluster_count and total_selected_cluster_count
      var selected_cluster_count = 0;
      for (var i = 0; i < cluster_ids.length; i++) {
        if (this._selected_cluster_ids_set[cluster_ids[i]]) {
          selected_cluster_count++;
          total_selected_cluster_count++;
        }
      }

      // render parent category text
      class_name = 'interests-bct-parent-category';
      if (this._selected_parent_category === parent_category_name) {
        class_name += ' interests-bct-parent-category-selected';
      }

      var text = parent_category_name;
      if (selected_cluster_count > 0) {
        text += ' (' + selected_cluster_count + ')';
      }

      var parent_category_text =
        {view: 'Text', text: text, className: class_name};
      var parent_category_text_el = build(parent_category_text)[0];

      var arrow =
        dom.createElement('span', {className: 'interest-bct-arrow'});
      parent_category_text_el._dom.appendChild(arrow);

      parent_category_text_el.on('click', fun.bind(function(e) {
        this._selected_parent_category = parent_category_name;
        this._render();
      }, this));
      this._left_pane.appendChild(parent_category_text_el._dom);

      // render child category list
      this._renderChildListForGroup(parent_category_name);
    }, this));

    // render header
    var text = total_selected_cluster_count + " categories selected";
    this._header_pane_text.innerHTML = text;
  },

  /**
   * Render list of child category selectors for a given parent category
   */
  _renderChildListForGroup: function(parent_category_name) {
    var cluster_ids = this._parent_to_child_list_map[parent_category_name];
    var selected_cluster_count = 0;

    var class_name = 'interests-bct-hidden';
    if (parent_category_name === this._selected_parent_category) {
      class_name = 'interests-bct-visible';
    }

    var div = dom.createElement('div', {className: class_name});
    this._right_pane.appendChild(div);

    cluster_ids.forEach(fun.bind(function(cluster_id) {
      var cluster_name = this._cluster_to_name_map[cluster_id];

      // find if the cluster is selected
      var cluster_checked = false;
      var class_name = 'interests-bct-cluster-text-unselected';
      if (cluster_id in this._selected_cluster_ids_set &&
        this._selected_cluster_ids_set[cluster_id]) {
        cluster_checked = true;
        class_name = 'interests-bct-cluster-text-selected';
      }

      // render checkbox
      var checkbox = {
        view: 'Checkbox',
        text: cluster_name,
        checked: cluster_checked,
        className: class_name
      };
      var checkbox_el = build(checkbox)[0];
      var checkbox_el_div = dom.createElement('div');
      checkbox_el_div.appendChild(checkbox_el._dom);
      div.appendChild(checkbox_el_div);

      // render checkbox click listener
      checkbox_el.on('click', fun.bind(function(e) {
        if (e.target.checked) {
          this._selected_cluster_ids_set[cluster_id] = true;
        } else {
          this._selected_cluster_ids_set[cluster_id] = false;
        }
        this.trigger({type: 'change.bct'});
        this._binding.updateModel();
        this._render();
      }, this));
    }, this));
  },

  /**
   * Inherited function
   */
  _createDom: function(initArgs) {
    // inialize some local
    this._selected_parent_category = undefined;

    // table with left and right panes
    this._left_pane =
      dom.createElement('div', {className: 'interests-bct-left'});
    this._td_left =
      dom.createElement('td', {className: 'interests-bct-td'},
                        [this._left_pane]);
    this._right_pane =
      dom.createElement('div', {className: 'interests-bct-right'});
    this._td_right =
      dom.createElement('td', {className: 'interests-bct-td'},
                        [this._right_pane]);
    var tr = dom.createElement('tr', {}, [this._td_left, this._td_right]);
    var table = dom.createElement('table', {}, [tr]);

    // header
    this._header_pane_text =
      dom.createElement('span', {className: 'interests-bct-header-text'});
    this._header_pane =
      dom.createElement('div', {className: 'interests-bct-header mls'},
                        [this._header_pane_text]);

    // final highest level dom
    this._dom =
      dom.createElement('div', {className: 'interests-bct-main'},
                        [table, this._header_pane]);
  }
});
exports.bct = bct;

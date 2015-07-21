this.recline = this.recline || {};
this.recline.View = this.recline.View || {};


;(function ($, my, global) {
  'use strict';

  /**
  * Load data view
  */
  global.LoadDataView = Backbone.View.extend({
    template: '<div class="form-group">' +
    '<label for="control-map-source">Source</label>' +
    '<input value="{{source.url}}" type="text" id="control-map-source" class="form-control" />' +
    '</div>' +
    '<div class="form-group">' +
    '<select id="control-map-backend" class="form-control">' +
    '<option value="csv">CSV</option>' +
    '<option value="gdocs">Google Spreadsheet</option>' +
    '<option value="ckan">DataProxy</option>' +
    '</select>' +
    '</div>' +
    '<div id="controls">' +
    '<div id="next" class="btn btn-primary pull-right">Next</div>' +
    '</div>',
    initialize: function(options) {
      var self = this;
      self.options = _.defaults(options || {}, self.options);
      self.state = self.options.state;
      self.model = self.options.model;
      self.stepInfo = {
        title: 'Load Data',
        name: 'loadData'
      };
    },
    render: function() {
      var self = this;
      self.$el.html(Mustache.render(self.template, self.state.toJSON()));
    },
    updateState: function(state, cb) {
      var self = this;
      var url = self.$('#control-map-source').val();
      var backend = self.$('#control-map-backend').val();
      var source = {
        backend: backend,
        url: url
      };
      state.set('model', new recline.Model.Dataset(source));
      state.set('source', source);
      state.get('model').fetch().done(function(){
        cb(state);
      });
    }
  });

  /**
  * Map settings view
  */
  global.MapSettingsView = Backbone.View.extend({
    template: '<div class="form-group">' +
    '<p><input type="radio" id="type-geopoint" name="control-map-type" value="geopoint" {{#sourceGeopoint}}checked{{/sourceGeopoint}}>' +
    '<label for="type-geopoint">Geo Point field</label></p>' +
    '<p><input type="radio" id="type-latlon" name="control-map-type" value="latlon" {{#sourceLatlon}}checked{{/sourceLatlon}}>' +
    '<label for="type-geopoint">Latitude and Longitude fields</label></p></div>' +
    '<div class="form-group form-group-latlon {{#sourceGeopoint}}form-group-hidden{{/sourceGeopoint}}">' +
    '<label for="control-map-latfield">Latitude Field</label>' +
    '<select id="control-map-latfield" class="form-control">' +
    '{{#fields}}' +
    '<option value="{{value}}" {{#latSelected}}selected{{/latSelected}}>{{name}}</option>' +
    '{{/fields}}' +
    '</select>' +
    '<label for="control-map-lonfield">Longitude Field</label>' +
    '<select id="control-map-lonfield" class="form-control">' +
    '{{#fields}}' +
    '<option value="{{value}}" {{#lonSelected}}selected{{/lonSelected}}>{{name}}</option>' +
    '{{/fields}}' +
    '</select>' +
    '</div>' +
    '<div class="form-group form-group-geopoint {{#sourceLatlon}}form-group-hidden{{/sourceLatlon}}"">' +
    '<label for="control-map-geopoint">Geopoint Field</label>' +
    '<select id="control-map-geopoint" class="form-control">' +
    '{{#fields}}' +
    '<option value="{{value}}" {{#geomSelected}}selected{{/geomSelected}}>{{name}}</option>' +
    '{{/fields}}' +
    '</select>' +
    '</div>' +
    '<div class="form-group">' +
    '<input type="checkbox" id="control-map-cluster" value="1" {{#clusterEnabled}}checked{{/clusterEnabled}}>' +
    '<label for="control-map-cluster">Enable clustering</label>' +
    '</div>' +
    '<div id="controls">' +
    '<div id="prev" class="btn btn-default pull-left">Back</div>' +
    '<button id="next" class="btn btn-success pull-right">Finish</button>' +
    '</div>',
    events: {
      'change [name="control-map-type"]': 'toggleDepFields',
    },
    initialize: function(options) {
      var self = this;
      self.options = _.defaults(options || {}, self.options);
      self.state = self.options.state;
      self.model = self.options.model;
      self.stepInfo = {
        title: 'Map Settings',
        name: 'mapSettings'
      };
    },
    render: function() {
      var self = this;

      var geomSelected;
      var latSelected;
      var lonSelected;
      var cluster;
      var mapConfig = self.state.get('mapConfig');
      if (mapConfig) {
        latSelected = mapConfig.latField;
        lonSelected = mapConfig.lonField;
        geomSelected = mapConfig.geomField;
        cluster = mapConfig.state.cluster;
      }

      var fields = new Array();
      self.state.get('model')
        .fields
        .each(function(field) {
          fields.push({
            value: field.id,
            name: field.id,
            latSelected: field.id === latSelected,
            lonSelected: field.id === lonSelected,
            geomSelected: field.id === geomSelected,
          });
        });
      self.state.set('fields', fields);

      self.state.set('clusterEnabled', cluster);
      self.state.set('sourceGeopoint', geomSelected || !mapConfig);
      self.state.set('sourceLatlon', !geomSelected && mapConfig);

      self.$el.html(Mustache.render(self.template, self.state.toJSON()));
    },
    updateState: function(state, cb) {
      var self = this;
      var geomField = null;
      var lonField = null;
      var latField = null;
      var sourceType = null;
      if(self.$('#type-geopoint').prop('checked')) {
        sourceType = self.$('#type-geopoint').val();
      } else if(self.$('#type-latlon').prop('checked')) {
        sourceType = self.$('#type-latlon').val();
      }
      var cluster = self.$('#control-map-cluster').prop('checked');
      if (sourceType == 'geopoint') {
        geomField = self.$('#control-map-geopoint').val();
      } else if (sourceType == 'latlon') {
        var lonField = self.$('#control-map-lonfield').val();
        var latField = self.$('#control-map-latfield').val();
      }
      var mapConfig = {
        lonField: lonField,
        latField: latField,
        geomField: geomField,
        state: {
          cluster: cluster,
        },
      }
      self.state.set('mapConfig', mapConfig);
      $('#eck-entity-form-add-visualization-ve-map').submit();
    },
    toggleDepFields: function(e) {
      if (e.target.value == 'geopoint') {
        $('.form-group-latlon').addClass('form-group-hidden');
        $('.form-group-geopoint').removeClass('form-group-hidden');
      } else if(e.target.value == 'latlon') {
        $('.form-group-latlon').removeClass('form-group-hidden');
        $('.form-group-geopoint').addClass('form-group-hidden');
      }
    },
  });

  /**
  * Multi stage view
  */
  global.MultiStageView = Backbone.View.extend({
    template: '<h3>{{title}}</h3>' +
    '<input type="hidden" value="{{state}}"/>' +
    '<div id="step"></div>',
    events: {
      'click #next': 'nextStep',
      'click #prev': 'prevStep'
    },
    initialize: function(options) {
      var self = this;
      self.options = _.defaults(options || {}, self.options);
      self.state = self.options.state;
      self.currentView = null;
      self.currentStep = self.state.get('step') || 0;
      self.steps = [];

      self.state.set('step', self.currentStep);
    },
    render: function() {
      var self = this;
      self.currentView = self.getStep(self.currentStep);
      _.extend(self.currentView.stepInfo, {state: JSON.stringify(self.state.toJSON())});
      self.$el.html(Mustache.render(self.template, self.currentView.stepInfo));

      self.assign(self.currentView, '#step');
      return self;
    },
    assign: function(view, selector) {
      var self = this;
      view.setElement(self.$(selector)).render();
    },
    addStep: function(view) {
      var self = this;
      self.steps.push(view);
    },
    getStep: function(index) {
      var self = this;
      return self.steps[index];
    },
    nextStep: function() {
      var self = this;
      var toNext = self.updateStep(self.getNext(self.steps, self.currentStep));
      self.currentView.updateState(self.state, toNext);
    },
    prevStep: function() {
      var self = this;
      var toPrev = self.updateStep(self.getPrev(self.steps, self.currentStep));
      self.currentView.updateState(self.state, toPrev);
    },
    getNext: function(steps, current) {
      var limit = steps.length - 1;
      if(limit === current){
        return current;
      }
      return ++current;
    },
    getPrev: function(steps, current) {
      if(current) {
        return --current;
      }
      return current;
    },
    updateStep: function(n) {
      var self = this;
      return function(state) {
        self.state = state;
        self.gotoStep(n);
        self.trigger('multistep:change', {step:n});
      };
    },
    gotoStep: function(n) {
      var self = this;
      self.currentStep = n;
      self.state.set('step', self.currentStep);
      self.render();
    }
  });

})(jQuery, recline.View, window);

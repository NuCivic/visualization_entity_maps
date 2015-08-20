(function($) {
  Drupal.behaviors.VisualizationEntityMapsView = {
    attach: function (context) {
      var isIframe = !$('.content').is(':visible');
      var state = $('.field-name-field-ve-map-settings .field-item:eq(0)').text();
      var el = $('#map');
      var $el;
      var title;
      var height;
      var $body;

      // Needed when Leaflet is uglified
      L.Icon.Default.imagePath = Drupal.settings.visualizationEntityMaps.leafletPath + '/dist/images';

      if (state) {
        state = new recline.Model.ObjectState(JSON.parse(state));
        $body = $(document.body);
        $window = $(window);
        $body.removeClass('admin-menu');

        if($('#iframe-shell').length){
          $el = $('#map');

          if(state.get('mapState').showTitle){
            title = $('#iframe-shell').find('h2 a').html();

            $body.prepend('<h2 class="veTitle">' + title + '</h2>');
            height = getVisualizationHeight(true);
            resize();
          } else {
            height = getVisualizationHeight(false);
          }
          state.set('height', height);
          state.set('width', $window.width() - 10);
          $window.on('resize', resize);
        } else {
          $el = $('#map');
          state.set('width', $('.field-name-field-ve-settings').width());
        }

        var model = state.get('source');
        model.url = cleanURL(model.url);
        var dataset = new recline.Model.Dataset(model);

        mapState = state.get('mapState');

        var mapConfig = {
          model: dataset,
          el: $el,
          state: mapState,
        };

        // Remove limitation of 100 rows. There is no 'unlimited' setting.
        dataset.queryState.attributes.size = 10000000;

        dataset.fetch()
          .done(function(d) {

            if (mapConfig.state.geomField) {
              d.fields.each(function(field) {
                if (field.id === mapConfig.state.geomField) {
                  field.type = 'geo_point';
                }
              });

              d.records.each(function(r) {
                match = r.get(mapConfig.state.geomField).match(/\(-?[\d.]+?, -?[\d.]+?\)/);
                if (match) {
                  r.set(mapConfig.state.geomField, match[0]);
                } else {
                  r.set(mapConfig.state.geomField, '');
                }
              });
            }

            var map = new recline.View.Map(mapConfig);
            map.render();
            setTimeout(resize, 0);
          });
      }
      function resize(){
        var $title = $body.find('h2.veTitle');
        var hasTitle = !!$title.length;
        var height = getVisualizationHeight(hasTitle);
        $('.recline-nvd3').height(height);
        $('.recline-map .map').height(height);

      }
      function getVisualizationHeight(hasTitle) {
        var height = (!hasTitle)
          ? $(window).height()
          : $(window).height() - $body.find('h2.veTitle').outerHeight(true);

        return height;
      }
      function cleanURL(url) {
        var haveProtocol = new RegExp('^(?:[a-z]+:)?//', 'i');
        if(haveProtocol.test(url)){
          url = url.replace(haveProtocol, '//');
        }
        return url;
      }
    }
  };
})(jQuery);

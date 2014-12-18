define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/on',
  'dojo/dom',

  'dojox/lang/functional/curry',
  'dojox/gesture/tap'
], function(
  declare, lang, arrayUtils,
  on, dom,
  curry, tap
) {
  var some = arrayUtils.some;
  var hitch = lang.hitch;

  function stopEvent(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  var getNode = curry(function(target, graphic) {
    return (graphic.getNode() === target);
  });

  var handler = curry(function(layers, callback, e) {
    stopEvent(e);
    var hasNode = getNode(e.target);
    // iterate over layers
    return some(layers, function(layer) {
      var graphics = layer.graphics;
      var len = graphics.length;
      var graphic;

      // find the graphic node that matches target node
      while (len--) {
        graphic = graphics[len];
        if (hasNode(graphic)) {
          e.graphic = graphic;
          callback(e);
          return true;
        }
      }
      return false;
    });
  });

  return declare(null, {

    _init: function() {
      if (this.isTouch && this.editableLayers && this.editableLayers.length) {
        var node = dom.byId(this.map.id + '_gc');
        var withLayers = handler(this.editableLayers);
        var holdHandler = withLayers(hitch(this, 'handleMouseDown'));
        var dblClickHandler = withLayers(hitch(this, 'onLayerDblClick'));

        this.duration = 100; // lower duration since hold duration is 500
        this.own(
          on(node, tap.hold, holdHandler),
          on(node, tap.doubletap, dblClickHandler)
        );
      }
    }

  });

});

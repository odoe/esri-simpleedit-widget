/*global define*/
/*jshint laxcomma:true*/
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
  var some = arrayUtils.some
    , hitch = lang.hitch
    , partial = lang.partial;

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
      var graphics
        , len
        , graphic;
      graphics = layer.graphics;
      len = graphics.length;
      // find the graphic node that matches target node
      while(len--) {
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
        var nodeId
          , node
          , withLayers
          , holdHandler
          , dblClickHandler;

        nodeId = this.map.id;
        node = dom.byId(nodeId + '_gc');
        withLayers = handler(this.editableLayers);
        holdHandler = withLayers(hitch(this, 'handleMouseDown'));
        dblClickHandler = withLayers(hitch(this, 'onLayerDblClick'));
        this.duration = 100; // lower duration since hold duration is 500
        this.own(
          on(node, tap.hold, holdHandler),
          on(node, tap.doubletap, dblClickHandler)
        );
      }
    }

  });

});

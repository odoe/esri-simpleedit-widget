/*global define*/
define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/on',
  'dojo/dom',

  'dojox/gesture/tap'
], function(
  declare, lang, arrayUtils,
  on, dom,
  tap
) {

  return declare(null, {

    _init: function() {
      if (this.isTouch && this.editableLayers && this.editableLayers.length) {
        console.log('map?', this.map);
        var nodeId = this.map.id;
        console.debug('touchmixin', nodeId);
        var node = dom.byId(nodeId+'_gc');
        console.debug('node?', node);
        this.own(
          on(node, tap.hold, lang.hitch(this, '_onHold')),
          on(node, tap.doubletap, lang.hitch(this, '_onDblTap'))
          //on(node, tap.hold, this._gestureHandler(this.editableLayers, this._onHold)),
          //on(node, tap.doubletap, this._gestureHandler(this.editableLayers, this._onDblTap))
        );
      }
    },

    _gestureHandler: function(layers, func) {
      return function(e) {
        arrayUtils.map(layers, function(lyr) {
          var i = lyr.graphics.length;
          while(i--) {
            var graphic = lyr.graphics[i];
            var gnode = graphic.getNode();
            if (gnode === e.target) {
              e.graphic = graphic;
              console.debug('found a graphic');
              func(e);
            }
          }
        });
      };
    },

    _onDblTap: function(e) {
      console.debug('double-tapped', e);
      arrayUtils.forEach(this.editableLayers, function(lyr) {
        var i = lyr.graphics.length;
        while(i--) {
          var graphic = lyr.graphics[i];
          var gnode = graphic.getNode();
          if (gnode === e.target) {
            e.graphic = graphic;
            console.debug('found a graphic');
            this.onLayerDblClick(e);
          }
        }
      }, this);
    },

    _onHold: function(e) {
      console.debug('hold', e);
      this.duration = this.duration - 500;
      arrayUtils.forEach(this.editableLayers, function(lyr) {
        var i = lyr.graphics.length;
        while(i--) {
          var graphic = lyr.graphics[i];
          var gnode = graphic.getNode();
          if (gnode === e.target) {
            e.graphic = graphic;
            console.debug('found a graphic');
            this.handleMouseDown(e);
          }
        }
      }, this);
    }

  });

});

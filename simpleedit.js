/*global define, clearTimeout, setTimeout*/
define([
  'require',
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/Evented',
  'dojo/on',
  'dojo/dom',
  'dijit/_WidgetBase',
  'esri/toolbars/edit',
  './_gesturemixin'
], function(
  require,
  declare, lang, arrayUtils,
  Evented, on, dom,
  _WidgetBase,
  Edit,
  _GestureMixin
) {

  var hitch = lang.hitch;

  function getLayerId(lyr) {
    return lyr.layerId;
  }

  // found at http://ctrlq.org/code/19616-detect-touch-screen-javascript
  function is_touch_device() {
    return (('ontouchstart' in window) ||
            (navigator.MaxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0));
  }

  function getLayer(graphic) {
    return graphic._graphicsLayer;
  }

  function head(t) {
    return t[0];
  }

  return declare([_WidgetBase, _GestureMixin, Evented], {

    // will be used to determine if a layer is
    // currently being edited
    editAction: {},

    startup: function() {
      this.set('isTouch', is_touch_device());
      if (!this.get('map')) {
        this.destroy();
        console.error('SimpleEdit::map required');
      }

      if (!this.get('duration')) {
        this.set('duration', 1000);
      }

      if (this.get('useDialog')) {
        // lazy load the dijit/Dialg
        require(['dijit/Dialog'], hitch(this, function(Dialog) {
          this.verifyDialog = new Dialog({
            title: 'Confirm Delete',
            closable: false,
            content: [
              '<div><button class="btn btn-danger simple-delete">',
              'Yes</button>',
              '&nbsp;&nbsp;',
              '<button class="btn btn-success simple-cancel">',
              'No</button></div>'
            ].join('')
          });

          var node = this.verifyDialog.domNode;
          this.own(
            on(node, '.simple-delete:click', hitch(this, 'deleteFeature')),
            on(node, '.simple-cancel:click', hitch(this, function() {
              this.verifyDialog.hide();
            }))
          );
        }));
      }

      this.set('editTool', new Edit(this.get('map')));

      if (this.get('map').loaded) {
        this.setup();
      } else {
        on.once(this.get('map'), 'load', hitch(this, 'setup'));
      }

    },

    setup: function() {
      var hasLayerIds = arrayUtils.filter(this.get('editLayers'), getLayerId);
      // listen for Edit toolbar deactivate
      this.own(
        on(this.get('editTool'), 'deactivate', hitch(this, 'applyEdits'))
      );
      // iterate editable layers and listen for dbl-click
      this.set('editableLayers', arrayUtils.map(hasLayerIds, function(data) {
        var layer = this.get('map').getLayer(data.layerId);
        this.editAction[data.layerId] = {
          editing: false,
          editType: data.editType || 'EDIT_VERTICES' // default to EDIT_VERTICES
        };
        // check if it's a touch device, if it is, these events don't work
        if (!this.get('isTouch')) {
          this.own(
            on(layer, 'dbl-click', hitch(this, 'onLayerDblClick')),
            on(layer, 'mouse-down', hitch(this, 'handleMouseDown')),
            on(layer, 'mouse-up', hitch(this, 'handleMouseUp'))
          );
        }
        return layer;
      }, this));

      this._init();
    },

    // helper method to find editable layers by id
    findEditLayer: function(id) {
      return head(arrayUtils.filter(this.get('editableLayers'), function(layer) {
        return layer.id === id;
      }));
    },

    deactivateEdit: function(layerId) {
      this.get('editTool').deactivate();
      this.editAction[layerId].editing = false;
      this.emit('edit-tool-deactivate', {});
    },

    // apply edits when done
    applyEdits: function(e) {
      // if feature gets deleted it no longer belongs
      // to a graphicslayer, so check first
      if (e.graphic._graphicsLayer && e.info.isModified) {
        var layer = this.findEditLayer(getLayer(e.graphic).id);
        layer.applyEdits(
          null, [e.graphic], null
        ).then(hitch(this, function() {
          this.emit('edit-tool-edits-complete', arguments);
        }), hitch(this, function() {
          this.emit('edit-tool-edits-error', arguments);
        }));
      }
    },

    // edit vertices on dbl-click
    onLayerDblClick: function(e) {
      if (!e.defaultPrevented) {
        e.preventDefault();
        e.stopPropagation();
      }
      var layer, editing, editType;
      layer = this.findEditLayer(getLayer(e.graphic).id);
      editing = this.editAction[layer.id].editing;
      if (!editing) {
        editType = this.editAction[layer.id].editType;
        this.editAction[layer.id].editing = true;
        this.get('editTool').activate(Edit[editType], e.graphic);
        this.emit('edit-tool-activate', e.graphic);
      } else {
        this.deactivateEdit(layer.id);
      }
    },

    deleteFeature: function(feature) {
      var graphic;
      if (this.get('useDialog')) {
        graphic = this.verifyDialog._graphic;
      } else {
        graphic = feature;
      }
      if (graphic) {
        var layer = this.findEditLayer(getLayer(graphic).id);
        this.deactivateEdit(layer.id);
        layer.applyEdits(
          null, null, [graphic]
        ).then(hitch(this, function() {
          if (this.get('useDialog')) {
            this.verifyDialog._graphic = null;
            this.verifyDialog.hide();
          }
          this.emit('edit-tool-edits-complete', arguments);
        }), hitch(this, function() {
          this.emit('edit-tool-edits-error', arguments);
        }));
      }
    },

    handleMouseDown: function(e) {
      if (!e.defaultPrevented) {
        e.preventDefault();
        e.stopPropagation();
      }
      var layer, editing;
      layer = this.findEditLayer(getLayer(e.graphic).id);
      editing = this.editAction[layer.id].editing;
      if (editing) {
        this.timeoutID = setTimeout(hitch(this, function() {
          if (this.get('useDialog')) {
            this.verifyDialog._graphic = e.graphic;
            this.verifyDialog.show();
          } else if (confirm('Confirm Delete')) { // use native confirm
            this.deleteFeature(e.graphic);
          }
        }), this.get('duration'));
      }
    },

    handleMouseUp: function(e) {
      if(typeof this.timeoutID == "number") {
        clearTimeout(this.timeoutID);
        delete this.timeoutID;
      }
    },

    _init: function() {
      this.inherited(arguments);
      this.set('loaded', true);
      this.emit('loaded', {});
    }

  });

});

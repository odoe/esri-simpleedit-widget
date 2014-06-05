# ArcGIS JavaScript Simple Edit Widget

----
This is a simple edit widget for [ArcGIS JavaScript](http://developers.arcgis.com/en/javascript/).

The idea behind this widget is to wrap very simple edit tasks in a widget to quickly add editing capabilities to a map project.

Configuration Options
---

```javascript
{
  "useDialog": true,
  "duration": 1000,
  "editLayers": [
    {
      "layerId": "myLayerId",
      "editType": "EDIT_VERTICES"
    }
  ]
}
```

If `useDialog` is omitted or false, widget will use native JavaScript
[confirm](https://developer.mozilla.org/en-US/docs/Web/API/Window.confirm) to
verfiy delete. If not, it will use a [dijit/Dialog](http://dojotoolkit.org/reference-guide/1.9/dijit/Dialog.html) to confirm deleting of features.

Double-click a feature in specified layer to start editing.

You can delete a feature by holding down the mouse on a feature while it is
being edited for specified `duration`. Default is 1000.

*A work in progress*


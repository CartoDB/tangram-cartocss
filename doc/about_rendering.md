# About Rendering

## Limitations

### Marker-width should always have a value.

Imagine we want a map where only cities with populatioin bigger than 100000 must be shown.

A symbolizer (in the example `marker-`) is not present on the map unless it has a some rule defined. Once one of its rules is added to the stylesheet default values will apply to the other properties for that symbolizer unless overridden.


Currently this is not supported by tangram-carto because the marker-width value will be `null` causing an error:
```less
#cities {
  // No rules for default, small cities are not shown
  // [implicit] marker-width: null;  <---- this causes a tangram error
  [population > 100000]{
    marker-width: 20;
  }
}
``` 


By the other side, if there is already a symbolizer (marker-fill) the default value (10) is given to the marker-width.
```less
#cities {
  marker-fill: red; // This rule activates the marker symbolizer
  // [implicit:default] marker-width: 10;
  [population > 100000]{
    marker-width: 20;
  }
}
``` 


This means that if you want the markers to be invisible you have to set a 0 size.
```less
#cities {
  marker-width: 0; // By default the markers will be invisible
  [population > 100000]{
    marker-width: 20;
  }
}
``` 

### Dynamic marker-allow-overlap is not supported.

This means that you cannot change the `marker-allow-overlap` based on some rules, you can only set the default value for the layer.

```less
#cities {
  [population > 100000]{
    marker-allow-overlap: true; // This is not supported!
    ...
  }
}

```less
#cities {
  marker-allow-overlap: true; // This is nice!
  [population > 100000]{
    ...
  }
}


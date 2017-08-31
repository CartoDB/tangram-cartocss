const { getReferenceDefaultMarkerValue } = require('./utils.js');

module.exports = [
    {
        name: 'all default',
        ccss: `
      #layer{
          marker-type: ellipse;
      }
      `,
        expected: {
            color: getReferenceDefaultMarkerValue('fill'),
            collide: getReferenceDefaultMarkerValue('allow-overlap'),
            size: getReferenceDefaultMarkerValue('width'),
            blend: 'overlay',
            outlineColor: getReferenceDefaultMarkerValue('stroke'),
            outlineSize: getReferenceDefaultMarkerValue('stroke-width')
        }
    },

    {
        name: 'color literal, opacity literal',
        ccss: `
      #layer{
          marker-type: ellipse;
          marker-opacity: 0.5;
          marker-fill: green;
      }
      `,
        expected: {
            color: 'rgba(0,128,0,0.5)',
            collide: getReferenceDefaultMarkerValue('allow-overlap'),
            size: getReferenceDefaultMarkerValue('width'),
            blend: 'overlay',
            outlineColor: 'rgba(0,0,0,0.5)',
            outlineSize: getReferenceDefaultMarkerValue('stroke-width')
        }
    },


    {
        name: 'color literal, opacity callback',
        ccss: `
          #layer{
              marker-type: ellipse;
              marker-opacity: 0.5;
              marker-fill: green;
              [a>2]{
                  marker-opacity: 0.1;
              }
          }
          `,
        feature: { a: 0 },
        expected: {
            color: 'rgba(0,128,0,0.5)',
            collide: getReferenceDefaultMarkerValue('allow-overlap'),
            size: getReferenceDefaultMarkerValue('width'),
            blend: 'overlay',
            outlineColor: 'rgba(0,0,0,0.5)',
            outlineSize: getReferenceDefaultMarkerValue('stroke-width')
        }
    },

    {
        name: 'color literal, opacity callback',
        ccss: `
          #layer{
              marker-type: ellipse;
              marker-opacity: 0.5;
              marker-fill: green;
              [a>2]{
                  marker-opacity: 0.1;
              }
          }
          `,
        feature: { a: 5 },
        expected: {
            color: 'rgba(0,128,0,0.1)',
            collide: getReferenceDefaultMarkerValue('allow-overlap'),
            size: getReferenceDefaultMarkerValue('width'),
            blend: 'overlay',
            outlineColor: 'rgba(0,0,0,0.1)',
            outlineSize: getReferenceDefaultMarkerValue('stroke-width')
        }
    },


    {
        name: 'color callback, opacity literal',
        ccss: `
          #layer{
              marker-type: ellipse;
              marker-opacity: 0.5;
              marker-fill: #FFF;
              [a>2]{
                  marker-fill: #000;
              }
          }
          `,
        feature: { a: 0 },
        expected: {
            color: 'rgba(255,255,255,0.5)',
            collide: getReferenceDefaultMarkerValue('allow-overlap'),
            size: getReferenceDefaultMarkerValue('width'),
            blend: 'overlay',
            outlineColor: 'rgba(0,0,0,0.5)',
            outlineSize: getReferenceDefaultMarkerValue('stroke-width')
        }
    },
    {
        name: 'color callback, opacity literal',
        ccss: `
          #layer{
              marker-type: ellipse;
              marker-opacity: 0.5;
              marker-fill: #FFF;
              [a>2]{
                  marker-fill: #000;
              }
          }
          `,
        feature: { a: 5 },
        expected: {
            color: 'rgba(0,0,0,0.5)',
            collide: getReferenceDefaultMarkerValue('allow-overlap'),
            size: getReferenceDefaultMarkerValue('width'),
            blend: 'overlay',
            outlineColor: 'rgba(0,0,0,0.5)',
            outlineSize: getReferenceDefaultMarkerValue('stroke-width')
        }
    },


    {
        name: 'color callback, opacity callback',
        ccss: `
          #layer{
              marker-type: ellipse;
              marker-opacity: 0.5;
              marker-fill: #FFF;
              [a>2]{
                  marker-fill: #000;
              }
              [b>2]{
                  marker-opacity: 0.1;
              }
          }
          `,
        feature: { a: 0, b: 0 },
        expected: {
            color: 'rgba(255,255,255,0.5)',
            collide: getReferenceDefaultMarkerValue('allow-overlap'),
            size: getReferenceDefaultMarkerValue('width'),
            blend: 'overlay',
            outlineColor: 'rgba(0,0,0,0.5)',
            outlineSize: getReferenceDefaultMarkerValue('stroke-width')
        }
    },


    {
        name: 'marker-line-opacity',
        ccss: `
          #layer{
              marker-line-opacity: 0.2;
          }
          `,
        expected: {
            color: 'rgba(0,0,255,1)',
            collide: getReferenceDefaultMarkerValue('allow-overlap'),
            size: getReferenceDefaultMarkerValue('width'),
            blend: 'overlay',
            outlineColor: 'rgba(0,0,0,0.2)',
            outlineSize: getReferenceDefaultMarkerValue('stroke-width')
        }
    },
    {
        name: 'marker-fill-opacity',
        ccss: `
          #layer{
              marker-fill-opacity: 0.2;
          }
          `,
        expected: {
            color: 'rgba(0,0,255,0.2)',
            collide: getReferenceDefaultMarkerValue('allow-overlap'),
            size: getReferenceDefaultMarkerValue('width'),
            blend: 'overlay',
            outlineColor: 'rgba(0,0,0,1)',
            outlineSize: getReferenceDefaultMarkerValue('stroke-width')
        }
    },
    {
        name: 'opacity overrides opacity-outline & opacity-fill',
        ccss: `
          #layer{
            marker-fill-opacity: 0.1;
            marker-line-opacity: 0.2;
            marker-opacity: 0.5;
        }
          `,
        expected: {
            color: 'rgba(0,0,255,0.5)',
            collide: getReferenceDefaultMarkerValue('allow-overlap'),
            size: getReferenceDefaultMarkerValue('width'),
            blend: 'overlay',
            outlineColor: 'rgba(0,0,0,0.5)',
            outlineSize: getReferenceDefaultMarkerValue('stroke-width')
        }
    },
    {
        name: 'opacity overrides opacity-outline & opacity-fill with callback',
        ccss: `
          #layer{
            marker-fill-opacity: 0.1;
            marker-line-opacity: 0.2;
            marker-opacity: 0.5;
            [a>2]{
                marker-opacity: 0.7;
            }
        }
          `,
        feature: { a: 3 },
        expected: {
            color: 'rgba(0,0,255,0.7)',
            collide: getReferenceDefaultMarkerValue('allow-overlap'),
            size: getReferenceDefaultMarkerValue('width'),
            blend: 'overlay',
            outlineColor: 'rgba(0,0,0,0.7)',
            outlineSize: getReferenceDefaultMarkerValue('stroke-width')
        }
    },
    {
        name: 'additive blending',
        ccss: `
          #layer{
            marker-comp-op: plus;
        }
          `,
        feature: { a: 3 },
        expected: {
            color: getReferenceDefaultMarkerValue('fill'),
            collide: getReferenceDefaultMarkerValue('allow-overlap'),
            size: getReferenceDefaultMarkerValue('width'),
            blend: 'add',
            outlineColor: getReferenceDefaultMarkerValue('stroke'),
            outlineSize: getReferenceDefaultMarkerValue('stroke-width')
        }
    }
    //TODO Test complex case

];

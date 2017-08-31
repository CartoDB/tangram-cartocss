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
  }

  ,
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
  }
  ,
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
  }

  ,
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
  }

  ,
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
      feature: { a: 0, b:0 },
      expected: {
          color: 'rgba(255,255,255,0.5)',
          collide: getReferenceDefaultMarkerValue('allow-overlap'),
          size: getReferenceDefaultMarkerValue('width'),
          blend: 'overlay',
          outlineColor: 'rgba(0,0,0,0.5)',
          outlineSize: getReferenceDefaultMarkerValue('stroke-width')
      }
  }

  //TODO Test opacity overrides opacity-outline & opacity-fill

  //TODO Test plus (blending)

  //TODO Test unsupported

  //TODO Test complex
];

const COND_REGEX = /\[.*\]/g;
const COND_VALUES_REGEX = /\[\s*(\w*)\s*([=<>])\s*(?:'|")*([\d\.]*|\w*|[A-zÁ-á '\-]*)(?:'|")*\s*\]/g;

const extractLayerData = function extractLayerData( cartocss ) {
    return cartocss.substring( cartocss.indexOf( '{' ) + 1, searchEndBlock( cartocss ) - 1 );
};

const searchStartBlock = function searchStartBlock( cartocss, pass = 0 ) {
    return cartocss.substr( pass ).search( COND_REGEX );
};

const searchEndBlock = function searchEndBlock( cartocss, pass = 0 ) {
    let open = 0,
        close = 0,
        it = 0;

    do {
        let pos = cartocss.substr( pass ).search( /[\}\{]/g );

        if ( cartocss.substr( pass ).charAt( pos ) === '{' ) {
            open++;
        } else {
            close++;
        }
        pass = pass + pos + 1;
        it++;
    } while ( open !== close && it < 50 );

    return pass;
}

const extractCondition = function extractCondition( cartocss ) {
    let cond = cartocss.match( COND_REGEX ),
        values = COND_VALUES_REGEX.exec( cond[ 0 ] );


    if ( values && values.length > 1 ) {
        let res = {
            attr: values[ 1 ],
            cond: values[ 2 ],
            val: values[ 3 ].search( /[A-z]/g ) >= 0 ? `"${values[3]}"` : values[ 3 ]
        };
        return res.cond ? 'feature.' + res.attr + ( res.cond === '=' ? ' === ' : res.cond ) + res.val : 'feature.' + res.attr;
    }

    return '';
};

const extractContentBlocks = function extractContentBlocks( cartocss, type, extract ) {
    let blocks = [],
        conditions = [],
        start = searchStartBlock( cartocss, 0 ),
        subcartocss = cartocss,
        condition = [];

    while ( start >= 0 ) {
        let end = searchEndBlock( subcartocss, start );

        if ( start === end ) break;

        condition.push( extractCondition( subcartocss ) );

        let block = subcartocss.substring( subcartocss.indexOf( '{' ) + 1, end - 1 );

        conditions.push( extractContentBlocks( block, type, extract ) );


        subcartocss = subcartocss.substring( 0, start ) + subcartocss.substring( end, subcartocss.length );

        start = searchStartBlock( subcartocss, 0 );
    }
    let cond = extract( subcartocss, type ).replace( /[\n\s]/g, '' );

    cond = cond && cond !== '""'? ` toRet = ${cond}; ` : '';

    for ( var i = 0; i < conditions.length; i++ ) {
        if ( condition[ i ] && conditions[ i ] ) {
            cond += ` if (${condition[i]}) { ${conditions[i]} }`;
        }
    }

    if ( cond ) {
        return cond;
    } else {
        let val = extract( subcartocss, type ).replace( /[\n\s]/g, '' );

        return val && val !== '""' ? 'toRet = ' + val + ';' : null;
    }
};

const generateConditional = function generateConditional( cartocss ) {
    let cond = cartocss.match( /[]/g )
};

const extractColor = function extractColor( cartocss, type ) {
    let matchs = new RegExp( '(?:' + type + '-(?:fill|color):)([^;]*)', 'g' ).exec( cartocss ),
        color = matchs ? `"${matchs[ 1 ]}"` : `"#AA0000"`;

    return color;
};

const extractSize = function extractSize( cartocss, type ) {
    let matchs = new RegExp( '(?:' + type + '-width:)([^;]*)', 'g' ).exec( cartocss ),
        size = matchs ? `${matchs[ 1 ]}` : '';

    return size;
}

const extractWidth = function extractWidth( cartocss, type ) {
    let size = extractSize(cartocss, type);

    return `${size}`;
}

const extract = {
  color: extractColor,
  size: extractSize,
  width: extractWidth
};

const existType = function existType( cartocss, type ) {
  if ( cartocss ) {
    return cartocss.match( new RegExp( type + '-\\w*:', 'g' ) );
  }
};

const parseCSS = function parseCSS( cartocss, type, feature ) {
  let layer = extractLayerData( cartocss ),
      fn = extract[feature],
      content = extractContentBlocks( layer, type, fn );

  return content ? 'function () { var toRet = null; ' + content + ' return toRet;}' : '';

};

const getDrawFromCSS = function getDrawFromCSS( css ) {
    let draw = {};
    [ 'polygon', 'marker', 'line' ].forEach( function( type ) {
        if ( existType( css, type ) ) {
            let field = type === 'marker' ? 'points' : type + 's';

            draw[ field ] = {
                color: parseCSS( css, type, 'color' ),
                size: parseCSS( css, type, 'size' ),
                width: '3px'//parseCSS( css, type, 'width' )
            };
        }
    } );

    return draw;
};

var CSS;

export default CSS = {
    getDrawFromCSS
};

var Utils;

export default Utils = {};

Utils.io = function( url, timeout = 60000, responseType = 'text', method = 'GET', headers = {} ) {
    var request = new XMLHttpRequest();
    var promise = new Promise( ( resolve, reject ) => {
        request.open( method, url, true );
        request.timeout = timeout;
        request.responseType = responseType;
        request.onload = () => {
            if ( request.status === 200 ) {
                if ( [ 'text', 'json' ].indexOf( request.responseType ) > -1 ) {
                    resolve( request.responseText );
                } else {
                    resolve( request.response );
                }
            } else {
                reject( Error( 'Request error with a status of ' + request.statusText ) );
            }
        };
        request.onerror = ( evt ) => {
            reject( Error( 'There was a network error' + evt.toString() ) );
        };
        request.ontimeout = ( evt ) => {
            reject( Error( 'timeout ' + evt.toString() ) );
        };
        request.send();
    } );

    Object.defineProperty( promise, 'request', {
        value: request
    } );

    return promise;
};

Utils.spawn = function spawn( generatorFunc ) {
    function continuer( verb, arg ) {
        var result;
        try {
            result = generator[ verb ]( arg );
        } catch ( err ) {
            return Promise.reject( err );
        }
        if ( result.done ) {
            return result.value;
        } else {
            return Promise.resolve( result.value ).then( onFulfilled, onRejected );
        }
    }
    var generator = generatorFunc();
    var onFulfilled = continuer.bind( continuer, "next" );
    var onRejected = continuer.bind( continuer, "throw" );
    return onFulfilled();
};

Utils.generateBlobFile = function( string ) {
    return URL.createObjectURL( new Blob( [ string ] ) );
};

Utils.jsonp = function( url, callback ) {
    var callbackName = 'jsonp_callback_' + Math.round( 100000 * Math.random() );
    window[ callbackName ] = function( data ) {
        delete window[ callbackName ];
        document.body.removeChild( script );
        callback( data );
    };

    var script = document.createElement( 'script' );
    script.src = url + ( url.indexOf( '?' ) >= 0 ? '&' : '?' ) + 'callback=' + callbackName;
    document.body.appendChild( script );
};

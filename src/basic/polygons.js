/*
 ________  ________  ___           ___    ___ ________  ________  ________   ________      
|\   __  \|\   __  \|\  \         |\  \  /  /|\   ____\|\   __  \|\   ___  \|\   ____\     
\ \  \|\  \ \  \|\  \ \  \        \ \  \/  / | \  \___|\ \  \|\  \ \  \\ \  \ \  \___|_    
 \ \   ____\ \  \\\  \ \  \        \ \    / / \ \  \  __\ \  \\\  \ \  \\ \  \ \_____  \   
  \ \  \___|\ \  \\\  \ \  \____    \/  /  /   \ \  \|\  \ \  \\\  \ \  \\ \  \|____|\  \  
   \ \__\    \ \_______\ \_______\__/  / /      \ \_______\ \_______\ \__\\ \__\____\_\  \ 
    \|__|     \|_______|\|_______|\___/ /        \|_______|\|_______|\|__| \|__|\_________\
                                 \|___|/                                       \|_________|
                                                                                           
 */

/*
	EXTERNAL DEPENDENCIES
 */
// import MD5 from 'md5'; // NOTE: used when we support textures.

/*
	INTERNAL DEPENDENCIES
 */

import BH from './helpers';
import Utils from '../utils/utils';
import TR from '../utils/reference';
import Colors from '../style/colors';

const PR = TR.getPolygon(); // Polygon reference

/*
	INTERNAL POLYGONS FUNCTIONS
 */

const getPolygonAlpha = function(c3ss) {
	let alpha = c3ss[PR['fill-opacity'].css] || BH.defaultAlpha(PR, 'polygon'); // NOTE: improve the way of getting this. (functional)

	if (alpha) {
		return Utils.buildCCSSFn(alpha.js).toString();
	}
};

const getPolygonColor = function(c3ss) {
	return c3ss[PR.fill.css] || BH.defaultColor(PR, 'polygon');
};

const getColor = function (c3ss) {
	const alpha = getPolygonAlpha(c3ss);
	const color = getPolygonColor(c3ss);

	return {
		color: Colors.getAlphaColor(
				Utils.buildCCSSFn(color.js),
				alpha
			)
	};
};


/**
 * Basic Polygon
 */

var Polygon = {};

export default Polygon;

Polygon.getDraw = function(c3ss) {
	let polygon = {};

	if (TR.checkSymbolizer(c3ss, 'polygon')) {
		Object.assign(
				polygon,
				getColor(c3ss)
			);

	}

	return { polygons_blend: polygon };
};


Polygon.getStyle = function() {
	let style = {
		polygons_blend: {
			base: 'polygons',
			blend: 'overlay'
		}
	};

	// NOTE: this no makes sense actually.
	// if (TR.checkSymbolizer(c3ss, 'polygons')) {
	// 	Object.assign(
	// 			style.polygons_blend
	// 		);
	// };

	return style;
};

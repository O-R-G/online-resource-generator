var colorOptions = {
	'blue': {
		'name': 'blue',
		'color':  {
			'type': 'solid',
			'code': '#00f'
		}
	},
	'green': {
		'name': 'green',
		'color':  {
			'type': 'solid',
			'code': '#090'
		}
	},
	'yellow': {
		'name': 'yellow',
		'color':  {
			'type': 'solid',
			'code': '#ff0'
		}
	},
	'red': {
		'name': 'red',
		'color':  {
			'type': 'solid',
			'code': '#f00'
		}
	},
	'purple': {
		'name': 'purple',
		'color':  {
			'type': 'solid',
			'code': '#6600FF'
		}
	},
	'dark grey': {
		'name': 'dark grey',
		'color':  {
			'type': 'solid',
			'code': '#222'
		}
	},
	'black': {
		'name': 'black',
		'color':  {
			'type': 'solid',
			'code': '#000'
		}
	},
	'grass': {
		'name': 'grass',
		'color':  {
			'type': 'gradient',
		    'code': ['#030', '#ad0', '#030'],
			'angle': 45
		}
	},
	'gold': {
		'name': 'gold',
		'color':  {
			'type': 'gradient',
			'code': ['#F30', '#FC0', '#F30'],
			'angle': 45
		}
	},
	'plum': {
		'name': 'plum',
		'color':  {
			'type': 'gradient',
			'code': ['#03F', '#C03', '#03F'],
			'angle': 45
		}
	},
	'sunset': {
		'name': 'sunset',
		'color':  {
			'type': 'gradient',
			'code': ['#F90', '#C30', '#F90'],
			'angle': 45
		}
	},
	'r-to-b': {
		'name': 'r-to-b',
		'color':  {
			'type': 'gradient',
			'code': ['#f00', '#00f']
		}
	},
	'animate-bg-color-r-to-b': {
		'name': 'animate-bg-color-r-to-b',
		'color': {
			'type': 'animation',
			'animation-type': 'color',
			'begin': {
				'type': 'solid',
				'code': '255,0,0'
			},
			'end': {
				'type': 'solid',
				'code': '0,0,255'
			},
			'duration': 4500
		}
	},
	'animate-bg-color-p-to-b': {
		'name': 'animate-bg-color-p-to-b',
		'color': {
			'type': 'animation',
			'animation-type': 'color',
			'begin': {
				'type': 'solid',
				'code': '255,0,255'
			},
			'end': {
				'type': 'solid',
				'code': '0,0,255'
			},
			'duration': 4500
		}
	},
	'animate-bg-color-g-to-g': {
		'name': 'animate-bg-color-g-to-g',
		'color': {
			'type': 'animation',
			'animation-type': 'color',
			'begin': {
				'type': 'solid',
				'code': '0,153,0'
			},
			'end': {
				'type': 'solid',
				'code': '0,204,0'
			},
			'duration': 2000
		}
	},
	'animate-gradient-r-to-b': {
		'name': 'animate-gradient-r-to-b',
		'color': {
			'type': 'animation',
			'animation-type': 'position',
			'color':  {
				'type': 'gradient',
				'code': ['#f00', '#00f']
			},
			'begin': {
				x0: 0.0,
		        y0: -1.5,
		        x1: 0.0,
		        y1: 1.0
			},
			'end': {
				x0: -0.8,
	            y0: 0.5,
	            x1: -0.8,
	            y1: 3.5
			},
			'duration': 5000
		}
	},
	'animate-gradient-p-to-b': {
		'name': 'animate-gradient-p-to-b',
		'color': {
			'type': 'animation',
			'animation-type': 'position',
			'color':  {
				'type': 'gradient',
				'code': ['#f0f', '#00f']
			},
			'begin': {
				x0: 0.0,
		        y0: -1.5,
		        x1: 0.0,
		        y1: 1.0
			},
			'end': {
				x0: -0.8,
	            y0: 0.5,
	            x1: -0.8,
	            y1: 3.5
			},
			'duration': 5000
		}
	},
	'blue-red-1': {
		'name': 'blue-red (8)',
		'color':{
			'type': 'special',
			'colorName': 'blue-red-8',
			'code': ['#ff0000', '#0000ff'],
			'size': 8
		}
	},
	'blue-red-2': {
		'name': 'blue-red (20)',
		'color':{
			'type': 'special',
			'colorName': 'blue-red-20',
			'code': ['#ff0000', '#0000ff'],
			'size': 20
		}
	}
	,
	'blue-red-3': {
		'name': 'blue-red (40)',
		'color':{
			'type': 'special',
			'colorName': 'blue-red-40',
			'code': ['#ff0000', '#0000ff'],
			'size': 40
		}
	}
};
var threeColorOptions = {
	'blue': {
		'name': 'blue',
		'color':  {
			'type': 'solid',
			'code': '#00f'
		}
	},
	'green': {
		'name': 'green',
		'color':  {
			'type': 'solid',
			'code': '#090'
		}
	},
	'yellow': {
		'name': 'yellow',
		'color':  {
			'type': 'solid',
			'code': '#ff0'
		}
	},
	'red': {
		'name': 'red',
		'color':  {
			'type': 'solid',
			'code': '#f00'
		}
	},
	'purple': {
		'name': 'purple',
		'color':  {
			'type': 'solid',
			'code': '#6600FF'
		}
	},
	'dark grey': {
		'name': 'dark grey',
		'color':  {
			'type': 'solid',
			'code': '#222'
		}
	},
	'black': {
		'name': 'black',
		'color':  {
			'type': 'solid',
			'code': '#000'
		}
	},
	'grass': {
		'name': 'grass',
		'color':  {
			'type': 'gradient',
		    'code': ['#030', '#ad0', '#030'],
			'angle': 45
		}
	},
	'gold': {
		'name': 'gold',
		'color':  {
			'type': 'gradient',
			'code': ['#F30', '#FC0', '#F30'],
			'angle': 45
		}
	},
	'plum': {
		'name': 'plum',
		'color':  {
			'type': 'gradient',
			'code': ['#03F', '#C03', '#03F'],
			'angle': 45
		}
	},
	'sunset': {
		'name': 'sunset',
		'color':  {
			'type': 'gradient',
			'code': ['#F90', '#C30', '#F90'],
			'angle': 45
		}
	},
	// 'blue-red-1': {
	// 	'name': 'blue-red (8)',
	// 	'color':{
	// 		'type': 'special',
	// 		'colorName': 'blue-red-8',
	// 		'code': ['#ff0000', '#0000ff'],
	// 		'size': 8
	// 	}
	// },
};
var textColorOptions = {	
	'white': {
		'name': 'white',
		'color':  {
			'type': 'solid',
			'code': '#ffffff'
		}
	},
	'black': {
		'name': 'black',
		'color':  {
			'type': 'solid',
			'code': '#000000'
		}
	},
	'blue': {
		'name': 'blue',
		'color':  {
			'type': 'solid',
			'code': '#0000ff'
		}
	},
	'red': {
		'name': 'red',
		'color':  {
			'type': 'solid',
			'code': '#ff0000'
		}
	},
	'green': {
		'name': 'green',
		'color':  {
			'type': 'solid',
			'code': '#00ff00'
		}
	},
	'light green': {
		'name': 'light green',
		'color':  {
			'type': 'solid',
			'code': '#c5ff00'
		}
	},
	'dark green': {
		'name': 'dark green',
		'color':  {
			'type': 'solid',
			'code': '#1c4700'
		}
	},
	'yellow': {
		'name': 'yellow',
		'color':  {
			'type': 'solid',
			'code': '#ffc200'
		}
	},
	'purple': {
		'name': 'purple',
		'color':  {
			'type': 'solid',
			'code': '#750075'
		}
	},
	'orange': {
		'name': 'orange',
		'color':  {
			'type': 'solid',
			'code': '#fe4101'
		}
	},
	'50-white': {
		'name': '50% white',
		'color':  {
			'type': 'transparent',
			'opacity': 0.5,
			'code': 'rgb(255, 255, 255)'
		}
	},
	'dark grey': {
		'name': 'dark grey',
		'color':  {
			'type': 'solid',
			'code': '#222'
		}
	}
};
var textPositionOptions = {
	'align-left': {
		'name': 'align left',
		'value': 'align-left'
	},
	'center': {
		'name': 'center',
		'value': 'center'
	}
}

var shapeOptions = {
	'rounded-less': {
		'name': 'rounded-less',
		'shape': {
			'type': 'static',
			'base': 'rectangle',
			'padding': 50,
			'cornerRadius': 50,
			'innerPadding': [45],
			'watermarkPositions': 'all'
		}
	},
	'rounded-medium': {
		'name': 'rounded-medium',
		'shape': {
			'type': 'static',
			'base': 'rectangle',
			'padding': 50,
			'cornerRadius': 100,
			'innerPadding': [70, 55],
			'watermarkPositions': 'all'
		}
	},
	'rounded': {
		'name': 'rounded',
		'shape': {
			'type': 'static',
			'base': 'rectangle',
			'padding': 50,
			'cornerRadius': 200,
			'innerPadding': [110, 80],
			'watermarkPositions': 'all'
		}
	},
	'triangle': {
		'name': 'triangle',
		'shape': {
			'type': 'static',
			'base': 'triangle',
			'padding': -20,
			'cornerRadius': 180,
			'innerPadding': [140, 50],
			'watermarkPositions': ['bottom-left', 'bottom-center', 'bottom-right']
		}
	},
	'hexagon': {
		'name': 'hexagon',
		'shape': {
			'type': 'static',
			'base': 'hexagon',
			'padding': 20,
			'cornerRadius': 60,
			'innerPadding': [50],
			'watermarkPositions': 'all'
		}
	},
	'circle': {
		'name': 'circle',
		'shape': {
			'type': 'static',
			'base': 'circle',
			'padding': 40,
			'cornerRadius': false,
			'innerPadding': [40],
			'watermarkPositions': ['middle-left', 'middle-right']
		}
	},
	'rounded-corners': {
		'name': 'rounded-corners',
		'shape': {
			'type': 'animation',
			'base': 'rectangle',
			'animation-type': 'corner',
			'padding': 40,
			'cornerRadius': 50,
			'innerPadding': [140, 70],
			'begin': {
                r: 50
            },
            'current': {
                r: 50
            },
            'end': {
                r: 200
            },
            'duration': 5000,
			'watermarkPositions': 'all'
		}
	},
	'fill': {
		'name': 'fill',
		'shape': {
			'type': 'static',
			'base': 'fill',
			'padding': 0,
			'cornerRadius': 0,
			'innerPadding': [13.32],
			'watermarkPositions': 'all'
		}

	},
};

var fontOptions = {
	'34': {
		name: 'small',
        lineHeight: '44',
        letterSpacing: '0'
    },
	'54': {
    	name: 'medium-small',
        lineHeight: '60',
        letterSpacing: '-1'
    },
    '80': {
    	name: 'medium',
        lineHeight: '80',
        letterSpacing: '-1'
    },
    '160': {
    	name: 'large',
        lineHeight: '160',
        letterSpacing: '-4'
    }
};

var baseOptions = {
	'#000000': {
    	name: 'black',
    	color: {
        	type: 'solid',
        	code: '#000000'
        }
    },
	'#666060': {
		name: 'grey',
		color: {
        	type: 'solid',
        	code: '#666060'
        }
    },
    '#ff0000': {
    	name: 'red',
    	color: {
        	type: 'solid',
        	code: '#ff0000'
        }
    },
    '#00ff00': {
    	name: 'green',
    	color: {
        	type: 'solid',
        	code: '#00ff00'
        }
    },
    '#0000ff': {
    	name: 'blue',
    	color: {
        	type: 'solid',
        	code: '#0000ff'
        }
    }
};

var animationOptions = {
	'none': {
		name: 'none'
	},
	'flip': {
		name: 'flip'
	},
	// 'flip-ease': {
	// 	name: 'flip (ease out)'
	// },
	'spin': {
		name: 'spin'
	},
	// 'spin-ease': {
	// 	name: 'spin (ease out)'
	// },
	'rest-front': {
		name: 'rest (front)'
	},
	'rest-back-flip': {
		name: 'rest (back, flip)'
	},
	'rest-back-spin': {
		name: 'rest (back, spin)'
	}
};

var watermarkColorOptions = {
	'white': {
		'name': 'white',
		'color':  {
			'type': 'solid',
			'code': '#fff'
		}
	},
	'50-white': {
		'name': '50% white',
		'color':  {
			'type': 'transparent',
			'opacity': 0.5,
			'code': 'rgb(255, 255, 255)'
		}
	},
	'blue': {
		'name': 'blue',
		'color':  {
			'type': 'solid',
			'code': '#00f'
		}
	},
	'yellow': {
		'name': 'yellow',
		'color':  {
			'type': 'solid',
			'code': '#ff0'
		}
	},
	'red': {
		'name': 'red',
		'color':  {
			'type': 'solid',
			'code': '#f00'
		}
	},
	'green': {
		'name': 'green',
		'color':  {
			'type': 'solid',
			'code': '#090'
		}
	},
	'dark grey': {
		'name': 'dark grey',
		'color':  {
			'type': 'solid',
			'code': '#222'
		}
	}
};

var watermarkPositionOptions = {
	'top-left': {
		name: 'top-left'
	},
	'top-center': {
		name: 'top-center'
	},
	'top-right': {
		name: 'top-right'
	},
	'middle-left': {
		name: 'middle-left'
	},
	'middle-right': {
		name: 'middle-right'
	},
	'bottom-left': {
		name: 'bottom-left'
	},
	'bottom-center': {
		name: 'bottom-center'
	},
	'bottom-right': {
		name: 'bottom-right'
	}
};

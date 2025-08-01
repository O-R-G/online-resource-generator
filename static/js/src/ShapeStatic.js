import MediaStatic from './MediaStatic.js'
import Shape from "./Shape.js";
import { generateFieldId } from './utils/lib.js';

export default class ShapeStatic extends Shape {
	constructor(prefix = '', canvasObj, options, format, shape_index=0){
		super(prefix, canvasObj, options, format, shape_index);

		this.colorData = this.getDefaultOption(this.options.colorOptions);
		this.colorData = this.colorData.color;
		this.color = this.colorData.code;
		this.colorPattern = null;
		this.textColor = null;
        for(let prop in this.options.textColorOptions) {
            if(this.options.textColorOptions[prop]['default']) this.textColor = this.options.textColorOptions[prop].color.code;
        }
        if(!this.textColor) this.textColor = Object.values(this.options.textColorOptions)[0].color.code;
		this.textPosition = null;
        for(let prop in this.options.textPositionOptions) {
            if(this.options.textPositionOptions[prop]['default']) this.textPosition = this.options.textPositionOptions[prop].value;
        }
        if(!this.textPosition) this.textPosition = Object.values(this.options.textPositionOptions)[0].value;

		this.typography = this.getDefaultOption(this.options.typographyOptions);
		this.fontStyle = '';
		this.textShiftX = 0;
		this.textShiftY = 0;
		this.timer_color = null;
		this.timer_position = null;
		this.timer_shape = null;
		this.customGraphic = [];
		this.initRecording = false;
		
		if(this.options.colorOptions['upload']) {
			const key = 'background-image';
			this.media['background-image'] = this.initMedia(key, {isShapeColor: true, 'fit': 'cover'});
		}
	}
	init(canvasObj) {
		super.init(canvasObj);
		this.canvas = canvasObj.canvas;
		this.context = this.canvas.getContext("2d");
		this.updateCanvasSize();
		this.shapeCenter.x = this.frame.x + this.frame.w / 2 + this.shapeShiftX;
	    this.shapeCenter.y = this.frame.y + this.frame.h / 2 + this.shapeShiftY;
		this.control.classList.add('static-shape-control');
		this.renderControl();
	    this.addListeners();
	    this.updateShape(this.shape, true);
		this.preWrite();
	}
	updateCanvasSize() {
		this.canvasW = this.canvas.width;
		this.canvasH = this.canvas.height;
	}
	addCounterpart(obj) {
		super.addCounterpart(obj);
		this.setFieldCounterparts();
	}
	setFieldCounterparts(){
		/* 
			the prop names are static field names 
			the values are animated field names
		*/
		this.fieldCounterparts['shape'] = 'shape';
		this.fieldCounterparts['shape-shift-x'] = 'shape-shift-x';
		this.fieldCounterparts['shape-shift-y'] = 'shape-shift-y';
		this.fieldCounterparts['animation'] = 'animation';
		this.fieldCounterparts['text'] = 'text-front';
		this.fieldCounterparts['text-position'] = 'text-front-position';
		this.fieldCounterparts['text-font'] = 'text-front-font';
		this.fieldCounterparts['text-color'] = 'text-front-color';
		this.fieldCounterparts['text-typography'] = 'text-front-typography';
		this.fieldCounterparts['text-shift-x'] = 'text-front-shift-x';
		this.fieldCounterparts['text-shift-y'] = 'text-front-shift-y';
		this.fieldCounterparts['shape-color'] = 'shape-front-color';
		this.fieldCounterparts['background-image'] = 'front-background-image';
		this.fieldCounterparts['background-image-scale'] = 'front-background-image-scale';
		this.fieldCounterparts['background-image-shift-x'] = 'front-background-image-shift-x';
		this.fieldCounterparts['background-image-shift-y'] = 'front-background-image-shift-y';
	}
	updateShape(shape, silent = false){
		if(shape['type'] == 'static') super.updateShape(shape);
		else if(shape['type'] == 'animation')
		{
			if(shape['animation-type'] == 'corner')
                this.animate(this.color, shape);
		}
		this.shape = shape;
		if(!silent) this.canvasObj.draw();
	}
	processStaticColorData(colorData) {
		if(colorData.type == 'solid') return colorData.code;
		else if(colorData.type == 'transparent')
		{	
			let output = colorData.code;
			if(output.indexOf('rgba') == -1) {
				output = output.replace('rgb', 'rgba');
				output = output.replace(')', ',' + colorData.opacity);
			}
			return output;
		}
		else if(colorData.type == 'gradient'){
			if(colorData.angle == null) {
				var output = this.context.createLinearGradient(this.canvasW/2, 0, this.canvasW/2, this.canvasH);
			}
			else if(colorData.angle == 45) {
				if(this.shape.base === 'diamond') {
					var output = this.context.createLinearGradient(this.shapeCenter.x - this.frame.w / 3, this.shapeCenter.y + this.frame.w / 3, this.shapeCenter.x + this.frame.w / 3, this.shapeCenter.y - this.frame.w / 3);
				}else {
					var output = this.context.createLinearGradient(0, this.canvasH, this.canvasW, 0);
				}
			}
			for(var i = 0; i < colorData.code.length; i++) {
				let this_pos = i * 1 / (colorData.code.length - 1);
				output.addColorStop(this_pos, colorData.code[i]);
			}

            return output;
		}
	}
	updateColor(colorData, silent = false){
		this.colorData = colorData;
		if( colorData['type'] == 'solid' || 
            colorData['type'] == 'gradient')
        {

            this.shapeMethod = 'draw';
			if(this.timer_color !== null)
			{
				clearInterval(this.timer_color);
				this.timer_color = null;
			}
			if(this.timer_position !== null)
			{
				clearInterval(this.timer_position);
				this.timer_position = null;
			}
			this.color = this.processStaticColorData(colorData);
			if(!silent) this.canvasObj.draw();
        }
        else if(colorData['type'] == 'animation')
        {
        	if(!silent) this.animate(this.colorData);
        }
        else if(colorData['type'] == 'special')
        {
            this.updateSpecialColor(this.colorData);
            if(!silent) this.canvasObj.draw();
        }
	}
	updateSpecialColor(colorData, silent = false){

		this.shapeMethod = 'draw';
		if(this.timer_color !== null)
		{
			clearInterval(this.timer_color);
			this.timer_color = null;
		}
		if(this.timer_position !== null)
		{
			clearInterval(this.timer_position);
			this.timer_position = null;
		}

		this.shapeMethod = 'clip';
		// this.color = color;
		if(!silent) this.canvasObj.draw();
		
	}
	fillColorByShape(colorData){
		if(colorData['colorName'].includes('blue-red') )
		{
			// this.shapeMethod = 'clip';
			// this.canvasObj.draw();
            let size = colorData['size'];
            let w = this.canvasW;
            let h = this.canvasH;
            let i_range = h / size;
            let j_range = w / size;
            for(var i = 0; i < i_range ; i++)
            {
                for(var j = 0; j < j_range; j++)
                {
                    if(i % 2 == 0)
                    {
                        if(j % 2 == 0)
                            this.context.fillStyle = '#ff0000';
                        else
                            this.context.fillStyle = '#0000ff';
                    }
                    else
                    {
                        if(j % 2 == 0)
                            this.context.fillStyle = '#0000ff';
                        else
                            this.context.fillStyle = '#ff0000';
                    }
                    this.context.fillRect(j * size, i * size, size, size);
                    
                }
            }
		}
	}

	initColorAnimation(animationData){
		this.animation_color_data = animationData;
		this.animation_color_data.isForward = true;
		this.animation_color_data.current = {};
		let end_temp = this.animation_color_data.end.code.split(',');
		this.animation_color_data.end.red = parseFloat(end_temp[0]);
		this.animation_color_data.end.green = parseFloat(end_temp[1]);
		this.animation_color_data.end.blue = parseFloat(end_temp[2]);
		let begin_temp = this.animation_color_data.begin.code.split(',');
		this.animation_color_data.begin.red = parseFloat(begin_temp[0]);
		this.animation_color_data.begin.green = parseFloat(begin_temp[1]);
		this.animation_color_data.begin.blue = parseFloat(begin_temp[2]);
		this.animation_color_data.current.red = parseFloat(begin_temp[0]);
		this.animation_color_data.current.green = parseFloat(begin_temp[1]);
		this.animation_color_data.current.blue = parseFloat(begin_temp[2]);
        this.animation_color_data.interval = {};
        this.animation_color_data.interval.red = Math.round(((this.animation_color_data.end.red - this.animation_color_data.current.red) / (this.framerate * this.animation_color_data.duration/1000)) * 10)/10;
        this.animation_color_data.interval.green = Math.round(((this.animation_color_data.end.green - this.animation_color_data.current.green) / (this.framerate * this.animation_color_data.duration/1000)) * 10)/10;
        this.animation_color_data.interval.blue = Math.round(((this.animation_color_data.end.blue - this.animation_color_data.current.blue) / (this.framerate * this.animation_color_data.duration/1000)) * 10)/10;
        this.animation_color_data.isForward = true;
        if(this.timer_color != null)
        {
        	clearInterval(this.timer_color);
        	this.timer_color = null;
        }
        if(this.timer_position != null)
        {
        	clearInterval(this.timer_position);
        	this.timer_position = null;
        }
        this.timer_color = setInterval( this.updateColorAnimation.bind(this), 1000 / this.framerate);
    }

    updateColorAnimation(){
    	if(this.animation_color_data.isForward) {
            // forward
            this.animation_color_data.current.red += this.animation_color_data.interval.red;
            this.animation_color_data.current.green += this.animation_color_data.interval.green;
            this.animation_color_data.current.blue += this.animation_color_data.interval.blue;
            if( (this.animation_color_data.interval.red > 0 && (this.animation_color_data.current.red >= this.animation_color_data.end.red)) ||
                (this.animation_color_data.interval.red < 0 && (this.animation_color_data.current.red <= this.animation_color_data.end.red)) ||
                (this.animation_color_data.interval.green > 0 && (this.animation_color_data.current.green >= this.animation_color_data.end.green)) ||
                (this.animation_color_data.interval.green < 0 && (this.animation_color_data.current.green <= this.animation_color_data.end.green)) ||
                (this.animation_color_data.interval.blue > 0 && (this.animation_color_data.current.blue >= this.animation_color_data.end.blue)) ||
                (this.animation_color_data.interval.blue < 0 && (this.animation_color_data.current.blue <= this.animation_color_data.end.blue))
            ){
                this.animation_color_data.isForward = !this.animation_color_data.isForward;
            }
        } else {
            // backward
            this.animation_color_data.current.red -= this.animation_color_data.interval.red;
            this.animation_color_data.current.green -= this.animation_color_data.interval.green;
            this.animation_color_data.current.blue -= this.animation_color_data.interval.blue;
            if( (this.animation_color_data.interval.red > 0 && (this.animation_color_data.current.red <= this.animation_color_data.begin.red)) ||
                (this.animation_color_data.interval.red < 0 && (this.animation_color_data.current.red >= this.animation_color_data.begin.red)) ||
                (this.animation_color_data.interval.green > 0 && (this.animation_color_data.current.green <= this.animation_color_data.begin.green)) ||
                (this.animation_color_data.interval.green < 0 && (this.animation_color_data.current.green >= this.animation_color_data.begin.green)) ||
                (this.animation_color_data.interval.blue > 0 && (this.animation_color_data.current.blue <= this.animation_color_data.begin.blue)) ||
                (this.animation_color_data.interval.blue < 0 && (this.animation_color_data.current.blue >= this.animation_color_data.begin.blue))
            ){
				if(this.canvasObj.isRecording) {
					console.log('saving...');
					this.canvasObj.saveCanvasAsVideo();
				}
                this.animation_color_data.isForward = !this.animation_color_data.isForward;
            	
            }
        }
        this.color = "rgb(" + this.animation_color_data.current.red + "," + this.animation_color_data.current.green + "," + this.animation_color_data.current.blue + ")";
        this.draw();
    }
    initPositionAnimation(animationData){
		this.animation_position_data = animationData;
		this.animation_position_data.isForward = true;
		this.animation_position_data.current = {};
		this.animation_position_data.current.x0 = this.animation_position_data.begin.x0;
		this.animation_position_data.current.y0 = this.animation_position_data.begin.y0;
		this.animation_position_data.current.x1 = this.animation_position_data.begin.x1;
		this.animation_position_data.current.y1 = this.animation_position_data.begin.y1;
	    this.animation_position_data.interval = {};
	    this.animation_position_data.interval.x0 = Math.round(((this.animation_position_data.end.x0 - this.animation_position_data.current.x0) / (this.framerate * this.animation_position_data.duration/1000)) * 1000)/1000;
	    this.animation_position_data.interval.y0 = Math.round(((this.animation_position_data.end.y0 - this.animation_position_data.current.y0) / (this.framerate * this.animation_position_data.duration/1000)) * 1000)/1000;
	    this.animation_position_data.interval.x1 = Math.round(((this.animation_position_data.end.x1 - this.animation_position_data.current.x1) / (this.framerate * this.animation_position_data.duration/1000)) * 1000)/1000;
	    this.animation_position_data.interval.y1 = Math.round(((this.animation_position_data.end.y1 - this.animation_position_data.current.y1) / (this.framerate * this.animation_position_data.duration/1000)) * 1000)/1000;
	    if(this.timer_position != null)
        {
        	clearInterval(this.timer_position);
        	this.timer_position = null;
        }
        if(this.timer_color != null)
        {
        	clearInterval(this.timer_color);
        	this.timer_color = null;
        }
	    this.timer_position = setInterval( this.updatePositionAnimation.bind(this), 1000 / this.framerate);
	}
    updatePositionAnimation(){
	    if(this.animation_position_data.isForward) {
	        // forward
	        this.animation_position_data.current.x0 += this.animation_position_data.interval.x0;
	        this.animation_position_data.current.y0 += this.animation_position_data.interval.y0;
	        this.animation_position_data.current.x1 += this.animation_position_data.interval.x1;
	        this.animation_position_data.current.y1 += this.animation_position_data.interval.y1;
	        if( (this.animation_position_data.interval.x0 > 0 && (this.animation_position_data.current.x0 >= this.animation_position_data.end.x0)) ||
	            (this.animation_position_data.interval.x0 < 0 && (this.animation_position_data.current.x0 <= this.animation_position_data.end.x0)) ||
	            (this.animation_position_data.interval.y0 > 0 && (this.animation_position_data.current.y0 >= this.animation_position_data.end.y0)) ||
	            (this.animation_position_data.interval.y0 < 0 && (this.animation_position_data.current.y0 <= this.animation_position_data.end.y0)) ||
	            (this.animation_position_data.interval.x1 > 0 && (this.animation_position_data.current.x1 >= this.animation_position_data.end.x1)) ||
	            (this.animation_position_data.interval.x1 < 0 && (this.animation_position_data.current.x1 <= this.animation_position_data.end.x1)) ||
	            (this.animation_position_data.interval.y1 > 0 && (this.animation_position_data.current.y1 >= this.animation_position_data.end.y1)) ||
	            (this.animation_position_data.interval.y1 < 0 && (this.animation_position_data.current.y1 <= this.animation_position_data.end.y1))
	        ){
	            this.animation_position_data.isForward = !this.animation_position_data.isForward;
	        }
	    } else {
	        // backward
	        this.animation_position_data.current.x0 -= this.animation_position_data.interval.x0;
	        this.animation_position_data.current.y0 -= this.animation_position_data.interval.y0;
	        this.animation_position_data.current.x1 -= this.animation_position_data.interval.x1;
	        this.animation_position_data.current.y1 -= this.animation_position_data.interval.y1;
	        if( (this.animation_position_data.interval.x0 > 0 && (this.animation_position_data.current.x0 <= this.animation_position_data.begin.x0)) ||
	            (this.animation_position_data.interval.x0 < 0 && (this.animation_position_data.current.x0 >= this.animation_position_data.begin.x0)) ||
	            (this.animation_position_data.interval.y0 > 0 && (this.animation_position_data.current.y0 <= this.animation_position_data.begin.y0)) ||
	            (this.animation_position_data.interval.y0 < 0 && (this.animation_position_data.current.y0 >= this.animation_position_data.begin.y0)) ||
	            (this.animation_position_data.interval.x1 > 0 && (this.animation_position_data.current.x1 <= this.animation_position_data.begin.x1)) ||
	            (this.animation_position_data.interval.x1 < 0 && (this.animation_position_data.current.x1 >= this.animation_position_data.begin.x1)) ||
	            (this.animation_position_data.interval.y1 > 0 && (this.animation_position_data.current.y1 <= this.animation_position_data.begin.y1)) ||
	            (this.animation_position_data.interval.y1 < 0 && (this.animation_position_data.current.y1 >= this.animation_position_data.begin.y1))
	        ){
	            this.animation_position_data.isForward = !this.animation_position_data.isForward;
	            if(this.canvasObj.isRecording) this.canvasObj.saveCanvasAsVideo();
	        }
	    }
	    if(this.animation_position_data.color.type == 'gradient')
	    {
	        this.color = this.context.createLinearGradient((0 + this.animation_position_data.current.x0) * this.canvasW/2, (0 + this.animation_position_data.current.y0) * this.canvasH/2, (1 + this.animation_position_data.current.x1) * this.canvasW/2, (1 + this.animation_position_data.current.y1) * this.canvasH/2);
	        this.color.addColorStop(0, this.animation_position_data.color.code[0]);
	        this.color.addColorStop(1, this.animation_position_data.color.code[1]);
	    }
	    else if(this.animation_position_data.color.type == 'solid')
	    {
	        this.color = this.animation_position_data.color.code;
	    }
	    
	    this.canvasObj.draw();
	}
	initCornerAnimation(animationData){
		this.shape = animationData;
        this.animation_shape_data = animationData;
        this.animation_shape_data.isForward = true;
        this.animation_shape_data.current = {};
        this.animation_shape_data.current.r = this.animation_shape_data.begin.r;
        this.animation_shape_data.interval = {};
        this.animation_shape_data.interval.r = Math.round(((this.animation_shape_data.end.r - this.animation_shape_data.current.r) / (this.framerate * this.animation_shape_data.duration/1000)) * 1000)/1000;
        this.animation_shape_data.isForward = true;
        if(this.timer_shape == null)
        {
        	clearInterval(this.timer_shape);
        	this.timer_shape = null;
        }
        this.timer_shape = setInterval(this.updateCornerAnimation.bind(this), 1000 / this.framerate);
    }
    updateCornerAnimation(){
        if(this.animation_shape_data.isForward) {
            // forward
            this.animation_shape_data.current.r += this.animation_shape_data.interval.r;
            if( (this.animation_shape_data.interval.r > 0 && (this.animation_shape_data.current.r >= this.animation_shape_data.end.r)) ||
                (this.animation_shape_data.interval.r < 0 && (this.animation_shape_data.current.r <= this.animation_shape_data.end.r))
            ){
                this.animation_shape_data.isForward = !this.animation_shape_data.isForward;
            }
        } else {
            // backward
            this.animation_shape_data.current.r -= this.animation_shape_data.interval.r;
            if( (this.animation_shape_data.interval.r > 0 && (this.animation_shape_data.current.r <= this.animation_shape_data.begin.r)) ||
                (this.animation_shape_data.interval.r < 0 && (this.animation_shape_data.current.r >= this.animation_shape_data.begin.r))
            ){
                this.animation_shape_data.isForward = !this.animation_shape_data.isForward;
            	if(this.canvasObj.isRecording && !this.colorData['animation-type']) this.canvasObj.saveCanvasAsVideo();
            }
        }
        this.cornerRadius = this.animation_shape_data.current.r;
        this.canvasObj.draw();
    }

    updateBackgroundImg(img, silent = false){
    	
    }
	
	updateTypography(typographyKey, silent = false){
		this.typography = this.options.typographyOptions[typographyKey];
		if(!silent) this.canvasObj.draw();
	}
	updateFont(key, silent = false){
		this.font = this.options.fontOptions[key];
		if(!silent) this.canvasObj.draw();
	}
	updateText(str, silent = false){
		this.str = str;
		if(str) this.fields.text.value = this.str;
        if(!silent) this.canvasObj.draw();
    }
    updateTextColor(colorData, silent = false){
		this.textColor = this.processStaticColorData(colorData);
        if(!silent) this.canvasObj.draw();
    }
	preWrite(){
		for(let prop in this.options.typographyOptions) 
			this.write('Load', 'center', 'default', this.options.typographyOptions[prop]);
		
		this.write('');
	}
    write(str = '', align='center', color='default', typography = false, font=null, shift=null, rad=0){
		color = color === 'default' ? this.textColor : this.processStaticColorData(this.options.textColorOptions[color]['color']);
		this.context.strokeStyle = color;
    	if(typography === false)
    		typography = this.typography;
		font = font ? font['static'] : typography['font']['static'];
		this.fontStyle = typography.size + 'px ' + font['family'];
		if(font['weight']) this.fontStyle = font['weight'] + ' ' + this.fontStyle;

		let lineHeight = parseFloat(typography['lineHeight']);
		let addStroke = (typography == 'small' || typography == 'medium-small');
		addStroke = false;
		rad = rad ? rad : 0;
		this.context.font = this.fontStyle;

		let text = this.getText(str, color);
		this.context.textBaseline = 'middle';
		/*
			lines = {
				'max-width': ...,
				'lines': [
					{
						'width': ...,
						'segs': [
							{
								'content': ...,
								'color': ... 
							},
							,,,
						]
					},
					...
				]
			}
		*/
		
        if(this.options.textPositionOptions.hasOwnProperty(align)) {
			/*
				write main text
			*/
			this.str = str;
			this.context.textAlign='left';
			
			let x = shift && shift.x ? shift.x : 0, 
				y = shift && shift.y ? -shift.y : 0; // positive value means going up
			let text_dev_y = 0;

			if(this.shape.base === 'triangle') {
				let w = Math.min(this.frame.w, this.frame.h) - this.padding * 2;
				let h = w * 1.732 / 2 ;
				text_dev_y += h / 8;
			}
			
			y += this.shapeCenter.y;
			let lines = text.lines;
			x += align == 'align-left' ? this.shapeCenter.x - this.frame.w / 2 + this.innerPadding.x + this.padding : this.shapeCenter.x;
			y -= lines.length % 2 == 0 ? (lines.length / 2 - 0.5) * lineHeight : parseInt(lines.length / 2 ) * lineHeight;
			y += text_dev_y;
			this.writeLines(lines, x, y, parseFloat(typography['lineHeight']), align, addStroke);
			
			return;
        }
        /*
            write watermarks
        */
		let lines = text.lines;	
    	let metrics = this.context.measureText(str);
		let actualAscent = metrics.actualBoundingBoxAscent;
		
		let x, y;
		
    	if(this.shape.base == 'rectangle' || this.shape.base == 'fill' || this.shape.base == 'angolo' || this.shape.base == 'none'){
    		let side_x = this.size.width;
			let side_y = this.size.height;
    		let inner_p_x = this.innerPadding.x;
    		let inner_p_y = this.innerPadding.y;
    		if(align.indexOf('left') !== -1){
    			this.context.textAlign = 'left';
    			x =  this.shapeCenter.x - side_x / 2 + inner_p_x;
    		}
    		else if(align.indexOf('right') !== -1){
    			this.context.textAlign = 'right';
    			x =  this.shapeCenter.x + side_x / 2 - inner_p_x;
    		}
    		else if(align.indexOf('center') !== -1){
    			this.context.textAlign = 'center';
    			x = this.shapeCenter.x;
    		}
    		if(align.indexOf('top') !== -1){
				y = this.shapeCenter.y - side_y / 2 + inner_p_y;
				
    		}
    		else if(align.indexOf('middle') !== -1){
    			metrics = this.context.measureText(str);
    			actualAscent = metrics.actualBoundingBoxAscent;
    			y = this.shapeCenter.y;
    			x = align.indexOf('left') !== -1 ? this.shapeCenter.x - side_x / 2 + inner_p_y + actualAscent : this.shapeCenter.x + side_x / 2 - inner_p_y - actualAscent;
    		}
    		else if(align.indexOf('bottom') !== -1){
    			y = this.shapeCenter.y + side_y / 2 - inner_p_y;
    		}
    	}
    	else if(this.shape.base == 'hexagon'){
    		let inner_p_x = this.innerPadding.x;
    		let inner_p_y = this.innerPadding.y;
    		let a = this.frame.w / 2 - this.padding;
    		if(align.indexOf('left') !== -1){
    			this.context.textAlign = 'left';
    			x = align.indexOf('middle') !== -1 ? this.shapeCenter.x - a + inner_p_x * 2 / 1.732 : this.shapeCenter.x - a / 2 + inner_p_x / 2;
       		}
    		else if(align.indexOf('right') !== -1){
    			this.context.textAlign = 'right';
    			x = align.indexOf('middle') !== -1 ? this.shapeCenter.x + a - inner_p_x * 2 / 1.732 : this.shapeCenter.x + a / 2 - inner_p_x / 2;
    		}
    		else if(align.indexOf('center') !== -1){
    			this.context.textAlign = 'center';
    			x = this.shapeCenter.x;
    		}
    		if(align.indexOf('top') !== -1){
    			y = this.shapeCenter.y - a * 1.732 / 2 + inner_p_y + actualAscent;
    		}
    		else if(align.indexOf('middle') !== -1){
    			// this.context.textBaseline = 'middle';
    			y = this.shapeCenter.y;
    		}
    		else if(align.indexOf('bottom') !== -1){
    			y = this.shapeCenter.y + a * 1.732 / 2 - inner_p_y;
    		}
    	}
    	else if(this.shape.base == 'triangle'){
    		if(align.indexOf('top') !== -1 || align.indexOf('middle') !== -1) return;
    		let this_padding = this.padding;
    		let inner_p_x = this.innerPadding.x;
    		let inner_p_y = this.innerPadding.y;
    		let y_dev = 120;
	        let trangleCenter = {
	        	x: this.shapeCenter.x,
	        	y: this.shapeCenter.y + y_dev
	        }
    		
	        let side = this.frame.w - this_padding * 2;
    		if(align.indexOf('left') !== -1){
    			this.context.textAlign = 'left';
    			x = this.shapeCenter.x - side / 2 + inner_p_x;
    		}
    		else if(align.indexOf('right') !== -1){
    			this.context.textAlign = 'right';
    			x = this.shapeCenter.x + side / 2 - inner_p_x;
    		}
    		else if(align.indexOf('center') !== -1){
    			this.context.textAlign = 'center';
    			x = this.shapeCenter.x
    		}
    		if(align.indexOf('bottom') !== -1){
    			y = trangleCenter.y + side * 1.732 / 2 / 3 - inner_p_y;
    		}
    	}
    	else if(this.shape.base == 'circle'){
    		let inner_p_x = this.innerPadding.x;
			if(align === 'surrounding') {
				const spaceWidth = this.typography.size * 0.35 ; // Define a fixed width for spaces
				const charWidths = [];
				let currentAngle = -Math.PI / 2;
				let radius = (this.frame.w - (this.padding * 2)) / 2 - this.innerPadding.x;
				
				for (let i = 0; i < str.length; i++) {
					const char = str[i];
					const charWidth = this.context.measureText(char).width;
					charWidths[i] = charWidth;
				}
				
				for (let j = 0; j < str.length; j++) {
					this.context.save();
					const char = str[j];
					const charWidth = charWidths[j];
					const angleOffset = charWidth / (2 * radius);
					const x = radius * Math.cos(currentAngle) + this.canvasW / 2;
					const y = radius * Math.sin(currentAngle) + this.frame.h / 2;
					const rad = currentAngle + Math.PI / 2;
					this.context.translate(x, y);
					this.context.rotate(rad);
					this.context.fillText(char, 0, 0);
					this.context.translate(0, 0);
					currentAngle += angleOffset * 2;
					this.context.restore();
					
				}
				return;
				// synced = 0;
			}
    		else if(align.indexOf('left') !== -1){
    			this.context.textAlign = 'left';
    			x = this.frame.x + this.padding + inner_p_x;
    		}
    		else if(align.indexOf('right') !== -1){
    			this.context.textAlign = 'right';
    			x = this.frame.x  + this.frame.w - (this.padding + inner_p_x);
    		}
			if(align.indexOf('middle') !== -1){
    			y = this.frame.y + this.frame.h / 2;
    		}
    		else return;
    	} else if(this.shape.base === 'diamond') {
			if(align.indexOf('center') !== -1 || align.indexOf('middle') !== -1) return;
			let this_padding = this.padding;
    		let inner_p_x = this.innerPadding.x;
    		let inner_p_y = this.innerPadding.y;
			this.context.textAlign = "center";
		
			let side = Math.min(this.frame.w, this.frame.h);
			let a = (side - this_padding * 2) / 2;
			const sqrt2 = Math.sqrt(2);

			if(align.indexOf('left') !== -1){
    			x = this.shapeCenter.x - a / 2 + inner_p_x / sqrt2;
       		}
    		else if(align.indexOf('right') !== -1){
    			x = this.shapeCenter.x + a / 2 - inner_p_x / sqrt2;
    		}
    		
			if(align.indexOf('top') !== -1){
    			y = this.shapeCenter.y - a / 2 + inner_p_y / sqrt2;
				if(align.indexOf('left') !== -1){ 
					rad += -45 * Math.PI / 180;
				} else if(align.indexOf('right') !== -1){ 
					rad +=  45 * Math.PI / 180;
				} 
       		}
    		else if(align.indexOf('bottom') !== -1){
    			y = this.shapeCenter.y + a / 2 - inner_p_y / sqrt2;
				y -= (lineHeight - typography['size']);
				if(align.indexOf('left') !== -1){ 
					rad += 225 * Math.PI / 180;
				} else if(align.indexOf('right') !== -1){ 
					rad += 135 * Math.PI / 180;
				}
    		}
		}

		y -= lines.length % 2 == 0 ? (lines.length / 2 - 0.5) * lineHeight : parseInt(lines.length / 2 ) * lineHeight;
		if(align.indexOf('top') !== -1)
			y += lines.length / 2 * lineHeight;
		else if(align.indexOf('bottom') !== -1)
			y -= lines.length / 2 * lineHeight - (lineHeight - typography['size']);

		x += shift && shift.x ? parseFloat(shift.x) : 0;
		y -= shift && shift.y ? parseFloat(shift.y) : 0;
		this.context.save();
    	if(align.indexOf('middle') !== -1 && (this.shape.base == 'rectangle' || this.shape.base == 'fill')) {
			this.context.textAlign = 'center';
			if(align.indexOf('left') !== -1) 
				rad -= Math.PI/2;
			else if(align.indexOf('right') !== -1) 
				rad += Math.PI/2;
		}
		this.context.translate(x, y);
		this.context.rotate(rad);
		
		this.writeLines(lines, 0, 0, parseFloat(typography['lineHeight']), '', addStroke);
		this.context.restore();
    }
	writeLines(lines, x, y, lineHeight, align='', addStroke=false){
		let ln;

		for(let i = 0; i < lines.length; i++) { 
			ln = lines[i];
			let seg_x = align == 'center' ? x - ln['width'] / 2 : x;
			let ln_y = y + i * lineHeight;
			this.writeLine(ln, seg_x, ln_y, addStroke);
		}
	}
	writeLine(line, initial_x, y, addStroke=false){
		for(let seg of line.segs) {
			this.context.fillStyle = seg.color === 'default' ? this.textColor : seg.color;
			this.context.font = seg.style === 'normal' ? this.fontStyle : 'italic ' + this.fontStyle;
			this.context.fillText(seg.content, initial_x, y);
			if(addStroke) this.context.strokeText(seg.content, initial_x, y);
			initial_x += this.context.measureText(seg.content).width;
		}
	}
    drawMultipleLinesFromTopKeep(lines, x, y, lineHeight, addStroke = false) {
        for (var i = 0, len = lines.length; i < len; i++) {
            let offset = lineHeight * (i);
			for(let j = 0; j < lines[i].segs.length; j++ ){
				this.context.fillText(lines[i].segs[j].content, x, y + offset);
				if(addStroke) this.context.strokeText(lines[i].segs[j].content, x, y + offset);
			}
            
        }
    }
	getText(str, color){
		let output = {
			'lines': [],
			'max-width': 0
		};
		let lines = this.getLines(str, color);
		for(let i = 0; i < lines.length; i++) {
			output['lines'].push(lines[i]);
		}
		return output;
	}
	getSegments(str, color){
		const p_all = /(\[.*?\]|\*.*?\*)/g;
		const p_white = /\[(.*?)\]/g;
		const p_italic = /\*(.*?)\*/g;
		const textByPattern = str.split(p_all);
		const output = [];
		const segments = [];
		for(const t of textByPattern) {
			if(t.match(p_white)) {
				const content = t.replaceAll(p_white, "$1");
				if(content === '') continue;
				segments.push(
					{
						'content': content,
						// 'content': t.substring(1, t.length - 1),
						'color': '#ffffff',
						'style': 'normal'
					}
				)
			} else if(t.match(p_italic)) {
				const content = t.replace(p_italic, "$1");
				if(content === '') continue;
				segments.push(
					{
						'content': content,
						'color': color,
						'style': 'italic'
					}
				)
			} else {
				const content = t;
				// if(content === '') continue;
				segments.push(
					{
						'content': content,
						'color': color,
						'style': 'normal'
					}
				)
			}
		}
		return segments;
	}
	getLines(str, color){
		let output = [];
		let temp = str.split('\n');
		
		for(let i = 0; i < temp.length; i++) {
			const segments = this.getSegments(temp[i], color);
			let lns = this.breakSegmentsIntoLinesByWidth(segments, this.textBoxWidth);
			for(let l of lns) output.push(l);
		}
		return output;
	}
    breakSegmentsIntoLinesByWidth(segments, width, filterBrackets = true) {
		if(segments.length === 0) return [];
    	let line = '';
    	let output = [];
		
		let temp, seg_color, seg_style;
		let isSorting = true;
		const words = [];
		for(let i = 0; i < segments.length; i++) {
			let seg = segments[i];
			let words_temp = seg['content'].split(' ');
			for(let j = 0; j < words_temp.length; j++) {
				const word_temp = words_temp[j];
				const new_item = {...seg, 'content': word_temp};
				words.push(new_item);
			}
		}

		let line_unit = {
			'segs': [],
			'width': 0
		}
		let seg_unit = {
			'content': '',
			'style': words[0]['style'],
			'color': words[0]['color']
		}

		for(let i = 0; i < words.length; i++ ) {
			const word = words[i];
			temp = line ? line + ' ' + word['content'] : word['content'];
			this.context.font = word['style'] === 'italic' ?  word['style'] + ' ' + this.fontStyle : this.fontStyle;
			let m = this.context.measureText(temp);
			if( m.width <= width ) { 
				line = line ? line + ' ' + word['content'] : word['content'];
				
				seg_unit.content += word['content'] === '' ? ' ' : (seg_unit.content ? ' ' + word['content'] : word['content']);
				line_unit.width = m.width;
				if((  i !== words.length - 1 && (seg_unit['color'] != words[i+1]['color'] || seg_unit['style'] != words[i+1]['style'])  )) {
					line_unit['segs'].push(seg_unit);
					let next_word = words[i+1];
					seg_unit = {
						'content': '',
						'style': next_word['style'],
						'color': next_word['color']
					}
				}
				continue;
			}
			if(seg_unit['content'] !== '') {
				line_unit['segs'].push(seg_unit);
				output.push(line_unit);
			}
			seg_unit = word;
			line = word['content'];
			temp = line;
			m = this.context.measureText(temp);
			line_unit = {
				'segs': [],
				'width': m.width,
			}
			if(i != words.length - 1 && (seg_unit['color'] != words[i+1]['color'] || seg_unit['style'] != words[i+1]['style'])) {
				line_unit['segs'].push(seg_unit);
				let next_word = words[i+1];
				seg_unit = {
					'content': '',
					'style': next_word['style'],
					'color': next_word['color']
				}
			}
			
			// isSorting = false;
		}
		temp = line;
		let m = this.context.measureText(temp);
		line_unit['segs'].push(seg_unit);
		line_unit.width = m.width;
		output.push(line_unit);
		
    	return output;
    }
    updateWatermark(idx, values_raw = {str: false, position : false, color : false, typography:false, shift : false, rad:false}, silent = false){
		super.updateWatermark(idx, values_raw);
		if(!silent) this.canvasObj.draw();
	}
	drawWatermarks(){
		this.watermarks.forEach(function(el, i){
			if(this.shape.watermarkPositions == 'all' || this.shape.watermarkPositions.includes(el.position)) {
				this.write(el.str, el.position, el.color, el.typography, el.font, el.shift, el.rotate);
			}
				
		}.bind(this));
	}
	checkWatermarkPosition(position, label){
    	super.checkWatermarkPosition(position, label);
    }
	drawRectangle(){
		if(this.cornerRadius * 2 > this.frame.w - (this.padding * 2) )
            this.cornerRadius = (this.frame.w - (this.padding * 2)) / 2;
		this.textBoxWidth = (this.frame.w - this.padding * 2 - this.innerPadding.x * 2) * 0.9;
        this.context.fillStyle = this.color === 'upload' && this.colorPattern ? this.colorPattern : this.color;
		this.drawRectanglePath();
        this.context.fill();
	}
	clipRectangle(ctx = null){
		ctx = ctx ? ctx : this.context;
		if(this.cornerRadius * 2 > this.frame.w - (this.padding * 2) )
            this.cornerRadius = (this.frame.w - (this.padding * 2)) / 2;
        this.textBoxWidth = (this.frame.w - this.padding * 2 - this.innerPadding.x * 2) * 0.9;
		this.drawRectanglePath();
        ctx.clip();
	}
	drawRectanglePath(ctx = null){
		if(this.cornerRadius * 2 > this.frame.w - (this.padding * 2) )
            this.cornerRadius = (this.frame.w - (this.padding * 2)) / 2;
        let paddingX = this.padding;
        let paddingY = this.padding;

		let w, h;
		
		if(this.shape.base === 'fill') {
			w = this.frame.w
			h = this.frame.h
		} else {
			let side = Math.min(this.frame.w, this.frame.h);
			w = side - paddingX * 2;
			h = side - paddingY * 2;
		}
		this.updateSize(w, h);
		// let w = this.size.width;
		// let h = this.size.height;
		ctx = ctx ? ctx : this.context;
		this.context.beginPath();
        this.context.arc((this.shapeCenter.x - w / 2) + this.cornerRadius, (this.shapeCenter.y - h / 2) + this.cornerRadius, this.cornerRadius, Math.PI, 3 * Math.PI / 2);
        this.context.arc((this.shapeCenter.x - w / 2) + w - this.cornerRadius, (this.shapeCenter.y - h / 2) + this.cornerRadius, this.cornerRadius, 3 * Math.PI / 2, 0);
        this.context.arc((this.shapeCenter.x - w / 2) + w - this.cornerRadius, (this.shapeCenter.y - h / 2) + h - this.cornerRadius, this.cornerRadius, 0, Math.PI / 2);
        this.context.arc((this.shapeCenter.x - w / 2) + this.cornerRadius, (this.shapeCenter.y - h / 2) + h - this.cornerRadius, this.cornerRadius, Math.PI / 2, Math.PI);
        this.context.closePath();
	}
	
	drawCircle(){
	    this.context.fillStyle = this.color === 'upload' && this.colorPattern ? this.colorPattern : this.color;
		this.drawCirclePath()
	    this.context.fill();
	}
	clipCircle(){
	    this.drawCirclePath();
	    this.context.clip();
	}
	drawCirclePath(){
		this.context.beginPath();
		let r = (Math.min(this.frame.w, this.frame.h) - (this.padding * 2))/2;
		this.textBoxWidth = (this.frame.w - this.padding * 2 - this.innerPadding.x * 2) * 0.8;
		this.context.arc(this.shapeCenter.x, this.shapeCenter.y, r, 0, 2 * Math.PI, true);
		this.context.closePath();
		this.updateSize(r, r);
	}
	drawTriangle(){
        this.context.fillStyle = this.color === 'upload' && this.colorPattern ? this.colorPattern : this.color;
        this.drawTrianglePath();
        this.context.fill();
    }
    clipTriangle(){
        this.drawTrianglePath();
        this.context.clip();
    }
	drawTrianglePath(){
		let this_padding = this.padding;
		let w = Math.min(this.frame.w, this.frame.h) - this_padding * 2;
        let h = w * 1.732 / 2 ;
        let trangleCenter = {
        	x: this.shapeCenter.x,
        	y: this.shapeCenter.y + h / 8 // not sure why it's h/8... should be h/6?
        }
		this.updateSize(w, h);
		this.textBoxWidth = (w - this.innerPadding.x * 2) * 0.6;
		this.context.beginPath();
        this.context.arc(
			trangleCenter.x - w / 2 + this.cornerRadius * 1.732 / 2, 
			trangleCenter.y + h / 3 - this.cornerRadius / 2, 
			this.cornerRadius / 2, 
			Math.PI / 2, 7 * Math.PI / 6
		);
        this.context.arc(
			trangleCenter.x, 
			trangleCenter.y - h * 2 / 3 + this.cornerRadius, 
			this.cornerRadius / 2, 7 * Math.PI / 6, 11 * Math.PI / 6);
        this.context.arc(
			trangleCenter.x + w / 2 - this.cornerRadius * 1.732 / 2, 
			trangleCenter.y + h / 3 - this.cornerRadius / 2, 
			this.cornerRadius / 2, 
			11 * Math.PI / 6, Math.PI / 2
		);
        this.context.closePath();
	}
	drawHeart() {
		let this_padding = this.padding;
		this.context.fillStyle = this.color === 'upload' && this.colorPattern ? this.colorPattern : this.color;
		let side = Math.min(this.frame.w, this.frame.h) - this_padding * 2;
		let arcs = [
			{
				x: -192,
				y: -143.56,
				r: 280,
				from: 3 * Math.PI / 4,
				to: 7 * Math.PI / 4
			},
			{
				x: 192,
				y: -143.56,
				r: 280,
				from: 5 * Math.PI / 4,
				to: Math.PI / 4
			}
		];
		let dev_y = 412;
		let m = side / ((Math.abs(arcs[0]['x']) + arcs[0]['r']) * 2);
		this.context.beginPath();
		this.context.arc(this.shapeCenter.x + arcs[0].x * m, this.shapeCenter.y + arcs[0].y * m, arcs[0].r * m, arcs[0].from,arcs[0].to);
		this.context.arc(this.shapeCenter.x + arcs[1].x * m, this.shapeCenter.y + arcs[1].y * m, arcs[1].r * m, arcs[1].from,arcs[1].to);
		this.context.lineTo(this.shapeCenter.x, this.shapeCenter.y + dev_y * m);
		this.context.closePath();
        this.context.fill();
	}
    drawHexagon(){
        this.context.fillStyle = this.color === 'upload' && this.colorPattern ? this.colorPattern : this.color;
		this.drawHexagonPath();
        this.context.fill();
    }
    clipHexagon(){
    	this.drawHexagonPath();
        this.context.clip();
    }
	drawHexagonPath(){
		this.padding = this.padding;
        let width = Math.min(this.frame.w, this.frame.h) - this.padding * 2;
        let height = width / 2 * 1.732;
        this.textBoxWidth = (width - this.innerPadding.x * 2) * 0.8;
		this.context.beginPath();
        this.context.arc(this.shapeCenter.x - width / 4 + this.cornerRadius / 1.732, this.shapeCenter.y - height / 2 + this.cornerRadius, this.cornerRadius , 7 * Math.PI / 6, 3 * Math.PI / 2);
        this.context.arc(this.shapeCenter.x + width / 4 - this.cornerRadius / 1.732, this.shapeCenter.y - height / 2 + this.cornerRadius, this.cornerRadius, 3 * Math.PI / 2, 11 * Math.PI / 6);
        this.context.arc(this.shapeCenter.x + width / 2 - 2 * this.cornerRadius / 1.732, this.shapeCenter.y, this.cornerRadius, 11 * Math.PI / 6, 13 * Math.PI / 6);
        this.context.arc(this.shapeCenter.x + width / 4 - this.cornerRadius / 1.732, this.shapeCenter.y + height / 2 - this.cornerRadius, this.cornerRadius, Math.PI / 6, 3 * Math.PI / 6);
        this.context.arc(this.shapeCenter.x - width / 4 + this.cornerRadius / 1.732, this.shapeCenter.y + height / 2 - this.cornerRadius, this.cornerRadius , 3 * Math.PI / 6, 5 * Math.PI / 6);
        this.context.arc(this.shapeCenter.x - width / 2 + 2 * this.cornerRadius / 1.732, this.shapeCenter.y, this.cornerRadius, 5 * Math.PI / 6, 7 * Math.PI / 6);
        this.context.closePath();
	}
	drawDiamond(){
		if(this.cornerRadius * 2 > this.frame.w - (this.padding * 2) )
            this.cornerRadius = (this.frame.w - (this.padding * 2)) / 2;
		
		this.textBoxWidth = this.frame.w - this.padding * 2 * 0.9;
        this.context.fillStyle = this.color === 'upload' && this.colorPattern ? this.colorPattern : this.color;
		this.drawDiamondPath();
        this.context.fill();
	}
	drawDiamondPath(ctx=null){
        let paddingX = this.padding;
        let paddingY = this.padding;

		let w, h;
		
		let side = Math.min(this.frame.w, this.frame.h);
			w = side - paddingX * 2;
			h = side - paddingY * 2;

		let centerX = this.shapeCenter.x, 
			centerY = this.shapeCenter.y, 
			r       = this.cornerRadius;

		this.updateSize(w, h);

		const angle = 45 * Math.PI / 180;
		const sqrt2 = Math.sqrt(2);
		const rect_w = w / sqrt2;
		const rect_h = h / sqrt2;
		const hw = rect_w / 2;
		const hh = rect_h / 2;

		// Define arc centers (unrotated)
		const corners = [
			{ x: centerX - hw + r, y: centerY - hh + r }, // top-left
			{ x: centerX + hw - r, y: centerY - hh + r }, // top-right
			{ x: centerX + hw - r, y: centerY + hh - r }, // bottom-right
			{ x: centerX - hw + r, y: centerY + hh - r }, // bottom-left
		];

		// Corresponding angles for each arc
		const angles = [
			[Math.PI, 1.5 * Math.PI],     // top-left
			[1.5 * Math.PI, 0],           // top-right
			[0, 0.5 * Math.PI],           // bottom-right
			[0.5 * Math.PI, Math.PI],     // bottom-left
		];

		ctx = ctx ? ctx : this.context;
		ctx.beginPath();

		for (let i = 0; i < 4; i++) {
			const corner = corners[i];
			const angleStart = angles[i][0] + angle;
			const angleEnd = angles[i][1] + angle;
			const rotatedCorner = this.rotatePoint(corner.x, corner.y, centerX, centerY, angle);
			ctx.arc(rotatedCorner.x, rotatedCorner.y, r, angleStart, angleEnd);
		}
        
		ctx.closePath();
	}
	drawAngolo(){
		if(this.cornerRadius * 2 > this.frame.w - (this.padding * 2) ) 
            this.cornerRadius = (this.frame.w - (this.padding * 2)) / 2;
		
		this.textBoxWidth = this.frame.w - this.padding * 2 * 0.9;
        this.context.fillStyle = this.color === 'upload' && this.colorPattern ? this.colorPattern : this.color;
		this.drawAngoloPath();
        this.context.fill('evenodd');

		this.context.fillStyle = "#ffffff";
		this.drawAngoloCornerPath();
        this.context.fill('evenodd');
		this.context.fillStyle = this.color;
	}
	drawAngoloPath(ctx = null){
		
        let paddingX = this.padding;
        let paddingY = this.padding;
		const thicknessX = this.shape.thickness[0], thicknessY = this.shape.thickness[1];

		const w = this.frame.w - paddingX * 2, h = this.frame.h - paddingY * 2
		const inner_w = w - thicknessX * 2, inner_h = h - thicknessY * 2
		this.updateSize(w, h);
		ctx = ctx ? ctx : this.context;
		this.context.beginPath();
        // Outer rectangle
		ctx.rect(paddingX, paddingY, w, h);
		// Inner rectangle (the "hole")
		ctx.rect(paddingX + thicknessX, paddingY + thicknessY, inner_w, inner_h);
        this.context.closePath();
	}
	drawAngoloCornerPath(ctx = null){
		
        let paddingX = this.padding;
        let paddingY = this.padding;
		const thicknessX = this.shape.thickness[0], thicknessY = this.shape.thickness[1];

		const size = Math.min(this.frame.w - paddingX * 2, this.frame.h - paddingY * 2) / 3;
		const inner_w = size - thicknessX, inner_h = size - thicknessY;
		
		ctx = ctx ? ctx : this.context;
		this.context.beginPath();
        // Outer rectangle
		ctx.rect(paddingX, paddingY, size, size);
		// Inner rectangle (the "hole")
		ctx.rect(paddingX + thicknessX, paddingY + thicknessY, inner_w, inner_h);
        this.context.closePath();
	}
	rotatePoint(x, y, cx, cy, angleRad) {
		let cos = Math.cos(angleRad);
		let sin = Math.sin(angleRad);
		let dx = x - cx;
		let dy = y - cy;
		return {
			x: cx + dx * cos - dy * sin,
			y: cy + dx * sin + dy * cos
		};
	}
	recordCanvas(){
        this.context.fillStyle = this.color;
        this.padding = this.padding - 60;
        let width = this.canvasW - this.padding * 2;
        let height = width / 2 * 1.732;
        let y_dev = 80;
        let side = this.canvasW - this.padding * 2;
        this.context.beginPath();
        this.context.arc(this.padding + this.cornerRadius * 1.732 / 2, this.shapeCenter.y + height / 3 - this.cornerRadius / 2, this.cornerRadius / 2, Math.PI / 2, 7 * Math.PI / 6);
        this.context.lineTo(this.shapeCenter.x - this.cornerRadius * 1.732 / 4, this.shapeCenter.y - height * 2 / 3  + this.cornerRadius * 3 / 4);
        this.context.arc(this.canvasW / 2, this.shapeCenter.y - height * 2 / 3 + this.cornerRadius, this.cornerRadius / 2, 7 * Math.PI / 6, 11 * Math.PI / 6);
        this.context.lineTo(this.canvasW - (this.padding + this.cornerRadius * 1.732 / 2) + this.cornerRadius * 1.732 / 4, this.shapeCenter.y + height / 3 - this.cornerRadius * 3 / 4);
        this.context.arc(this.canvasW - (this.padding + this.cornerRadius * 1.732 / 2), this.shapeCenter.y + height / 3 - this.cornerRadius / 2, this.cornerRadius / 2, 11 * Math.PI / 6, Math.PI / 2);
        this.context.closePath();
        this.context.fill();
    }
	drawCustomGraphic(){
		if(!this.customGraphic.length) return;
		for(let i = 0; i < this.customGraphic.length; i++) this.customGraphic[i].draw();
	}
   
    record_canvas(){
    	super.record_canvas();
    }
  	drawForSavingImage(){
  		this.draw();
  		this.canvasObj.saveCanvasAsImage();
  	}

	draw(){
		if(this.color === 'upload') {
			this.colorPattern = this.media['background-image'].generatePattern(this.context, this.canvas, this.frame);
		}
		if(this.shapeMethod == 'draw')
		{
			if(this.shape.base == 'rectangle' || this.shape.base == 'fill')
				this.drawRectangle();
			else if(this.shape.base == 'circle')
				this.drawCircle();
			else if(this.shape.base == 'triangle')
				this.drawTriangle();
			else if(this.shape.base == 'hexagon')
				this.drawHexagon();
			else if(this.shape.base == 'heart')
				this.drawHeart();
			else if(this.shape.base == 'diamond')
				this.drawDiamond();
			else if (this.shape.base === 'angolo')
				this.drawAngolo();
		}
		else if(this.shapeMethod == 'clip')
		{
			this.context.save();
			if(this.shape.base == 'rectangle' || this.shape.base == 'fill')
				this.clipRectangle();
			else if(this.shape.base == 'circle')
				this.clipCircle();
			else if(this.shape.base == 'triangle')
				this.clipTriangle();
			else if(this.shape.base == 'hexagon')
				this.clipHexagon();
			this.fillColorByShape(this.colorData);
			this.context.restore();
		}
		this.drawImages();
		this.write(this.str, this.textPosition, 'default', this.typography, this.font, {x: this.textShiftX, y: this.textShiftY});
		if( this.shape.watermarkPositions !== undefined)
			this.drawWatermarks();
		this.drawCustomGraphic();
	}
	
	renderControl(){
		super.renderControl();
		const [select_section] = this.renderSelectSection('shape-color', 'Color', {options: this.options.colorOptions});
		this.control.appendChild(select_section);
		if(this.options.colorOptions['upload']) {
			const [section] = this.renderMediaSection('background-image', '', ['shape-image-section'])
			this.control.appendChild(section);
		}
		this.control.appendChild(this.renderTextSection('text', 'Main Text'));
		this.control.appendChild(super.renderAddWaterMark());
		this.control.appendChild(super.renderAddMedia());
	}

	addListeners(){
		if(this.fields['shape']) {
			this.fields['shape'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				let shape = this.options.shapeOptions[e.target.value]['shape'];
				this.shape = shape;
				this.updateShape(this.shape, isSilent);
				let sWatermark_panels = this.control.querySelectorAll('.watermarks-container .panel-section');
				[].forEach.call(sWatermark_panels, function(el, i){
					let position = el.querySelector('.watermark-position').value;
					let label = el.querySelector('label');
					this.checkWatermarkPosition(position, label);
				}.bind(this));
			}.bind(this);
		}

		if(this.fields['shape-shift-x']) {
			this.fields['shape-shift-x'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				this.updateShapeShiftX(parseInt(e.target.value), isSilent);
			}.bind(this);
			this.fields['shape-shift-x'].onkeydown = e => this.updatePositionByKey(e, {x: this.fields['shape-shift-x'], y:this.fields['shape-shift-y']}, (shift)=>{
				this.updateShapeShiftX(shift.x)
				this.updateShapeShiftY(shift.y)
			});
			this.fields['shape-shift-x'].onblur = () => {
				this.unfocusInputs([this.fields['shape-shift-x'], this.fields['shape-shift-y']]);
			}
		}
		if(this.fields['shape-shift-y']) {
			this.fields['shape-shift-y'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				this.updateShapeShiftY(parseInt(e.target.value), isSilent);
			}.bind(this);
			this.fields['shape-shift-y'].onkeydown = e => this.updatePositionByKey(e, {x: this.fields['shape-shift-x'], y:this.fields['shape-shift-y']}, (shift)=>{
				this.updateShapeShiftX(shift.x)
				this.updateShapeShiftY(shift.y)
			});
			this.fields['shape-shift-y'].onblur = () => {
				this.unfocusInputs([this.fields['shape-shift-x'], this.fields['shape-shift-y']]);
			}
		}
		
		if(this.fields['animation']) {
			this.fields['animation'].onchange = function(e){				
				if(e.target.value !== 'none') {
					document.body.classList.add('viewing-three');
					this.canvasObj.sync();
				}
			}.bind(this);
		}
		if(this.fields['text']) {
			this.fields['text'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				
				let value = e.target.value;
				this.updateText(value, isSilent);
			}.bind(this);
		}
		if(this.fields['text-typography']) {
			this.fields['text-typography'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				
				this.updateTypography(e.target.value, isSilent);
			}.bind(this);
		}
		if(this.fields['text-font']) {
			this.fields['text-font'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				this.updateFont(e.target.value, isSilent);
			}.bind(this);
		}
		if(this.fields['text-color']) {
			this.fields['text-color'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				
				let color = this.options.textColorOptions[e.target.value]['color'];
				this.updateTextColor(color, isSilent);
			}.bind(this);
		}
		if(this.fields['text-position']) {
			this.fields['text-position'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				
				let position = e.target.value;
				this.updateTextPosition(position, isSilent);
			}.bind(this);
		}
		if(this.fields['text-shift-x']) {	
			this.fields['text-shift-x'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				this.updateTextShiftX(e.target.value, isSilent);
			}.bind(this);
			this.fields['text-shift-x'].onkeydown = e => this.updatePositionByKey(e, {x: this.fields['text-shift-x'], y:this.fields['text-shift-y']}, (shift)=>{
				this.updateTextShiftX(shift.x)
				this.updateTextShiftY(shift.y)
			});
			this.fields['text-shift-x'].onblur = () => {
				this.unfocusInputs([this.fields['text-shift-x'], this.fields['text-shift-y']]);
			}
		}

		if(this.fields['text-shift-y']) {
			this.fields['text-shift-y'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				
				this.updateTextShiftY(parseInt(e.target.value), isSilent);
			}.bind(this);
			this.fields['text-shift-y'].onkeydown = e => this.updatePositionByKey(e, {x: this.fields['text-shift-x'], y:this.fields['text-shift-y']}, (shift)=>{
				this.updateTextShiftX(shift.x)
				this.updateTextShiftY(shift.y)
			});
			this.fields['text-shift-y'].onblur = () => {
				this.unfocusInputs([this.fields['text-shift-x'], this.fields['text-shift-y']]);
			}
		}
		if(this.fields['shape-color']) {
			this.fields['shape-color'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				let sec = e.target.parentNode.parentNode;
				if(e.target.value === 'upload') {
					this.color = 'upload';
					this.media['background-image'].show();
					sec.classList.add('viewing-shape-image-section');
				} else {
					sec.classList.remove('viewing-shape-image-section');
					this.media['background-image'].hide();
					this.colorPattern = null;
					if(this.fields.media['background-image'])
						this.fields.media['background-image'].parentNode.parentNode.classList.remove('viewing-image-control');
					if(this.options.colorOptions[e.target.value]?.color.type === 'animation') isSilent = false;
					this.updateColor(this.options.colorOptions[e.target.value].color, isSilent);
				}
			}.bind(this);
		}
	}
	initMedia(key, props={}, onUpload=null){
		if(!key) return null;
		const prefix = generateFieldId(this.id, key);
		return new MediaStatic(key, prefix, this.canvasObj.draw.bind(this.canvasObj), onUpload, this.mediaOptions, props);
	}
    
    updateFrame(frame = null, silent = false){
		frame = frame ? frame : this.generateFrame();
    	super.updateFrame(frame);
        if(!silent) this.canvasObj.draw();
    }
	generateShapeCenter(frame){
		frame = frame ? frame : this.frame;
		let output = {
			x: frame.x + frame.w / 2 + this.shapeShiftX,
			y: frame.y + frame.h / 2 + this.shapeShiftY
		};
		return output;
	}
	generateFrame()
    {
		let canvas_w = this.canvasObj.canvas.width;
		let canvas_h = this.canvasObj.canvas.height;
		let shape_num = Object.keys(this.canvasObj.shapes).length;
        let output = {
			w: canvas_w, 
			h: canvas_h / shape_num,
			x: 0,
			y: this.shape_index * canvas_h / shape_num
		};
		this.shapeCenter = this.generateShapeCenter(output);
		return output;
    }
    sync(){
		if(!this.counterpart) return;

		let isSilent = true;
		super.sync();
    	super.updateCounterpartWatermarks(isSilent);
		// return;
		this.canvasObj.counterpart.draw();
    }
    updateTextPosition(position, silent = false){
        this.textPosition = position;
        if(!silent) this.canvasObj.draw();
    }
	updateTextShiftX(x, silent = false){
		x = x === '' ? 0 : parseFloat(x);
		if(isNaN(x)) return;

		this.textShiftX = x;
        if(!silent) this.canvasObj.draw();
    }
	updateTextShiftY(y, silent = false){
		y = y === '' ? 0 : parseFloat(y);
		if(isNaN(y)) return;
        this.textShiftY = y;
        if(!silent) this.canvasObj.draw();
    }
	updateShapeShiftX(x, silent = false){
		x = x === '' ? 0 : parseFloat(x);
		if(isNaN(x)) return;
		this.shapeShiftX = x;
		this.updateFrame();
        if(!silent) this.canvasObj.draw();
    }
	updateShapeShiftY(y, silent = false){
		y = y === '' ? 0 : parseFloat(y);
		if(isNaN(y)) return;
		this.shapeShiftY = y;
		this.updateFrame();
        if(!silent) this.canvasObj.draw();
    }
    animate(colorData = false, shape = false){
		if(this.initRecording && !this.canvasObj.isRecording) {
			console.log('start recording...');
			
			setTimeout(()=>{
				this.initRecording = false;
				this.canvasObj.startRecording();
			}, 1000);			
			
			// return;
		}
    	if(!colorData) colorData = this.colorData;
    	if(!shape) shape = this.shape;
		
    	this.resetTimer(this.timer_shape);
    	this.resetTimer(this.timer_color);
    	this.resetTimer(this.timer_position);
    	if(colorData['animation-type'] == 'color')
            this.initColorAnimation(colorData);
        else if(colorData['animation-type'] == 'position')
            this.initPositionAnimation(colorData);
        if(shape['animation-type'] == 'corner')
            this.initCornerAnimation(this.shape);
    }
    resetTimer(timer){
    	if(!timer) return;
    	clearInterval(timer);
		timer = null;
    }
	drawImage(idx){
		const m = this.media[idx];
		if(!m.obj) return;
		this.context.globalCompositeOperation = m['blend-mode'] ? m['blend-mode'] : 'normal';
		this.context.drawImage(m.obj, (m.x + m['shift-x']), (m.y - m['shift-y']), m.obj.width * m.scale, m.obj.height * m.scale);
		this.context.globalCompositeOperation = 'normal';
	}
	drawImages(){
		for(let key in this.media) {
			const m = this.media[key];
			if(m.isShapeColor) continue;
			m.draw(this.context);
		}
		this.context.globalCompositeOperation = 'normal';
	}
	
	syncMedia(){
		super.syncMedia();
		let idx = 'background-image';
		if(this.color instanceof CanvasPattern && this.media[idx]) {
			let c_idx = this.fieldCounterparts[idx];
			this.counterpart.updateMedia(c_idx, {obj: this.media[idx].img, src: this.media[idx].src});
			if(this.counterpart.fields.media[c_idx]) {
				if(this.fields.media[idx].getAttribute('data-file-src')) {
					this.counterpart.fields.media[c_idx].setAttribute('data-file-src', this.fields.media[idx].getAttribute('data-file-src'));
				}
			}
				
		}
	}
	// getDisplayValue(input){
	// 	return input / this.canvasObj.scale;
	// }
}


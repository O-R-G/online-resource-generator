import { Shape } from "./Shape.js";
export class ShapeStatic extends Shape {
	constructor(prefix = '', canvasObj, options, format, shape_index=0){
		super(prefix, canvasObj, options, format, shape_index);
		this.color = null;
        for(let prop in this.options.colorOptions) {
            if(this.options.colorOptions[prop]['default']) this.color = this.options.colorOptions[prop].color.code;
        }
        if(!this.color) this.color = Object.values(this.options.colorOptions)[0].color.code;

		this.colorData = null;
        for(let prop in this.options.colorOptions) {
            if(this.options.colorOptions[prop]['default']) this.colorData = this.options.colorOptions[prop].color;
        }
        if(!this.colorData) this.colorData = Object.values(this.options.colorOptions)[0].color;

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

		this.fontSize = null;
        for(let prop in this.options.fontOptions) {
            if(this.options.fontOptions[prop]['default']) this.fontSize = prop;
        }
        if(!this.fontSize) this.fontSize = Object.keys(this.options.fontOptions)[0];

		this.textShiftX = 0;
		this.textShiftY = 0;

		this.timer_color = null;
		this.timer_position = null;
		this.timer_shape = null;

		this.imgs = {
			'background-image': {
				img: null,
				x: 0,
				y: 0,
				shiftY: 0,
				shiftX: 0,
				scale: 1
			}
		};

		this.fields.imgs = {};
	    this.shapeMethod = 'draw';
	    
		this.customGraphic = [];
		
		
	    
	}
	init(canvasObj){
		super.init(canvasObj);
		this.canvas = canvasObj.canvas;
		this.context = this.canvas.getContext("2d");
		this.updateCanvasSize();
		this.shapeCenter.x = this.frame.x + this.frame.w / 2;
	    this.shapeCenter.y = this.frame.y + this.frame.h / 2;
		this.control.classList.add('static-shape-control');
		this.renderControl();
	    this.addListeners();
	    this.updateShape(this.shape, true);
		this.preWrite();
	}
	updateCanvasSize(){
		this.canvasW = this.canvas.width;
		this.canvasH = this.canvas.height;
	}
	addCounterpart(obj)
	{
		super.addCounterpart(obj);
		// this.fields['animation'].parentNode.parentNode.style.display = 'block';
	}
	updateShape(shape, silent = false){
		if(shape['type'] == 'static') super.updateShape(shape);
		else if(shape['type'] == 'animation')
		{
			if(shape['animation-type'] == 'corner')
                this.animate(this.color, shape);
		}
		if(!silent) this.canvasObj.draw();
	}
	processStaticColorData(colorData){
		if(colorData.type == 'solid'){
			return colorData.code;
		}
		else if(colorData.type == 'transparent')
		{	
			let output = colorData.code;
			if(output.indexOf('rgba') == -1)
			{
				output = output.replace('rgb', 'rgba');
				output = output.replace(')', ',' + colorData.opacity);
			}
			return output;
		}
		else if(colorData.type == 'gradient'){
			if(colorData.angle == null){
				var output = this.context.createLinearGradient(this.canvasW/2, 0, this.canvasW/2, this.canvasH);
			}
			else if(colorData.angle == 45){
				var output = this.context.createLinearGradient(0, this.canvasH, this.canvasW, 0);
			}
			
			for(var i = 0; i < colorData.code.length; i++)
			{
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
        	// this.color = this.colorData.color;
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
                this.animation_color_data.isForward = !this.animation_color_data.isForward;
            	if(this.canvasObj.isRecording) this.canvasObj.saveCanvasAsVideo();
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
        // this.cornerRadius = this.animation_shape_data.current.r;
        this.cornerRadius = this.animation_shape_data.current.r;
        this.canvasObj.draw();
    }
    updateImg(img, idx, silent = false){
		if(!this.imgs[idx]) {
			this.imgs[idx] = {
				img: null,
				x: 0,
				y: 0,				
				shiftY: 0,
				shiftX: 0,
				scale: 1
			}
		}
		this.imgs[idx].img = img;
		
		if(idx === 'background-image') {
			let temp = document.createElement('canvas');
			let temp_ctx = temp.getContext('2d');
			if(this.timer_color != null)
			{
				clearInterval(this.timer_color);
				this.timer_color = null;
			}
			temp.width = this.canvasW;
			temp.height = this.canvasH;
			
			let length = this.frame.w - this.padding * 2;
				
			let temp_scale = 1;
			let temp_scaledW = this.imgs[idx].img.width * temp_scale;
			let temp_scaledH = this.imgs[idx].img.height * temp_scale;
			
			if(this.imgs[idx].img.width > this.imgs[idx].img.height)
			{
				temp_scale = length / this.imgs[idx].img.height * this.imgs[idx].scale;
				temp_scaledW = this.imgs[idx].img.width * temp_scale;
				temp_scaledH = this.imgs[idx].img.height * temp_scale;
			}
			else
			{
				temp_scale = length / this.imgs[idx].img.width * this.imgs[idx].scale;
				temp_scaledW = this.imgs[idx].img.width * temp_scale;
				temp_scaledH = this.imgs[idx].img.height * temp_scale;
			}

			this.imgs[idx].x = temp.width / 2 - temp_scaledW / 2 + this.imgs[idx].shiftX;
			this.imgs[idx].y = this.frame.h / 2 - temp_scaledH / 2 + this.imgs[idx].shiftY + this.frame.y;
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
			temp_ctx.drawImage(this.imgs[idx].img, this.imgs[idx].x, this.imgs[idx].y, temp_scaledW, temp_scaledH);

			this.color = this.context.createPattern(temp, "no-repeat");
			
		} 
		if(!silent) this.canvasObj.draw();
	}
    updateBackgroundImg(img, silent = false){
    	
    }
    updateImgScale(imgScale, idx, silent = false){
    	this.imgs[idx].scale = imgScale;
    	this.updateImg(this.imgs[idx].img, idx, silent)
    };
    updateImgPositionX(imgShiftX, idx, silent = false){

    	this.imgs[idx].shiftX = parseFloat(imgShiftX);
    	this.updateImg(this.imgs[idx].img, idx, silent)
    };
    updateImgPositionY(imgShiftY, idx, silent = false){
    	this.imgs[idx].shiftY = parseFloat(imgShiftY);
    	this.updateImg(this.imgs[idx].img, idx, silent)
    };
	
	updateFontSize(fontSize, silent = false){
		this.fontSize = fontSize;
		if(!silent) this.canvasObj.draw();
	}
	updateText(str, silent = false){
		this.str = str;
		if(str) this.fields.text.value = this.str;
        this.canvas.style.letterSpacing = this.options.fontOptions[this.fontSize]['letterSpacing'] + 'px';
        if(!silent) this.canvasObj.draw();
    }
    updateTextColor(colorData, silent = false){
		this.textColor = this.processStaticColorData(colorData);
        if(!silent) this.canvasObj.draw();
    }
	preWrite(){
		for(let fontSize in this.options.fontOptions) 
			this.write('Load', 'center', 'default', fontSize);
		
		this.write('');
	}
    write(str = '', align='center', color='default', fontSize = 'default', shift=null, rad=0){
    	this.context.fillStyle = color === 'default' ? this.textColor : color;
		this.context.strokeStyle = color === 'default' ? this.textColor : color;
    	if(fontSize == 'default')
    		fontSize = this.fontSize;
		let fontStyle = this.options.fontOptions[fontSize].size + 'px ' + this.options.fontOptions[fontSize]['font']['static'];
		let addStroke = (fontSize == 'small' || fontSize == 'medium-small');
		addStroke = false;
		rad = rad ? rad : 0;
		this.context.font = fontStyle;

		let text = this.getText(str);
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
        	this.context.textBaseline = 'middle';
			this.context.textAlign='left';
			
			let x = shift && shift.x ? shift.x : 0, 
				y = shift && shift.y ? shift.y : 0;
			let text_dev_y = this.shape.base == 'triangle' ? 110 : 0;
			y += this.shapeCenter.y;
			let ln;
	        
			let lines = text.lines;
	        x += align == 'align-left' ? this.innerPadding.x : this.shapeCenter.x;
			let lineHeight = this.options.fontOptions[fontSize]['lineHeight'];
			y -= lines.length % 2 == 0 ? (lines.length / 2 - 0.5) * lineHeight : parseInt(lines.length / 2 ) * lineHeight;
			for(let i = 0; i < lines.length; i++) { 
				ln = lines[i];
				let seg_x = align == 'align-left' ? x : x - ln['width'] / 2;
				let ln_y = y + i * lineHeight + text_dev_y;
				this.writeLine(ln, seg_x, ln_y, addStroke);
			}

			return;
        }

        /*
            write watermarks
        */

		this.context.textBaseline = 'alphabetic';
    	let lines = text.lines;
    	let metrics = this.context.measureText(str);
		let actualAscent = metrics.actualBoundingBoxAscent;
		
		let x, y;
		this.context.fillStyle = this.processStaticColorData(this.options.watermarkColorOptions[color]['color']);
		this.context.strokeStyle = this.processStaticColorData(this.options.watermarkColorOptions[color]['color']);
    	if(this.shape.base == 'rectangle' || this.shape.base == 'fill'){
    		let side_x = this.frame.w - this.padding * 2;
			let side_y = this.frame.h - this.padding * 2;
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
    			y = this.shapeCenter.y - side_y / 2 + inner_p_y + actualAscent;
    		}
    		else if(align.indexOf('middle') !== -1){
    			this.context.textBaseline = 'middle';
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
    			this.context.textBaseline = 'middle';
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
	        // let y_dev = 100;
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
    		if(align.indexOf('middle') == -1) return;

    		let inner_p_x = this.innerPadding.x;
    		if(align.indexOf('left') !== -1){
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
    	}
		x += shift && shift.x ? parseInt(shift.x) : 0, 
		y += shift && shift.y ? parseInt(shift.y) : 0;
		this.context.save();
    	if(align.indexOf('middle') !== -1 && (this.shape.base == 'rectangle' || this.shape.base == 'fill')) {
			this.context.textAlign = 'center';
			if(align.indexOf('left') !== -1) 
				rad -= Math.PI/2;
			else if(align.indexOf('right') !== -1) 
				rad += Math.PI/2;
		}
   		// else
		//    this.context.textAlign = 'left';

		this.context.translate(x, y);
		this.context.rotate(rad);
		
		this.drawMultipleLinesFromTop(lines, 0, 0, this.options.fontOptions[fontSize]['lineHeight'], addStroke);
		this.context.restore();
    }
	writeLine(line, initial_x, y, addStroke=false){
		for(let seg of line.segs) {
			this.context.fillStyle = seg.color === 'default' ? this.textColor : seg.color;
			this.context.fillText(seg.content, initial_x, y);
			if(addStroke) this.context.strokeText(seg.content, initial_x, y);
			
			initial_x += this.context.measureText(seg.content).width;
		}
	}

    drawMultipleLinesFromTop(lines, x, y, lineHeight, addStroke = false) {
        for (var i = 0, len = lines.length; i < len; i++) {
            let offset = lineHeight * (i);
			for(let j = 0; j < lines[i].segs.length; j++ ){
				this.context.fillText(lines[i].segs[j].content, x, y + offset);
				if(addStroke) this.context.strokeText(lines[i].segs[j].content, x, y + offset);
			}
            
        }
    }
	getText(str){
		let output = {
			'lines': [],
			'max-width': 0
		};
		let lines = this.getLines(str);
		let p = /(\[.*?\])/g;
		for(let i = 0; i < lines.length; i++) {
			let line = {
				'width': lines[i].width,
				'segs': []
			};
			if(lines.width > output['max-width']) output['max-width'] = lines.width;
			let segs = lines[i].content.split(p);
			for(let seg of segs) {

				line.segs.push( {
					content: seg.match(p) ? seg.substring(1, seg.length - 1) : seg,
					color: seg.match(p) ?  '#ffffff' : 'default'
				});
			}
			output['lines'].push(line);
		}
		return output;
	}
	getLines(str){
		let output = [];
		let temp = str.split('\n');
		for(let i = 0; i < temp.length; i++) {
			let lns = this.breakLineByWidth(temp[i], this.textBoxWidth);
			for(let l of lns) output.push(l);
		}
		return output;
	}
    breakLineByWidth(str, width, filterBrackets = true) {
    	// let arr_by_linebreak = str.split("\n");
    	
    	let line = '';
    	let output = [];
    	let arr = str.split(' ');
		let p = /\[(.*?)\]/g;
		let unit = {
			'content': '',
			'width': 0
		}
		let temp;
		for(let j = 0; j < arr.length; j++)
		{
			temp = line ? line + ' ' + arr[j] : arr[j];
			temp = filterBrackets ? temp.replaceAll(p, "$1") : temp;
			
			let m = this.context.measureText(temp);
			if( m.width <= width) { 
				line = line ? line + ' ' + arr[j] : arr[j];
				unit.width = m.width;
				unit.content = line;
				continue;
			}
			output.push(unit);
			line = arr[j];
			unit = {
				'content': '',
				'width': 0
			}
		}
		temp = line;
		temp = filterBrackets ? temp.replaceAll(p, "$1") : temp;
		let m = this.context.measureText(temp);
		unit.content = line;
		unit.width = m.width;
		output.push(unit);
    	
    	return output;
    }
    updateWatermark(idx, str = false, position = false, color = false, fontSize=false, font=false, shift=null, rad=0, silent = false){
    	super.updateWatermark(idx, str, position, color, fontSize, font, shift, rad);
		if(!silent) this.canvasObj.draw();
	}
	drawWatermarks(){
		this.watermarks.forEach(function(el, i){
			if(this.shape.watermarkPositions == 'all' || this.shape.watermarkPositions.includes(el.position))
				this.write(el.str, el.position, el.color, el.fontSize, el.shift, el.rotate);
		}.bind(this));
	}
	checkWatermarkPosition(position, label){
    	super.checkWatermarkPosition(position, label);
    }

	drawRectangle(){
		console.log(this.padding);
		if(this.cornerRadius * 2 > this.frame.w - (this.padding * 2) )
            this.cornerRadius = (this.frame.w - (this.padding * 2)) / 2;
        let paddingX = this.padding;
        let paddingY = this.padding;
        let side_x = this.frame.w - this.padding * 2;
		let side_y = this.frame.h - this.padding * 2;
		this.textBoxWidth = this.frame.w - this.padding * 2 - this.innerPadding.x * 2;
		if(this.shape.base === 'rectangle')
			this.textBoxWidth = this.textBoxWidth * 0.9;
        this.context.fillStyle = this.color;
        this.context.beginPath();
        this.context.arc(this.frame.x + paddingX + this.cornerRadius, this.frame.y + paddingY + this.cornerRadius, this.cornerRadius, Math.PI, 3 * Math.PI / 2);
        this.context.arc(this.frame.x + side_x + paddingX - this.cornerRadius, this.frame.y + paddingY + this.cornerRadius, this.cornerRadius, 3 * Math.PI / 2, 0);
        this.context.arc(this.frame.x + side_x + paddingX - this.cornerRadius, this.frame.y + side_y + paddingY - this.cornerRadius, this.cornerRadius, 0, Math.PI / 2);
        this.context.arc(this.frame.x + paddingX + this.cornerRadius, this.frame.y + side_y + paddingY - this.cornerRadius, this.cornerRadius, Math.PI / 2, Math.PI);
        this.context.closePath();
        this.context.fill();
	}
	clipRectangle(){
		if(this.cornerRadius * 2 > this.frame.w - (this.padding * 2) )
            this.cornerRadius = (this.frame.w - (this.padding * 2)) / 2;
        let paddingX = this.padding;
        let paddingY = this.padding;
        let side = this.frame.w - this.padding * 2;
        this.textBoxWidth = (this.frame.w - this.padding * 2 - this.innerPadding.x * 2) * 0.9;
		// this.context.save();
        this.context.beginPath();
        this.context.arc(this.frame.x + paddingX + this.cornerRadius, this.frame.y + paddingY + this.cornerRadius, this.cornerRadius, Math.PI, 3 * Math.PI / 2);
        this.context.arc(this.frame.x + side + paddingX - this.cornerRadius, this.frame.y + paddingY + this.cornerRadius, this.cornerRadius, 3 * Math.PI / 2, 0);
        this.context.arc(this.frame.x + side + paddingX - this.cornerRadius, this.frame.y + side + paddingY - this.cornerRadius, this.cornerRadius, 0, Math.PI / 2);
        this.context.arc(this.frame.x + paddingX + this.cornerRadius, this.frame.y + side + paddingY - this.cornerRadius, this.cornerRadius, Math.PI / 2, Math.PI);
        this.context.closePath();
        this.context.clip();
		// this.context.restore();
	}
	drawCircle(){
	    let r = (this.frame.w - (this.padding * 2)) / 2;
	    this.textBoxWidth = (this.frame.w - this.padding * 2 - this.innerPadding.x * 2) * 0.8;
	    this.context.fillStyle = this.color;
	    this.context.beginPath();
	    this.context.arc(this.shapeCenter.x, this.shapeCenter.y, r, 0, 2 * Math.PI, true);
	    this.context.closePath();
	    this.context.fill();
	}
	clipCircle(){
		let r = (this.frame.w - (this.padding * 2)) / 2;
	    this.context.beginPath();
	    this.textBoxWidth = (this.frame.w - this.padding * 2 - this.innerPadding.x * 2) * 0.8;
	    this.context.arc(this.shapeCenter.x, this.shapeCenter.y, r, 0, 2 * Math.PI, true);
	    this.context.clip();
	}
	drawTriangle(){
        this.context.fillStyle = this.color;
        let this_padding = this.padding;
        let width = this.frame.w - this_padding * 2;
        let height = width / 2 * 1.732;
        let y_dev = 120;
        let trangleCenter = {
        	x: this.shapeCenter.x,
        	y: this.shapeCenter.y + y_dev
        }
        let side = this.frame.w - this_padding * 2;
        this.textBoxWidth = (side - this.innerPadding.x * 2) * 0.6;

        this.context.beginPath();
        this.context.arc(this.frame.x + this_padding + this.cornerRadius * 1.732 / 2, trangleCenter.y + height / 3 - this.cornerRadius / 2, this.cornerRadius / 2, Math.PI / 2, 7 * Math.PI / 6);
        this.context.arc(this.frame.x + this.frame.w / 2, trangleCenter.y - height * 2 / 3 + this.cornerRadius, this.cornerRadius / 2, 7 * Math.PI / 6, 11 * Math.PI / 6);
        this.context.arc(this.frame.x + this.frame.w - (this_padding + this.cornerRadius * 1.732 / 2), trangleCenter.y + height / 3 - this.cornerRadius / 2, this.cornerRadius / 2, 11 * Math.PI / 6, Math.PI / 2);
        this.context.closePath();
        this.context.fill();
    }
    clipTriangle(){
        this.padding = this.padding;
        let width = this.frame.w - this.padding * 2;
        let height = width / 2 * 1.732;
        let y_dev = 120;
        let trangleCenter = {
        	x: this.shapeCenter.x,
        	y: this.shapeCenter.y + y_dev
        }
        let side = this.frame.w - this.padding * 2;
        this.textBoxWidth = (this.frame.w - this.padding * 2 - this.innerPadding.x * 2) * 0.6;

        this.context.beginPath();
        this.context.arc(this.frame.x + this.padding + this.cornerRadius * 1.732 / 2, trangleCenter.y + height / 3 - this.cornerRadius / 2, this.cornerRadius / 2, Math.PI / 2, 7 * Math.PI / 6);
        this.context.arc(this.frame.x + this.frame.w / 2, trangleCenter.y - height * 2 / 3 + this.cornerRadius, this.cornerRadius / 2, 7 * Math.PI / 6, 11 * Math.PI / 6);
        this.context.arc(this.frame.x + this.frame.w - (this.padding + this.cornerRadius * 1.732 / 2), trangleCenter.y + height / 3 - this.cornerRadius / 2, this.cornerRadius / 2, 11 * Math.PI / 6, Math.PI / 2);
        this.context.closePath();
        this.context.clip();
    }
    drawHexagon(){
        this.context.fillStyle = this.color;
        this.padding = this.padding;
        let width = this.frame.w - this.padding * 2;
        let height = width / 2 * 1.732;
        let y_dev = 120;
        this.textBoxWidth = (this.frame.w - this.padding * 2 - this.innerPadding.x * 2) * 0.8;

        this.context.beginPath();
        this.context.arc(this.shapeCenter.x - width / 4 + this.cornerRadius / 1.732, this.shapeCenter.y - height / 2 + this.cornerRadius, this.cornerRadius , 7 * Math.PI / 6, 3 * Math.PI / 2);
        this.context.arc(this.shapeCenter.x + width / 4 - this.cornerRadius / 1.732, this.shapeCenter.y - height / 2 + this.cornerRadius, this.cornerRadius, 3 * Math.PI / 2, 11 * Math.PI / 6);
        this.context.arc(this.shapeCenter.x + width / 2 - 2 * this.cornerRadius / 1.732, this.shapeCenter.y, this.cornerRadius, 11 * Math.PI / 6, 13 * Math.PI / 6);
        this.context.arc(this.shapeCenter.x + width / 4 - this.cornerRadius / 1.732, this.shapeCenter.y + height / 2 - this.cornerRadius, this.cornerRadius, Math.PI / 6, 3 * Math.PI / 6);
        this.context.arc(this.shapeCenter.x - width / 4 + this.cornerRadius / 1.732, this.shapeCenter.y + height / 2 - this.cornerRadius, this.cornerRadius , 3 * Math.PI / 6, 5 * Math.PI / 6);
        this.context.arc(this.shapeCenter.x - width / 2 + 2 * this.cornerRadius / 1.732, this.shapeCenter.y, this.cornerRadius, 5 * Math.PI / 6, 7 * Math.PI / 6);
        this.context.closePath();
        this.context.fill();
    }
    clipHexagon(){
    	this.padding = this.padding;
        let width = this.frame.w - this.padding * 2;
        let height = width / 2 * 1.732;
        let y_dev = 120;
        this.textBoxWidth = (this.frame.w - this.padding * 2 - this.innerPadding.x * 2) * 0.8;
 
        this.context.beginPath();
        this.context.arc(this.shapeCenter.x - width / 4 + this.cornerRadius / 1.732, this.shapeCenter.y - height / 2 + this.cornerRadius, this.cornerRadius , 7 * Math.PI / 6, 3 * Math.PI / 2);
        this.context.arc(this.shapeCenter.x + width / 4 - this.cornerRadius / 1.732, this.shapeCenter.y - height / 2 + this.cornerRadius, this.cornerRadius, 3 * Math.PI / 2, 11 * Math.PI / 6);
        this.context.arc(this.shapeCenter.x + width / 2 - 2 * this.cornerRadius / 1.732, this.shapeCenter.y, this.cornerRadius, 11 * Math.PI / 6, 13 * Math.PI / 6);
        this.context.arc(this.shapeCenter.x + width / 4 - this.cornerRadius / 1.732, this.shapeCenter.y + height / 2 - this.cornerRadius, this.cornerRadius, Math.PI / 6, 3 * Math.PI / 6);
        this.context.arc(this.shapeCenter.x - width / 4 + this.cornerRadius / 1.732, this.shapeCenter.y + height / 2 - this.cornerRadius, this.cornerRadius , 3 * Math.PI / 6, 5 * Math.PI / 6);
        this.context.arc(this.shapeCenter.x - width / 2 + 2 * this.cornerRadius / 1.732, this.shapeCenter.y, this.cornerRadius, 5 * Math.PI / 6, 7 * Math.PI / 6);
        this.context.closePath();
        this.context.clip();
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
		this.write(this.str, this.textPosition, 'default', 'default', {x: this.textShiftX, y: this.textShiftY});
		if( this.shape.watermarkPositions !== undefined)
			this.drawWatermarks();
		this.drawCustomGraphic();
	}
	// clip(){
	// 	this.context.save();
	// 	// this.context.fillStyle = this.base;
	// 	// this.context.fillRect(0, 0, this.canvasW, this.canvasH);
	// 	if(this.shape.base == 'rectangle')
	// 		this.clipRectangle();
	// 	else if(this.shape.base == 'circle')
	// 		this.clipCircle();
	// }
	renderNumeralField(id, displayName, begin, step, min=false, extraClass='', extraWrapperClass='')
    {
        let temp_panel_section = document.createElement('DIV');
        temp_panel_section.className  = "panel-section float-container " + extraWrapperClass;
        let temp_label = document.createElement('LABEL');
        temp_label.setAttribute('for', id);
        temp_label.innerText = displayName;
        let temp_input = document.createElement('INPUT');
        temp_input.className = 'field-id-' + id + ' ' + extraClass;
        temp_input.type = 'number';
        temp_input.value = begin;
        temp_input.setAttribute('step', step);
        temp_input.setAttribute('min', min);
		temp_input.id = this.id + '-field-id-' + id;
		let temp_right = document.createElement('DIV');
		temp_right.className = 'half-right flex-container';
		temp_right.appendChild(temp_input);
        temp_panel_section.appendChild(temp_label);
        temp_panel_section.appendChild(temp_right);
        return temp_panel_section;
    }
    renderFileField(id, idx, displayName, extraClass='')
    {
    	let input_id = id + '-' + this.format + '-' + this.id;
        let temp_panel_section = document.createElement('DIV');
        temp_panel_section.className  = "panel-section float-container " + extraClass;
        let temp_pseudo_label = document.createElement('DIV');
        temp_pseudo_label.className = 'pseudo-label';
        temp_pseudo_label.innerText = displayName;
        let temp_label = document.createElement('LABEL');
        temp_label.setAttribute('for', input_id);
		temp_label.setAttribute('flex', 'full');
		temp_label.className = 'flex-item pseudo-upload';
        temp_label.innerText = 'Choose file';
        let temp_input = document.createElement('INPUT');
        temp_input.className = 'field-id-' + id + ' ' + extraClass + ' ' + this.id;
        temp_input.id = input_id;
        temp_input.type = 'file';
		temp_input.setAttribute('image-idx', idx);
		let backgroundImageControls = this.renderImageControls('background-image');
		let temp_right = document.createElement('DIV');
		temp_right.className = 'half-right flex-container';
		temp_right.appendChild(temp_input);
		temp_right.appendChild(temp_label);
		temp_right.appendChild(backgroundImageControls);

        temp_panel_section.appendChild(temp_pseudo_label);
        temp_panel_section.appendChild(temp_right);
		temp_panel_section.id = id + '-panel-section';
		this.fields.imgs[idx] = temp_input;
        return temp_panel_section;
    }

	renderImageControls(id=''){
		let container = document.createElement('DIV');
		container.className = 'field-id-image-controls float-container';
		container.id = id ? id + '-field-id-image-controls' : '';
		let scale = this.renderNumeralField(id + '-background-image-scale', 'Scale', 1.0, 0.1, false, 'img-control-scale', '');
		let x = this.renderNumeralField(id + '-background-image-shift-x', 'X', 0, 1, false, 'img-control-shift-x', '');
		let y = this.renderNumeralField(id + '-background-image-shift-y', 'Y', 0, 1, false, 'img-control-shift-y', '');
		container.append(scale);
		container.append(x);
		container.append(y);

		return container;
	}

	renderControl(){
		super.renderControl();
		// if(this.fields['animation']) this.fields['animation'].parentNode.parentNode.style.display = 'none';
		this.control.appendChild(this.renderSelectField('shape-color', 'Color', this.options.colorOptions));
		if(this.options.colorOptions['upload']) 
			this.control.appendChild(this.renderFileField('background-image', 'background-image', ''));
		
		// if(!this.canvasObj.fields['record'])
		// 	this.control.appendChild(this.canvasObj.renderRecordFetchingForm());
		this.control.appendChild(this.renderTextField('text', 'Text', this.options.textPositionOptions, this.options.textColorOptions, this.options.fontOptions));
		// this.control.appendChild(this.renderFileField('image-1', 'img-0', 'Image 1'));
		this.control.appendChild(super.renderAddWaterMark());
	}

	addListeners(){
		console.log('yaya');
		if(this.fields['shape']) {
			this.fields['shape'].onchange = function(e){
				let shape = this.options.shapeOptions[e.target.value]['shape'];
				this.shape = shape;
				this.updateShape(this.shape);
				let sWatermark_panels = this.control.querySelectorAll('.watermarks-container .panel-section');
				[].forEach.call(sWatermark_panels, function(el, i){
					let availables = shape.watermarkPositions;
					let position = el.querySelector('.watermark-position').value;
					let label = el.querySelector('label[for^="watermark"]');
					this.checkWatermarkPosition(position, label);
				}.bind(this));
			}.bind(this);
		}
		
		if(this.fields['animation']) {
			this.fields['animation'].onchange = function(e){
				// console.log('nimation updated');
				// console.log(e.target.value);
				if(e.target.value !== 'none')
					document.body.classList.add('viewing-three');
				this.canvasObj.sync();
			}.bind(this);
		}
		if(this.fields['text']) {
			this.fields['text'].onchange = function(e){
				let value = e.target.value;
				this.updateText(value);
			}.bind(this);
		}
		if(this.fields['text-font']) {
			this.fields['text-font'].onchange = function(e){
				this.updateFontSize(e.target.value);
			}.bind(this);
		}
		if(this.fields['text-color']) {
			this.fields['text-color'].onchange = function(e){
				let color = this.options.textColorOptions[e.target.value]['color'];
				this.updateTextColor(color);
			}.bind(this);
		}
		if(this.fields['text-position']) {
			this.fields['text-position'].onchange = function(e){
				let position = e.target.value;
				this.updateTextPosition(position);
			}.bind(this);
		}
		if(this.fields['text-shift-x']) {	
			this.fields['text-shift-x'].onchange = function(e){
				this.updateTextShiftX(parseInt(e.target.value));
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
				this.updateTextShiftY(parseInt(e.target.value));
			}.bind(this);
			this.fields['text-shift-y'].onkeydown = e => this.updatePositionByKey(e, {x: this.fields['text-shift-x'], y:this.fields['text-shift-y']}, (shift)=>{
				this.updateTextShiftX(shift.x)
				this.updateTextShiftY(shift.y)
			});
			this.fields['text-shift-y'].onblur = () => {
				this.unfocusInputs([this.fields['text-shift-x'], this.fields['text-shift-y']]);
			}
		}
	    // let sShape_color = this.fields['shape-color'];
		if(this.fields['shape-color']) {
			this.fields['shape-color'].onchange = function(e){
				let sec = e.target.parentNode.parentNode;
				if(e.target.value === 'upload') {
					sec.classList.add('viewing-background-upload');
				}
				else {
					sec.classList.remove('viewing-background-upload');
					if(this.fields.imgs['background-image'])
						this.fields.imgs['background-image'].parentNode.parentNode.classList.remove('viewing-image-control');
					this.updateColor(this.options.colorOptions[e.target.value].color);
				}
			}.bind(this);
		}

		for(let idx in this.fields.imgs) {
			let input = this.fields.imgs[idx];
			input.onclick = function (e) {
				e.target.value = null;
			}.bind(this);
			input.onchange = function(e){
				this.readImage(e);
			}.bind(this);
			let scale_input = input.parentNode.querySelector('.img-control-scale');
			if(scale_input) {
				scale_input.oninput = function(e){
				    e.preventDefault();
				    let scale = e.target.value >= 1 ? e.target.value : 1;
					// let idx = e.target.parentNode.parentNode.parentNode.parentNode.querySelector('input[image-idx]').getAttribute('image-idx');
				    this.updateImgScale(scale, idx);
				}.bind(this);
			}	
			let shift_x_input = input.parentNode.querySelector('.img-control-shift-x');
			shift_x_input.oninput = function(e){
				// let idx = e.target.parentNode.parentNode.parentNode.parentNode.querySelector('input[image-idx]').getAttribute('image-idx');
				this.updateImgPositionX(e.target.value, idx);
			}.bind(this);
			let shift_y_input = input.parentNode.querySelector('.img-control-shift-y');
			shift_y_input.oninput = function(e){
				// let idx = e.target.parentNode.parentNode.parentNode.parentNode.querySelector('input[image-idx]').getAttribute('image-idx');
				this.updateImgPositionX(e.target.value, idx);
			}.bind(this);
		}
	}
	readImage(event) {
		let input = event.target;
		let idx = input.getAttribute('image-idx');
		if (input.files && input.files[0]) {
        	var FR = new FileReader();
            FR.onload = function (e) {
                let image = new Image();
                image.onload = function () {
					// this.imgs[idx].img = background_image;
					this.updateImg(image, idx);	
                }.bind(this);
                image.src = e.target.result;
            }.bind(this);
            FR.readAsDataURL(input.files[0]);
            input.parentNode.parentNode.classList.add('viewing-image-control');
        }
    }
    
    updateFrame(frame = null, silent = false){
		frame = frame ? frame : this.generateFrame();
		// console.log(frame);
    	super.updateFrame(frame);
        if(!silent) this.canvasObj.draw();
    }
	generateShapeCenter(){
		let output = {x: 0, y: 0};
		let shape_num = Object.keys(this.canvasObj.shapes).length;
		let canvas_w = this.canvasObj.canvas.width;
		let canvas_h = this.canvasObj.canvas.height;
		if(shape_num === 1) {
			output.x = canvas_w / 2;
			output.y = canvas_h / 2;
		} else if(shape_num === 2) {
			output.x = canvas_w / 2;
			output.y = this.shape_index == 0 ? canvas_h / 4 : 3 * canvas_h / 4;
		}		
		return output;
	}
	generateFrame()
    {
        let output = {w: 0, h: 0};
		this.shapeCenter = this.generateShapeCenter();
		let canvas_w = this.canvasObj.canvas.width;
		let canvas_h = this.canvasObj.canvas.height;
		let shape_num = Object.keys(this.canvasObj.shapes).length;
		let side = 0;
		if(shape_num === 1) {
			side = canvas_w < canvas_h ? canvas_w : canvas_h; // assuming frames are always square
		}else if (shape_num === 2){
			side = canvas_w > canvas_h / 2 ? canvas_h / 2 : canvas_w;
		}
			output.w = side;
			output.h = side;   

        // if(this.shape.base == 'fill') {
		// 	let side = canvas_w < canvas_h / 2 ? canvas_w : canvas_h / 2; // assuming frames are always square
		// 	output.w = side;
		// 	output.h = side;            
        // }
        // else {
        //     let side = canvas_w < canvas_h / 2 ? canvas_w : canvas_h / 2; // assuming frames are always square
		// 	output.w = side;
		// 	output.h = side; 
        // }
        
        output.x = this.shapeCenter.x - output.w / 2;
        output.y = this.shapeCenter.y - output.h / 2;
		return output;
    }
    sync(){
		console.log(this.counterpart);
		if(!this.counterpart) return;
    	let isSilent = true;
    	this.updateCounterpartSelectField('shape', this.fields['shape'].selectedIndex);
        this.counterpart.updateShape(this.options.shapeOptions[this.fields['shape'].value]['shape'], isSilent);

        this.updateCounterpartSelectField('animation', this.fields['animation'].selectedIndex);
    	this.counterpart.updateAnimation(this.fields['animation'].value, true, isSilent);
    	
    	super.updateCounterpartTextField('text-front', this.fields['text'].value);
    	this.counterpart.updateFrontText(this.fields['text'].value, true);
        
        this.updateCounterpartSelectField('text-front-font', this.fields['text-font'].selectedIndex);
        this.counterpart.updateFrontFontSize(this.fields['text-font'].value, isSilent);

        this.updateCounterpartSelectField('text-front-color', this.fields['text-color'].selectedIndex);
        this.counterpart.updateFrontTextColor(this.options.textColorOptions[this.fields['text-color'].value]['color'], isSilent);
        

        if( this.options.colorOptions[this.fields['shape-color'].value]['color']['type'] == 'solid' || 
            this.options.colorOptions[this.fields['shape-color'].value]['color']['type'] == 'gradient')
        {
        	this.updateCounterpartSelectField('shape-front-color', this.fields['shape-color'].selectedIndex);
            this.counterpart.updateFrontColor(this.options.colorOptions[this.fields['shape-color'].value]['color'], isSilent);
        }
        super.updateCounterpartWatermarks(isSilent);
        this.canvasObj.counterpart.draw();
    }
    updateTextPosition(position, silent = false){
        this.textPosition = position;
        if(!silent) this.canvasObj.draw();
    }
	updateTextShiftX(x, silent = false){
        this.textShiftX = x * this.canvasObj.scale;
        if(!silent) this.canvasObj.draw();
    }
	updateTextShiftY(y, silent = false){
        this.textShiftY = y * this.canvasObj.scale;
        if(!silent) this.canvasObj.draw();
    }
    animate(colorData = false, shape = false){
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
	drawImages(){
		for(let idx in this.imgs) {
			if(idx === 'background-image') continue;
			this.context.drawImage(this.imgs[idx].img, (this.imgs[idx].x + this.imgs[idx].shiftX) * this.canvasObj.scale, (this.imgs[idx].y + this.imgs[idx].shiftY) *  this.canvasObj.scale, this.imgs[idx].img.width * this.canvasObj.scale * this.imgs[idx].scale, this.imgs[idx].img.height * this.canvasObj.scale * this.imgs[idx].scale);
		}
	}
}


import Canvas from "./Canvas.js";
import MediaStatic from './MediaStatic.js'
import { generateFieldId, convertAnimatedPostionToStatic } from './utils/lib.js';

export default class CanvasStatic extends Canvas {
    constructor(wrapper, format, prefix, options){
        super(wrapper, format, prefix, options);
        this.isThree = false;
        this.media = {};
        this.scale = 2;
        if(this.baseOptions['upload'])
			this.media['base-image'] = this.initMedia('base-image', {isShapeColor: true, 'fit': 'cover'});
    }
    init(){
        if(this.initialized) return;
        super.init();
        this.context = this.canvas.getContext('2d');
        for(let shape_id in this.shapes) {
            if(!this.shapes[shape_id].initialized) {
                this.shapes[shape_id].init(this);
            }
        }
        this.addListenersTop();
        if(!this.active) this.hide();
        this.initialized = true;
    }
    addListenersTop(){
        super.addListenersTop();
        // let sBase = this.control_top.querySelector('.field-id-base');
        if(this.fields['base']) {
            this.fields['base'].onchange = function(e){
                let sec = e.target.parentNode.parentNode;
                const m_key = 'base-image';
                if(e.target.value === 'upload') {
					this.base = 'upload';
                    this.media[m_key].show();
					sec.classList.add('viewing-base-image-section');
				} else {                    
                    // delete this.media[key];
                    this.media[m_key].hide();
					this.colorPattern = null;
					sec.classList.remove('viewing-base-image-section');
					this.updateBase(e.target.value);
				}
            }.bind(this);
        }
    }
    initMedia(key, props={}, onUpload=null){
        if(!key) return null;
        const prefix = generateFieldId(this.id, key);
        console.log('initMedia', this.canvas);
        return new MediaStatic(key, prefix, this.canvas, this.draw.bind(this), onUpload, this.mediaOptions, props);
    }
    setFieldCounterparts(){
		/* 
			the prop names are static field names 
			the values are animated field names
		*/
		this.fieldCounterparts['base'] = 'base';
        this.fieldCounterparts['base-image'] = 'base-image';
        this.fieldCounterparts['base-image-scale'] = 'base-image-scale';
        this.fieldCounterparts['base-image-shift-x'] = 'base-image-shift-x';
        this.fieldCounterparts['base-image-shift-y'] = 'base-image-shift-y';
	}
    drawBase(){
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if(this.base === 'upload') {
            if(!this.media['base-image'].obj) return;
            const frame = {
                'w': this.canvas.width,
                'h': this.canvas.height,
                'x': 0,
                'y': 0
            };
            this.colorPattern = this.media['base-image'].generatePattern(this.context, this.canvas, frame);
            this.context.fillStyle = this.colorPattern;
        } else {
            this.context.fillStyle = this.base;
        }
        
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    updateBase(base){
        let colorData = this.baseOptions[base].color;
        if( colorData['type'] == 'solid' || 
            colorData['type'] == 'gradient')
        {

            this.base = this.processStaticColorData(colorData);
        } else return;
		this.draw();
	}
    processStaticColorData(colorData) {
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
				var output = this.context.createLinearGradient(this.canvas.width/2, 0, this.canvas.width/2, this.canvas.height);
			}
			else if(colorData.angle == 45){
				var output = this.context.createLinearGradient(0, this.canvas.height, this.canvas.width, 0);
			}
			
			for(var i = 0; i < colorData.code.length; i++)
			{
				let this_pos = i * 1 / (colorData.code.length - 1);
				output.addColorStop(this_pos, colorData.code[i]);
			}

            return output;
		}
	}
    calibratePosition(x, y){
        return convertAnimatedPostionToStatic(x, y, this.canvas.width, this.canvas.height)
    }
}
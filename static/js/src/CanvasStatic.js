import Canvas from "./Canvas.js";
import MediaStatic from './MediaStatic.js'
import { generateFieldId } from './utils/lib.js';

export default class CanvasStatic extends Canvas {
    constructor(wrapper, format, prefix, options){
        super(wrapper, format, prefix, options);
        this.isThree = false;
        this.media = {};
        this.scale = 2;
        if(this.baseOptions['upload'])
			this.media['base-image'] = this.initMedia('base-image', {isShapeColor: true, 'fit': 'cover'});
    }
    initMedia(key, props={}, onUpload=null){
        if(!key) return null;
        const prefix = generateFieldId(this.id, key);
        return new MediaStatic(key, prefix, this.draw.bind(this), onUpload, this.mediaOptions, props);
    }

    // updateMedia(idx, values, silent = false){
    //     super.updateMedia(idx, values);
    //     console.log('CanvasStatic updateMedia()', idx);
    //     if(idx === 'base-image') {
    //         let temp = document.createElement('canvas');
    //         let temp_ctx = temp.getContext('2d');
    //         temp.width = this.canvas.width;
    //         temp.height = this.canvas.height;
            
    //         let length = this.canvas.width;
                
    //         let temp_scale = 1;
    //         let temp_scaledW = this.media[idx].obj.width * temp_scale;
    //         let temp_scaledH = this.media[idx].obj.height * temp_scale;
            
    //         if(this.media[idx].obj.width > this.media[idx].obj.height)
    //         {
    //             temp_scale = length / this.media[idx].obj.height * this.media[idx].scale;
    //             temp_scaledW = this.media[idx].obj.width * temp_scale;
    //             temp_scaledH = this.media[idx].obj.height * temp_scale;
    //         }
    //         else
    //         {
    //             temp_scale = length / this.media[idx].obj.width * this.media[idx].scale;
    //             temp_scaledW = this.media[idx].obj.width * temp_scale;
    //             temp_scaledH = this.media[idx].obj.height * temp_scale;
    //         }
    //         console.log(this.media[idx]);
    //         this.media[idx].x = temp.width / 2 - temp_scaledW / 2 + this.media[idx]['shift-x'];
            
    //         this.media[idx].y = this.canvas.height / 2 - temp_scaledH / 2 - this.media[idx]['shift-y'] + 0;
            
    //         temp_ctx.drawImage(this.media[idx].obj, this.media[idx].x, this.media[idx].y, temp_scaledW, temp_scaledH);
    //         this.base = this.context.createPattern(temp, "no-repeat");
    //     } 
    //     if(!silent) this.draw();
    // }
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
        super.updateBase(base);
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
}
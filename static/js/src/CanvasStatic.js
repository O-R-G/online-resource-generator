import {initMediaStatic} from "./utils/lib.js"
import Canvas from "./Canvas.js";

export default class CanvasStatic extends Canvas {
    constructor(wrapper, format, prefix, options){
        super(wrapper, format, prefix, options);
        this.isThree = false;
        this.media = {};
        this.scale = 2;
        if(this.baseOptions['upload'])
			this.media['base-image'] = this.initMedia('base-image', {isShapeColor: true});
    }
    initMedia(key, values={}){
        console.log('initMedia')
        if(!key || this.media[key]) return null;
        return initMediaStatic(key, values);
    }
    updateMedia(idx, values, silent = false){
        super.updateMedia(idx, values);
        console.log('CanvasStatic updateMedia()', silent);
        if(idx === 'base-image') {
            let temp = document.createElement('canvas');
            let temp_ctx = temp.getContext('2d');
            temp.width = this.canvas.width;
            temp.height = this.canvas.height;
            
            let length = this.canvas.width;
                
            let temp_scale = 1;
            let temp_scaledW = this.media[idx].obj.width * temp_scale;
            let temp_scaledH = this.media[idx].obj.height * temp_scale;
            
            if(this.media[idx].obj.width > this.media[idx].obj.height)
            {
                temp_scale = length / this.media[idx].obj.height * this.media[idx].scale;
                temp_scaledW = this.media[idx].obj.width * temp_scale;
                temp_scaledH = this.media[idx].obj.height * temp_scale;
            }
            else
            {
                temp_scale = length / this.media[idx].obj.width * this.media[idx].scale;
                temp_scaledW = this.media[idx].obj.width * temp_scale;
                temp_scaledH = this.media[idx].obj.height * temp_scale;
            }

            this.media[idx].x = temp.width / 2 - temp_scaledW / 2 + this.media[idx].shiftX;
            
            this.media[idx].y = this.canvas.height / 2 - temp_scaledH / 2 - this.media[idx].shiftY + 0;
            
            temp_ctx.drawImage(this.media[idx].obj, this.media[idx].x, this.media[idx].y, temp_scaledW, temp_scaledH);
            this.base = this.context.createPattern(temp, "no-repeat");
        } 
        if(!silent) this.draw();
    }
}
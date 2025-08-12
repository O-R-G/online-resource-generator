import Media from './Media.js';

export default class MediaStatic extends Media{
    constructor(key, prefix, canvas, onUpdate, onUpload, options={}, props={}){
        super(key, prefix, canvas, onUpdate, onUpload, options);
        this.props_template = this.shared_props;
        this.isThree = false;
        this.init(props);
    }
    update(props, silent=false){
        super.update(props, silent);
    }
    render(parent){
        return super.render(parent);
    }
    generatePattern(context, canvas, frame){
        console.log(frame)
        if(!this.obj) return null;
        let temp = document.createElement('canvas');
        let temp_ctx = temp.getContext('2d');
        temp.width = canvas.width;
        temp.height = canvas.height;
        let final_scale = this.scale;
        const frame_ratio = frame.h / frame.w; 
        const media_ratio = this.obj.height / this.obj.width; 
        if(frame_ratio > media_ratio) {
            final_scale *= frame.h / this.obj.height;
        } else {
            final_scale *= frame.w / this.obj.width;
        }
        let final_width = this.obj.width * final_scale, final_height = this.obj.height * final_scale;
        this.x = temp.width / 2 - final_width / 2 + this['shift-x'];
        this.y = frame.h / 2 - final_height / 2 - this['shift-y'] + frame.y;
        temp_ctx.drawImage(this.obj, this.x, this.y, final_width, final_height);
        return context.createPattern(temp, "no-repeat");
    }
    updateScale(value, silent = false){
        if(!value) value = 1;
        else value = parseFloat(value);
        this.update({'scale': value}, silent);
    };
    updatePositionX(value, silent = false){
        if(!value) value = 0;
        else value = parseFloat(value);
        this.update({'shift-x': value}, silent);
    };
    updatePositionY(value, silent = false){
        if(!value) value = 0;
        else value = parseFloat(value);
    	this.update({'shift-y': value}, silent);
    };
    updateBlendMode(value, silent=false){
    	this.update({'blend-mode': value}, silent);
    }
    draw(){
        if(!this.obj || this.isShapeColor || !this.isShown) return;
        const context = this.canvas.getContext('2d');
        context.globalCompositeOperation = this['blend-mode'] ? this['blend-mode'] : 'normal';
        context.drawImage(this.obj, (this.x + this['shift-x']), (this.y - this['shift-y']), this.obj.width * this.scale, this.obj.height * this.scale);
        context.globalCompositeOperation = 'normal';
    }
    drawShapeColor(context, canvas, frame){
        return this.generatePattern(context, canvas, frame);
    }
}
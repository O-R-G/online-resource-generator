import * as THREE from "three";
import Canvas from "./Canvas.js";
// import MediaAnimated from './MediaAnimated.js'
import { generateFieldId, getValueByPixelRatio, convertStaticPostionToAnimated } from './utils/lib.js';
import { createMesh, initMediaAnimated, processStaticColorData, generateGradient, generateGridPattern } from './utils/lib-animated.js';

export default class CanvasAnimated extends Canvas {
    constructor(wrapper, format, prefix, options, active){
        super(wrapper, format, prefix, options, active);
        this.isThree = true;
        this.scale = 1;
        this.mesh_base = createMesh('mesh_base');
        this.mesh_base.renderOrder = 0;
        if(this.baseOptions['upload'])
			this.media['base-image'] = this.initMedia('base-image', {mesh: {front: this.mesh_base, back: null}, isShapeColor: true, 'fit': 'cover'});
	}
    init(){
        if(this.initialized) return;
        super.init();
        let width =  this.formatOptions[this.format].w / this.devicePixelRatio;
        let height =  this.formatOptions[this.format].h / this.devicePixelRatio;
        this.canvas.style.width = `${width * this.devicePixelRatio}px`;
        this.canvas.style.height = `${height * this.devicePixelRatio}px`;
        this.canvas.style.transform = `scale(${this.scale / 2})`;
        this.canvas.style.transformOrigin = `0 0`;        
        this.setRenderer();
        this.scene = new THREE.Scene();
        this.scene_base = new THREE.Scene();
        this.aspect = width / height; 
        this.fov = 10 / this.aspect;
        this.setCamera();
        this.scene_base.add(this.mesh_base);
        let path = this.drawRectanglePath();
        this.mesh_base.geometry = new THREE.ShapeGeometry(path);
        

        /* if the window is dragged into a different screen... */
        this.windowResizeListeners.push(()=>{
            if(window.devicePixelRatio !== this.devicePixelRatio) {
                this.initialized = false;
                this.canvas.parentNode.removeChild(this.canvas);
                this.init();
                for(const shape of Object.values(this.shapes))
                    shape.init(this.canvas);
            }
		});
        for(let shape_id in this.shapes) {
            if(!this.shapes[shape_id].initialized) {
                this.shapes[shape_id].init(this);
            }
        }
        if(!this.active) this.hide();
        this.initialized = true;
    }
    addListenersTop(){
        super.addListenersTop();
        if(this.fields['base']) {
            this.fields['base'].onchange = (e) => {
                let value = e.target.value;
                value = value === 'upload' ? value : this.baseOptions[value]['color'];
                if(!value) return;
                this.updateBase(value);
            }
        }
    }
    initMedia(key, props={}, onUpload=null){
        if(!key) return null;
        const prefix = generateFieldId(this.id, key);
        return initMediaAnimated(key, prefix, this.canvas, this.draw.bind(this), onUpload, this.mediaOptions, props);
    }
    updateBase(color, silent = false){
        if(color === 'upload') {
            this.media['base-image'].show();
            this.base = 'upload';
		} else {
            this.media['base-image'].hide();
            this.base = color;
            if(color.type === 'gradient') {
                this.mesh_base.material = this.processColor(color);
            } else
                this.base = color.code;
            
			if(!silent) this.draw();
		}
	}
    processColor(color) {
        let output;
        if(color['type'] == 'solid' || color['type'] == 'transparent') {
            let params = processStaticColorData(color);
            output = new THREE.MeshBasicMaterial( params );
        }
        else if(color['type'] == 'gradient') {
            output = generateGradient(this.mesh_base.geometry, color['code'], color['angle']);
        }
        else if(color['type'] == 'special') {
            if(color['colorName'].indexOf('blue-red') !== -1 ) {
                output = generateGridPattern(color['code'], color['size']);
            }
        }
        return output;
    }
    drawBase(){
        if(this.base === 'upload') {
            this.scene_base.add(this.media['base-image'].mesh.front);
        } else if(this.base.type == 'gradient'){
             this.scene_base.add(this.mesh_base);
        }else { 
            this.renderer.setClearColor( new THREE.Color(this.base));
        }
            
    }
    setRenderer(){
        if(!this.initialized) {
            this.renderer = new THREE.WebGLRenderer({
                'canvas': this.canvas, 
                'antialias': true,
                'preserveDrawingBuffer': true 
            });
            this.renderer.setSize( this.canvas.width, this.canvas.height, false);
            this.renderer.setPixelRatio( this.devicePixelRatio );
            this.canvas.width = this.canvas.width / this.devicePixelRatio;
            this.canvas.height = this.canvas.height / this.devicePixelRatio;
        }
        this.renderer.setSize( this.canvas.width / this.devicePixelRatio, this.canvas.height / this.devicePixelRatio, false);
    }
    setCamera(){
        let z = this.canvas.width * 5.71 * this.devicePixelRatio;
		this.near = z - this.canvas.width / this.scale * this.devicePixelRatio;
		this.far = z + this.canvas.width / this.scale * this.devicePixelRatio;
		this.camera = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
		this.camera.position.set(0, 0, z);
        this.camera.updateProjectionMatrix();

        this.camera_base = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
		this.camera_base.position.set(0, 0, z);
        this.camera_base.updateProjectionMatrix();
    }
    setFieldCounterparts(){
		/* 
			the prop names are animated field names 
			the values are static field names
		*/
		this.fieldCounterparts['base'] = 'base';
        this.fieldCounterparts['base-image'] = 'base-image';
        this.fieldCounterparts['base-image-scale'] = 'base-image-scale';
        this.fieldCounterparts['base-image-shift-x'] = 'base-image-shift-x';
        this.fieldCounterparts['base-image-shift-y'] = 'base-image-shift-y';
	}
    calibratePosition(x, y){
        return convertStaticPostionToAnimated(x, y, this.canvas.width, this.canvas.height)
    }
    render(){
        this.renderer.clear(true, true, true);
        if( (this.base === 'upload' && !this.media['base-image'].isEmpty) || this.base.type === 'gradient' ) {
            this.renderer.autoClear = false;
            this.renderer.render(this.scene_base, this.camera_base);
            this.renderer.clearDepth();
        }
        for(const shape of Object.values(this.shapes))
            this.renderer.render(shape.scene, shape.camera);
        this.renderer.autoClear = true;
    }
    draw(trigger = null){
        super.draw(trigger);
        this.render();
    }
    drawRectanglePath(w,h){
        w = w ? w : getValueByPixelRatio(this.canvas.width);
        h = h ? h : getValueByPixelRatio(this.canvas.height);
        const output = new THREE.Shape();
        let this_r = 0;
        output.moveTo(0 - w / 2, 0 + h / 2 + this_r);
        output.lineTo(0 + w / 2, 0 + h / 2 + this_r);
        output.arc( 0, -this_r, this_r, Math.PI / 2, 0, true);
        output.lineTo( 0 + w / 2 + this_r, 0 + h / 2);
        output.lineTo( 0 + w / 2 + this_r, 0 - h / 2);
        output.arc( -this_r, 0, this_r, 0, 3 * Math.PI / 2, true);
        output.lineTo(0 + w / 2, 0 - (h / 2 + this_r));
        output.lineTo(0 - w / 2, 0 - (h / 2 + this_r));
        output.arc( 0, this_r, this_r, 3 * Math.PI / 2, Math.PI, true);
        output.lineTo(0 -(w / 2 + this_r), 0 - h / 2);
        output.lineTo(0 -(w / 2 + this_r), 0 + h / 2);
        output.arc( this_r, 0, this_r, Math.PI, Math.PI / 2, true);
        output.closePath();

        return output;
    }
}

import * as THREE from "three";
import Canvas from "./Canvas.js";
// import MediaAnimated from './MediaAnimated.js'
import { generateFieldId, getValueByPixelRatio, convertStaticPostionToAnimated } from './utils/lib.js';
import { createMesh, initMediaAnimated, processStaticColorData, generateGradient, generateGridPattern } from './utils/lib-animated.js';

export default class CanvasAnimated extends Canvas {
    constructor(wrapper, format, prefix, options, isThree = false){
        super(wrapper, format, prefix, options, isThree);
        this.isThree = true;
        this.scale = 1;
        this.mesh_base = createMesh('mesh_base');
        let path = this.drawRectanglePath();
        console.log(path);
        // this.mesh_front.geometry = 
        this.mesh_base.geometry = new THREE.ShapeGeometry(path);
        this.mesh_base.renderOrder = 0;
        // this.mesh_base.position.z = -1;
        this.scene_base = new THREE.Scene();
        this.scene_camera = new THREE.Camera();
        this.scene_base.add(this.mesh_base);
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
        
        // this.mesh_base.geometry = new THREE.PlaneGeometry(this.canvas.width, this.canvas.height)
        
        this.setRenderer();
        this.scene = new THREE.Scene();
        this.aspect = width / height;
        this.fov = 10 / this.aspect;
        this.setCamera();

        /* if the window is dragged into a different screen... */
        this.windowResizeListeners.push(()=>{
            if(window.devicePixelRatio !== this.devicePixelRatio) {
                this.initialized = false;
                this.canvas.parentNode.removeChild(this.canvas);
                this.init();
                for(const shape of this.shapes)
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
        console.log('initMedia', this.canvas);
        return initMediaAnimated(key, prefix, this.canvas, this.draw.bind(this), onUpload, this.mediaOptions, props);
    }
    updateBase(color, silent = false){
        // const base_field = this.fields['base'];
		// let sec = base_field.parentNode.parentNode;
        console.log('updateBase', color);
		if(color === 'upload') {
            
			// sec.classList.add('viewing-shape-image-section');
            this.media['base-image'].show();
            this.base = 'upload';
		} else  {
			// sec.classList.remove('viewing-shape-image-section');
            this.base = color.code;
            this.media['base-image'].hide();
			// this.shapeMethod = 'draw';
			// if(color['type'] == 'special') {
			// 	this.mesh_base = this.processColor(color);
			// } else  {
			// 	if(this.mesh_base.material) 
			// 		this.mesh_base.material.dispose();
			// 	this.mesh_base.material = this.processColor(color);
			// 	this.mesh_base.material.needsUpdate = true;
			// }
			
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
            output = generateGradient(this.mesh_front.geometry, color['code'], color['angle']);
        }
        else if(color['type'] == 'special') {
            if(color['colorName'].indexOf('blue-red') !== -1 ) {
                output = generateGridPattern(color['code'], color['size']);
            }
        }
        return output;
    }
    applyImageAsMaterial(idx, mesh, silent){
        const textureLoader = new THREE.TextureLoader();
        return new Promise((resolve, reject) => {
            textureLoader.load(this.media[idx].obj.src, (texture) => {
                // Set texture filtering
                console.log(texture.image);
                texture.magFilter = THREE.LinearFilter;
                texture.minFilter = THREE.LinearFilter;
                texture.colorSpace = THREE.SRGBColorSpace;
                let material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
                mesh.material = material;
                mesh.needsUpdate = true;
                let geometry = mesh.geometry;

                const imageAspect = texture.image.width / texture.image.height;
                geometry.computeBoundingBox();
                const bbox = geometry.boundingBox;
                const geomWidth = bbox.max.x - bbox.min.x;
                const geomHeight = bbox.max.y - bbox.min.y;
                const geometryAspect = geomWidth / geomHeight;

                let scaleX = 1 / this.media[idx].scale;
                let scaleY = 1 / this.media[idx].scale;

                if (imageAspect > geometryAspect) {
                    scaleX *= geometryAspect / imageAspect;
                } else {
                    scaleY *= imageAspect / geometryAspect;
                }

                const dev_x = this.media[idx].shiftX ? getValueByPixelRatio(this.media[idx].shiftX) * scaleX / geomWidth : 0;
                const dev_y = this.media[idx].shiftY ? - getValueByPixelRatio(this.media[idx].shiftY) * scaleY / geomHeight : 0;
                
                const uvArray = [];
                const position = geometry.attributes.position;
                const max = bbox.max;
                const min = bbox.min;

                for (let i = 0; i < position.count; i++) {
                    const x = position.getX(i);
                    const y = position.getY(i);
            
                    let u = (x - min.x) / (max.x - min.x);
                    let v = (y - min.y) / (max.y - min.y);
                    u = u * scaleX + (1 - scaleX) / 2 - dev_x;
                    v = v * scaleY + (1 - scaleY) / 2 + dev_y;

                    // if (u < 0 || u > 1 || v < 0 || v > 1) {
                    // 	u = Math.max(Math.min(u, 1), 0);
                    // 	v = Math.max(Math.min(v, 1), 0);
                    // }
                    uvArray.push(u, v);
                }

                geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));
                geometry.attributes.uv.needsUpdate = true;
                
                if(!silent) this.draw();
                resolve(material);
            });
        })
    }
    drawBase(){
        if(this.base === 'upload') {
            // console.log('adding mesh_base');
            console.log(this.media['base-image'].mesh);
            this.scene_base.add(this.media['base-image'].mesh.front);
        } else {   
            // if(this.mesh_base.parent == this.scene) {
            //     this.scene.remove(this.mesh_base);
            // }
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
        // In your render loop:
        if(this.base === 'upload' && !this.media['base-image'].isEmpty) {
            console.log('rendering base')
            this.renderer.autoClear = false;
            this.renderer.clear();
            this.renderer.render(this.scene_base, this.scene_camera);
            console.log(this.scene_base);
            // this.renderer.render(this.mainScene, this.mainCamera);
        }
        for(const shape of Object.values(this.shapes))
            this.renderer.render(shape.scene, shape.camera);
        
    }
    draw(){
        super.draw();
        this.render();
    }
    drawRectanglePath(w,h){
        w = w ? w : this.canvas.width;
        h = h ? h : this.canvas.height;
        console.log(w, h);
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

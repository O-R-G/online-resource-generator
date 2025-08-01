import * as THREE from "three";
import Media from './Media.js';
import { getValueByPixelRatio } from './utils/lib.js';

export default class MediaAnimated extends Media{
    constructor(key, prefix, onUpdate, onUpload, options={}, props={}){
        super(key, prefix, onUpdate, onUpload, options);
        this.props_template = {
            ...this.shared_props, 
            mesh: null
        };
        this.isThree = true;
        this.isVideo = this.false;
        this.init(props);
    }
    update(props, silent){
        super.update(props, silent);
    }
    render(parent){
        return super.render(parent);
    }
    async applyImageAsMaterial(){
        const textureLoader = new THREE.TextureLoader();
        return new Promise((resolve, reject) => {
            try{
                textureLoader.load(this.obj.src, (texture) => {
                    texture.magFilter = THREE.LinearFilter;
                    texture.minFilter = THREE.LinearFilter;
                    texture.colorSpace = THREE.SRGBColorSpace;
                    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
                        imageWidth = texture.image.width,
                        imageHeight = texture.image.height;
                    if(this.isShapeColor) {
                        /* when media is the shape color, the size/position of the mesh can't be updated  */
                        const imageAspect = imageWidth / imageHeight;
                        for(const key in this.mesh){
                            const mesh = this.mesh[key];
                            if(!mesh) continue;
                            let scaleX = 1 / this.scale,
                                scaleY = 1 / this.scale,
                                uvArray = [],
                                geometry = mesh.geometry;
                            geometry.computeBoundingBox();
                            let bbox = geometry.boundingBox;
                            const geomWidth = bbox.max.x - bbox.min.x,
                                geomHeight = bbox.max.y - bbox.min.y;
                            const geometryAspect = geomWidth / geomHeight;
                            
                            if (imageAspect > geometryAspect) {
                                scaleX *= geometryAspect / imageAspect;
                            } else {
                                scaleY *= imageAspect / geometryAspect;
                            }
                            const dev_x = this['shift-x'] ? getValueByPixelRatio(this['shift-x']) * scaleX / geomWidth : 0;
                            const dev_y = this['shift-y'] ? - getValueByPixelRatio(this['shift-y']) * scaleY / geomHeight : 0;
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

                                uvArray.push(u, v);
                            }
                            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));
                            geometry.attributes.uv.needsUpdate = true;
                            mesh.material = material;
                        }
                    } else {
                        for(const key in this.mesh){
                            const mesh = this.mesh[key];
                            if(!mesh) continue;
                            let scaleX = 1, 
                                scaleY = 1, 
                                scale = this.scale,
                                width = getValueByPixelRatio(imageWidth) * scale, 
                                height = getValueByPixelRatio(imageHeight) * scale,
                                geometry = new THREE.PlaneGeometry(width, height),
                                uvArray = [];
                            mesh.geometry = geometry;
                            geometry.computeBoundingBox();
                            let bbox = geometry.boundingBox;
                            
                            const dev_x = this['shift-x'] ? getValueByPixelRatio(this['shift-x']) * scaleX : 0;
                            const dev_y = this['shift-y'] ? - getValueByPixelRatio(this['shift-y']) * scaleY : 0;
                            
                            const position = geometry.attributes.position;
                            const max = bbox.max;
                            const min = bbox.min;

                            for (let i = 0; i < position.count; i++) {
                                const x = position.getX(i);
                                const y = position.getY(i);
                        
                                let u = (x - min.x) / (max.x - min.x);
                                let v = (y - min.y) / (max.y - min.y);
                                u = u * scaleX + (1 - scaleX) / 2;
                                v = v * scaleY + (1 - scaleY) / 2;
                                uvArray.push(u, v);
                            }
                            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));
                            geometry.attributes.uv.needsUpdate = true;
                        
                            mesh.material = material;
                            if(!mesh.initialized) {
                                mesh.initialized = true;
                                mesh.position.z = 0.5;
                            }
                            const x = (width - getValueByPixelRatio(this.canvas.width)) / 2 + dev_x,
                            y  = - (height - getValueByPixelRatio(this.canvas.height)) / 2 - dev_y;
                            mesh.position.x = x;
                            mesh.position.y = y;
                        }
                    }							
                    resolve();
                });
            } catch(err) {
                console.log(key, this.media);
            }
            
        })
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
    async draw(context){
        if(!this.obj) return;
        if(this.isVideo) {
            this.applyVideoAsMaterial();
        }
        else {
            await this.applyImageAsMaterial()
            // if(!silent) this.canvasObj.draw();
        }
    }
    // drawShapeColor(context, canvas, frame){
    //     return this.generatePattern(context, canvas, frame);
    // }
}
import * as THREE from "three";
import Media from './Media.js';
import { getValueByPixelRatio } from './utils/lib.js';

export default class MediaAnimated extends Media{
    constructor(key, prefix, canvas, onUpdate, onUpload, options={}, props={}){
        super(key, prefix, canvas, onUpdate, onUpload, options);
        this.props_template = {
            ...this.shared_props, 
            mesh: null
        };
        this.isThree = true;
        // this.isVideo = this.false;
        this.init(props);
    }
    update(props, silent=false){
        super.update(props, silent);
    }
    sync(props, silent=false){
        super.sync(props, silent);
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
                            if(!mesh.initialized) {
                                mesh.initialized = true;
                            }
                            mesh.material = material;
                            mesh.material.depthTest = false;
                            mesh.material.depthWrite = false;
                            mesh.material.needsUpdate = true;
                        }
                    } else {
                        console.log('not shape color', this.key);
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
                            console.log('dev', dev_x, dev_y);
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
                            console.log('x', x);
                            mesh.position.x = x;
                            mesh.position.y = y;
                            mesh.material.needsUpdate = true;
                        }
                    }							
                    resolve();
                });
            } catch(err) {
                console.log(key, this.media);
            }
            
        })
    }
    async applyVideoAsMaterial(silent=false, isBack=false){
        // let this.obj = this.media[idx].obj;
        const texture = new THREE.VideoTexture( this.obj );
        for(const key in this.mesh){
            const mesh = this.mesh[key];
            if(!mesh) continue;
            const width = this.obj.videoWidth, height = this.obj.videoHeight;
            const videoAspect = width / height;
            let material = new THREE.MeshBasicMaterial({ map: texture })
            mesh.material = material;

            
            let geometry = new THREE.PlaneGeometry(width, height);
            mesh.geometry = geometry;
            geometry.computeBoundingBox();

            const bbox = geometry.boundingBox;
            const geomWidth = bbox.max.x - bbox.min.x;
            const geomHeight = bbox.max.y - bbox.min.y;
            const geometryAspect = geomWidth / geomHeight;
            // Adjust the UV coordinates to match the aspect ratio
            let offsetX = 0, offsetY = 0, repeatX = 1, repeatY = 1;
            if (videoAspect > geometryAspect) {
                // Video is wider than geometry, scale UV coordinates horizontally
                repeatX = geometryAspect / videoAspect;
                offsetX = (1 - repeatX) / 2;  // Center the video horizontally
            } else {
                // Video is taller than geometry, scale UV coordinates vertically
                repeatY = videoAspect / geometryAspect;
                offsetY = (1 - repeatY) / 2;  // Center the video vertically
            }
            
            // Set the UV transformation on the texture
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.offset.set(offsetX, offsetY);
            texture.repeat.set(repeatX, repeatY);
        }
        
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
    
    async draw(){
        // if(this.key === 'front-background-image') console.log('front-background-image draw');
        // console.log(this.key, this['shift-x'], this.x);
        if((!this.obj && !this.src) || !this.isShown) return;
        // console.log('draw', this);
        console.log(this.isVideo);
        if(this.isVideo) {
            console.log('yaya');
            this.applyVideoAsMaterial();
        }
        else {
            await this.applyImageAsMaterial()
        }
    }
}
import * as THREE from "three";
import Media from './Media.js';
import { getValueByPixelRatio } from './utils/lib.js';

export default class MediaAnimated extends Media{
    constructor(key, prefix, canvas, onUpdate, onUpload, options={}, props={}, file){
        super(key, prefix, canvas, onUpdate, onUpload, options);
        this.props_template = {
            ...this.shared_props, 
            mesh: null
        };
        this.isThree = true;
        this.init(props, file);
    }
    update(props, silent=false){
        super.update(props, silent);
    }
    sync(props, file, silent=false){
        super.sync(props, file, silent);
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
                    const material = new THREE.MeshBasicMaterial({ 
                        map: texture, 
                        transparent: true,
                        depthWrite: false,
                        depthTest: true 
                    }),
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
                            mesh.renderOrder = 0;
                            mesh.material.needsUpdate = true;
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
                            mesh.renderOrder = 0;
                            if(!mesh.initialized) {
                                mesh.initialized = true;
                                mesh.position.z = 0.5;
                            }
                            const x = (width - getValueByPixelRatio(this.canvas.width)) / 2 + dev_x,
                            y  = - (height - getValueByPixelRatio(this.canvas.height)) / 2 - dev_y;
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
		const video = this.obj;
		if(!video) return;
		const texture = new THREE.VideoTexture(video);
		texture.wrapS = THREE.ClampToEdgeWrapping;
		texture.wrapT = THREE.ClampToEdgeWrapping;
		texture.magFilter = THREE.LinearFilter;
		texture.minFilter = THREE.LinearFilter;
		texture.generateMipmaps = false;
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.needsUpdate = true;
		video.loop = true;
		video.addEventListener('ended', () => {
			video.currentTime = 0;
			video.play().catch(()=>{});
		});
		try {
			video.play().catch(()=>{});
		} catch(err) {
			/* ignore play rejection */
		}
		const videoWidth = video.videoWidth || video.width;
		const videoHeight = video.videoHeight || video.height;
		if(!videoWidth || !videoHeight) return;
		const videoAspect = videoWidth / videoHeight;
		for(const key in this.mesh){
			const mesh = this.mesh[key];
			if(!mesh) continue;
			const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
			if(this.isShapeColor) {
				const geometry = mesh.geometry;
				if(!geometry) continue;
				geometry.computeBoundingBox();
				const bbox = geometry.boundingBox;
				const geomWidth = bbox.max.x - bbox.min.x;
				const geomHeight = bbox.max.y - bbox.min.y;
				const geometryAspect = geomWidth / geomHeight;
				let scaleX = 1 / this.scale;
				let scaleY = 1 / this.scale;
				if(videoAspect > geometryAspect) {
					scaleX *= geometryAspect / videoAspect;
				} else {
					scaleY *= videoAspect / geometryAspect;
				}
				const dev_x = this['shift-x'] ? getValueByPixelRatio(this['shift-x']) * scaleX / geomWidth : 0;
				const dev_y = this['shift-y'] ? - getValueByPixelRatio(this['shift-y']) * scaleY / geomHeight : 0;
				const position = geometry.attributes.position;
				const uvArray = [];
				for (let i = 0; i < position.count; i++) {
					const x = position.getX(i);
					const y = position.getY(i);
					let u = (x - bbox.min.x) / (bbox.max.x - bbox.min.x);
					let v = (y - bbox.min.y) / (bbox.max.y - bbox.min.y);
					u = u * scaleX + (1 - scaleX) / 2 - dev_x;
					v = v * scaleY + (1 - scaleY) / 2 + dev_y;
					uvArray.push(u, v);
				}
				geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));
				geometry.attributes.uv.needsUpdate = true;
				mesh.material = material;
				mesh.material.depthTest = false;
				mesh.material.depthWrite = false;
				mesh.material.needsUpdate = true;
				if(!mesh.initialized) mesh.initialized = true;
				continue;
			}

			const scale = this.scale || 1;
			const scaledWidth = getValueByPixelRatio(videoWidth) * scale;
			const scaledHeight = getValueByPixelRatio(videoHeight) * scale;
			const geometry = new THREE.PlaneGeometry(scaledWidth, scaledHeight);
			geometry.computeBoundingBox();
			const bbox = geometry.boundingBox;
			const position = geometry.attributes.position;
			const uvArray = [];
			for (let i = 0; i < position.count; i++) {
				const x = position.getX(i);
				const y = position.getY(i);
				let u = (x - bbox.min.x) / (bbox.max.x - bbox.min.x);
				let v = (y - bbox.min.y) / (bbox.max.y - bbox.min.y);
				uvArray.push(u, v);
			}
			geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));
			geometry.attributes.uv.needsUpdate = true;
			mesh.geometry = geometry;
			mesh.material = material;
			if(!mesh.initialized) {
				mesh.initialized = true;
				mesh.position.z = 0.5;
			}
			const dev_x = this['shift-x'] ? getValueByPixelRatio(this['shift-x']) : 0;
			const dev_y = this['shift-y'] ? - getValueByPixelRatio(this['shift-y']) : 0;
			const canvasWidth = getValueByPixelRatio(this.canvas.width);
			const canvasHeight = getValueByPixelRatio(this.canvas.height);
			mesh.position.x = (scaledWidth - canvasWidth) / 2 + dev_x;
			mesh.position.y = - (scaledHeight - canvasHeight) / 2 - dev_y;
			mesh.material.needsUpdate = true;
		}
	}
    readVideo(src, cb){
        this.isVideo = true;
        if(!src) src = this.src;
        const video = document.createElement('video');
        video.preload = 'auto';
        video.muted = true;
        video.loop = false;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');
        video.src = src;

        const handleLoaded = () => {
            video.removeEventListener('loadeddata', handleLoaded);
            if(typeof cb === 'function') cb(video);
        };

        if(video.readyState >= 2) {
            handleLoaded();
        } else {
            video.addEventListener('loadeddata', handleLoaded, { once: true });
            try {
                video.load();
            } catch(err) {
                /* ignore load errors; callback will not fire without data */
            }
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
        if((!this.obj && !this.src) || !this.isShown) return;
        if(this.isVideo) {
            // console.log('yaya');
            this.applyVideoAsMaterial();
        } else {
            await this.applyImageAsMaterial()
        }
    }
}

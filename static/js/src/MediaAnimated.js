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
        this.videoElement = null;
        this.videoFrameRequest = null;
        this.videoFrameLoop = null;
        this.videoEventHandlers = null;
        this.usingVideoFrameCallback = false;
        this.videoTexture = null;
        this.needsMaterialUpdate = true;        
        this.init(props, file);
    }
    update(props, silent=false){
        const hasObjProp = props && Object.prototype.hasOwnProperty.call(props, 'obj');
        const incomingObj = hasObjProp ? props.obj : undefined;
        const isIncomingVideo = incomingObj instanceof HTMLVideoElement;
        const isReplacingVideo = isIncomingVideo && this.videoElement && incomingObj !== this.videoElement;
        const clearingVideo = hasObjProp && !incomingObj && this.videoElement;

        if(isReplacingVideo || clearingVideo) {
            this.teardownVideo();
        }

        super.update(props, silent);
        if(this.obj instanceof HTMLVideoElement) {
            if(this.videoElement !== this.obj) {
                this.setupVideoElement(this.obj, silent);
            }
            this.isVideo = true;
            this.src = this.obj?.dataset?.source || this.obj.currentSrc || this.obj.src || this.src;
        } else if(isIncomingVideo) {
            // When update was called with a video but retained the same reference
            this.isVideo = true;
        } else if(hasObjProp) {
            this.isVideo = false;
            if(this.videoElement) {
                this.teardownVideo();
            }
            if(this.obj && this.obj.src) {
                this.src = this.obj.src;
            }
        }

        if(this.elements['file-input'] && this.src ) {
            if( this.src.indexOf('data:image') !== -1 )
                this.elements['file-input'].dataset.fileSrc = '';
            else
                this.elements['file-input'].dataset.fileSrc = this.src;
        }
        if(props) {
            this.needsMaterialUpdate = true;
        }
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
        const needsNewTexture = !this.videoTexture || this.videoTexture.image !== video;
        if(needsNewTexture) {
            this.videoTexture = new THREE.VideoTexture(video);
            this.videoTexture.wrapS = THREE.ClampToEdgeWrapping;
            this.videoTexture.wrapT = THREE.ClampToEdgeWrapping;
            this.videoTexture.magFilter = THREE.LinearFilter;
            this.videoTexture.minFilter = THREE.LinearFilter;
            this.videoTexture.generateMipmaps = false;
            this.videoTexture.colorSpace = THREE.SRGBColorSpace;
            this.videoTexture.needsUpdate = true;
        }
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
			const material = new THREE.MeshBasicMaterial({ map: this.videoTexture, transparent: true });
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
        video.className = 'hidden';
        video.loop = true;
        video.muted = true;
        video.preload = 'auto';
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');
        video.crossOrigin = 'anonymous';
        video.dataset.source = src;
        video.src = src;

        const appendIfNeeded = () => {
            if(!video.parentNode && document.body) {
                video.dataset.mediaOwner = this.prefix;
                document.body.appendChild(video);
            }
        };

        const handleReady = async () => {
            appendIfNeeded();
            if(video.videoWidth && video.videoHeight) {
                video.width = video.videoWidth;
                video.height = video.videoHeight;
            }
            try {
                const playPromise = video.play();
                if(playPromise && typeof playPromise.then === 'function') {
                    await playPromise;
                }
            } catch(err) {
                console.warn('Unable to autoplay uploaded video', err);
            }
            if(typeof cb === 'function') {
                cb(video);
            }
        };

        if(video.readyState >= 1) {
            handleReady();
        } else {
            video.addEventListener('loadedmetadata', handleReady, { once: true });
            appendIfNeeded();
            video.load();
        }
    }
    teardownVideo(){
        this.stopVideoLoop();
        if(!this.videoElement) return;

        if(this.videoEventHandlers) {
            const { play, pause, ended, loadeddata, loadedmetadata } = this.videoEventHandlers;
            if(play) this.videoElement.removeEventListener('play', play);
            if(pause) this.videoElement.removeEventListener('pause', pause);
            if(ended) this.videoElement.removeEventListener('ended', ended);
            if(loadeddata) this.videoElement.removeEventListener('loadeddata', loadeddata);
            if(loadedmetadata) this.videoElement.removeEventListener('loadedmetadata', loadedmetadata);
            this.videoEventHandlers = null;
        }

        this.videoElement.pause();
        if(this.videoElement.parentNode && this.videoElement.dataset.mediaOwner === this.prefix) {
            this.videoElement.parentNode.removeChild(this.videoElement);
        }
        this.videoElement.removeAttribute('src');
        this.videoElement.load();
        this.videoElement = null;
        this.isVideo = false;
        this.videoTexture = null;
        this.needsMaterialUpdate = true;
    }
    setupVideoElement(video, silent){
        this.teardownVideo();
        this.videoElement = video;
        this.isVideo = true;
        if(!video.dataset.mediaOwner && document.body) {
            video.dataset.mediaOwner = this.prefix;
        }
        if(!video.parentNode && document.body) {
            document.body.appendChild(video);
        }

        const handlePlay = () => {
            this.startVideoLoop();
        };
        const handlePause = () => {
            this.stopVideoLoop();
        };
        const handleEnded = () => {
            try {
                video.currentTime = 0;
            } catch(err) {}
            const playPromise = video.play();
            if(playPromise && typeof playPromise.then === 'function') {
                playPromise.catch(()=>{});
            }
            this.startVideoLoop();
        };
        const handleMetadata = () => {
            if(video.videoWidth && video.videoHeight) {
                video.width = video.videoWidth;
                video.height = video.videoHeight;
            }
            this.needsMaterialUpdate = true;
            this.requestCanvasDraw();
        };

        this.videoEventHandlers = {
            play: handlePlay,
            pause: handlePause,
            ended: handleEnded,
            loadeddata: handleMetadata,
            loadedmetadata: handleMetadata
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('loadeddata', handleMetadata);
        video.addEventListener('loadedmetadata', handleMetadata);

        if(video.readyState >= 1) {
            handleMetadata();
        }

        if(!silent) {
            this.requestCanvasDraw();
        }

        if(!video.paused && !video.ended) {
            this.startVideoLoop();
        }
    }
    startVideoLoop(){
        if(!this.videoElement || this.videoFrameRequest) return;
        if(typeof this.videoElement.requestVideoFrameCallback === 'function') {
            const loop = () => {
                if(!this.videoElement || this.videoElement.paused || this.videoElement.ended) {
                    this.stopVideoLoop();
                    return;
                }
                this.requestCanvasDraw(true);
                this.videoFrameRequest = this.videoElement.requestVideoFrameCallback(loop);
            };
            this.usingVideoFrameCallback = true;
            this.videoFrameLoop = loop;
            this.videoFrameRequest = this.videoElement.requestVideoFrameCallback(loop);
            return;
        }
        const loop = () => {
            if(!this.videoElement || this.videoElement.paused || this.videoElement.ended) {
                this.stopVideoLoop();
                return;
            }
            this.requestCanvasDraw(true);
            this.videoFrameRequest = requestAnimationFrame(loop);
        };
        this.usingVideoFrameCallback = false;
        this.videoFrameLoop = loop;
        this.videoFrameRequest = requestAnimationFrame(loop);
    }
    stopVideoLoop(){
        if(!this.videoFrameRequest) return;
        if(this.usingVideoFrameCallback && this.videoElement && typeof this.videoElement.cancelVideoFrameCallback === 'function') {
            this.videoElement.cancelVideoFrameCallback(this.videoFrameRequest);
        } else {
            cancelAnimationFrame(this.videoFrameRequest);
        }
        this.videoFrameRequest = null;
        this.videoFrameLoop = null;
        this.usingVideoFrameCallback = false;
    }
    async draw(){
        if((!this.obj && !this.src) || !this.isShown) return;
        if(this.isVideo) {
            if(!this.videoElement && this.obj instanceof HTMLVideoElement) {
                this.setupVideoElement(this.obj, true);
            }
            if(this.needsMaterialUpdate) {
                await this.applyVideoAsMaterial();
                this.needsMaterialUpdate = false;
            }
        } else if(this.needsMaterialUpdate) {
            await this.applyImageAsMaterial();
            this.needsMaterialUpdate = false;
        }
    }
}

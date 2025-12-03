import Media from './Media.js';

export default class MediaStatic extends Media{
    constructor(key, prefix, canvas, onUpdate, onUpload, options={}, props={}, file){
        super(key, prefix, canvas, onUpdate, onUpload, options);
        this.props_template = this.shared_props;
        this.isThree = false;
        this.videoElement = null;
        this.videoFrameRequest = null;
        this.videoFrameLoop = null;
        this.videoEventHandlers = null;
        this.usingVideoFrameCallback = false;
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
    }
    sync(props, file, silent=false){
        super.sync(props, file, silent);
    }
    render(parent){
        return super.render(parent);
    }
    async readVideo(src, cb){
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
    generatePattern(context, canvas, frame){
        if(!this.obj) return null;
        const { width, height } = this.getMediaDimensions();
        if(!width || !height) return null;
        let temp = document.createElement('canvas');
        let temp_ctx = temp.getContext('2d');
        temp.width = canvas.width;
        temp.height = canvas.height;
        let final_scale = this.scale;
        const frame_ratio = frame.h / frame.w; 
        const media_ratio = height / width; 
        if(frame_ratio > media_ratio) {
            final_scale *= frame.h / height;
        } else {
            final_scale *= frame.w / width;
        }
        let final_width = width * final_scale, 
            final_height = height * final_scale;
        this.x = frame.w / 2 - final_width / 2 + this['shift-x'] + frame.x;
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
    draw(context = null){
        if(!this.obj || this.isShapeColor || !this.isShown) return;
        const { width, height } = this.getMediaDimensions();
        if(!width || !height) return;
        const ctx = context ? context : this.canvas.getContext('2d');
        ctx.globalCompositeOperation = this['blend-mode'] ? this['blend-mode'] : 'normal';
        ctx.drawImage(
            this.obj,
            (this.x + this['shift-x']),
            (this.y - this['shift-y']),
            width * this.scale,
            height * this.scale
        );
        ctx.globalCompositeOperation = 'normal';
    }
    drawShapeColor(context, canvas, frame){
        return this.generatePattern(context, canvas, frame);
    }
    requestCanvasDraw(isMediaFrame = false){
        if(typeof this.onUpdate !== 'function') return;
        if(isMediaFrame) {
            this.onUpdate({isMediaFrame: true, mediaKey: this.key});
        } else {
            this.onUpdate();
        }
    }
    restartPlayback(){
        if(!this.isVideo || !this.videoElement) return;
        const video = this.videoElement;
        this.stopVideoLoop();
        try {
            video.currentTime = 0;
        } catch(err) {
            /* ignore inability to seek */
        }
        if(video.paused || video.ended) {
            const playPromise = video.play();
            if(playPromise && typeof playPromise.then === 'function') {
                playPromise.catch(()=>{});
            }
        }
        this.startVideoLoop();
    }
    getMediaDimensions(){
        if(!this.obj) return { width: 0, height: 0 };
        if(this.obj instanceof HTMLVideoElement) {
            const width = this.obj.videoWidth || this.obj.width || 0;
            const height = this.obj.videoHeight || this.obj.height || 0;
            return { width, height };
        }
        const width = this.obj.naturalWidth || this.obj.width || 0;
        const height = this.obj.naturalHeight || this.obj.height || 0;
        return { width, height };
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
    }
    initRecording(){
        this.restartPlayback();
    }
}

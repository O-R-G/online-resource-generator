/*

omggif is a JavaScript implementation of a GIF 89a encoder and decoder.

https://github.com/deanm/omggif


(c) Dean McNamee <dean@gmail.com>, 2013.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.

*/

import * as THREE from "three";
import { ShapeStatic } from "./ShapeStatic.js";
import { ShapeAnimated } from "./ShapeAnimated.js";
import { getDefaultOption } from './lib.js'
import { GifWriter } from 'omggif'
import { jsPDF } from "jspdf";
import { Canvg } from 'canvg';

export class Canvas {
	constructor(wrapper, format, prefix, options, isThree = false){
        this.initialized = false;
		for(const property in options){
			this[property] = options[property];
		}
		this.wrapper = wrapper;
		this.format = format;
		this.isThree = isThree;
		this.prefix = prefix;
        this.id = prefix + '-canvas';
        
		this.chunks = [];
		this.shapes = {};
        this.base = null;
        for(let prop in this.baseOptions) {
            if(this.baseOptions[prop]['default']) this.base = this.baseOptions[prop].color.code;
        }
        if(!this.base) this.base = Object.values(this.baseOptions)[0].color.code;
        this.formatUnit = this.getDefaultOption(this.formatUnitOptions).value;
        this.devicePixelRatio = window.devicePixelRatio;
        this.isRecording = false;
        this.isRecordingGif = false;
        this.isInitRecording = false;
        this.fields = {};
        this.isdebug = false;
        this.scale = this.isThree ? 1 : 2; // for Three.js, the phsical resolution should match the display resolution
        this.r = 1;
        this.pdfSize = {
            'a4': {
                orientation: 'portrait',
                unit: 'cm',
                format: [21, 29.7]
            },
            // 'letter': {
            //     orientation: 'portrait',
            //     unit: 'in',
            //     format: [8.5, 11]
            // }
        }
        this.gifRecordingDuration = 7; // sec
        this.framerate = 60;
        this.pdfWidth = null;
        this.v = null; // canvg
	}
	init(){
        if(this.initialized) return;
        
		this.canvas = this.createCanvas();
        if(!this.isThree)
            this.context = this.canvas.getContext('2d');
        this.wrapper.appendChild(this.canvas);
        if(!this.isThree) {
            if(this.format !== 'custom') {
                this.setCanvasSize(
                    {
                        'width': this.formatOptions[this.format].w,
                        'height': this.formatOptions[this.format].h
                    }
                );
            } else {
                this.setCanvasSize(
                    {
                        'width': this.formatOptions[this.format].w,
                        'height': this.formatOptions[this.format].h
                    }
                );
            }
        } else  {
            this.setCanvasSize(
                {
                    'width': this.formatOptions[this.format].w,
                    'height': this.formatOptions[this.format].h
                }
            );
        }
        
        this.autoRecordingQueue = [];
        this.autoRecordingQueueIdx = 0;
        this.isRecording = false;
        this.isAutoRecording = false;
        this.readyState = 0;
        this.textAmount = 0;
		if(this.isThree) this.initThree();
		this.canvas_stream = this.canvas.captureStream(this.framerate); // fps
	    try{
	    	this.media_recorder = new MediaRecorder(this.canvas_stream, { mimeType: "video/mp4;codecs=avc1" }); // safari
	    	this.media_recorder.ondataavailable = (evt) => { this.chunks.push(evt.data); };
            this.media_recorder.addEventListener('start', ()=>{
                // console.log('start--');
                for(const shape_id in this.shapes) {
                    this.shapes[shape_id].animate(performance.now());
                }
            });
	    }
	    catch(err){
	    	this.media_recorder = null;
	    	alert('This page works on browsers that support MediaRecorder only.');
            return false;
	    }
        for(let shape_id in this.shapes) {
            if(!this.shapes[shape_id].initialized) {
                // console.log(`${shape_id} is not intialized yet`)
                this.shapes[shape_id].init(this);
            }
        }
        this.initialized = true;
        // this.draw();
	}
	initThree(){
        let width =  this.formatOptions[this.format].w / this.devicePixelRatio;
        let height =  this.formatOptions[this.format].h / this.devicePixelRatio;
        this.canvas.style.width = `${width * this.devicePixelRatio}px`;
        this.canvas.style.height = `${height * this.devicePixelRatio}px`;
        // console.log('initThree()');
        // console.log(this.canvas.width);
        this.canvas.style.transform = `scale(${this.scale / 2})`;
        this.canvas.style.transformOrigin = `0 0`;
        this.setRenderer();
        this.scene = new THREE.Scene();
		this.aspect = 1;  // the canvas default
		this.fov = 10;
        this.setCamera();

        /* if the window is dragged into a different screen... */
        window.addEventListener('resize', ()=>{
            if(window.devicePixelRatio !== this.devicePixelRatio) {
                this.initialized = false;
                this.canvas.parentNode.removeChild(this.canvas);
                this.init();
                for(const shape of this.shapes)
                    shape.init(this.canvas);
            }
		})
	}
    createCanvas(){
        const canvas = document.createElement('canvas');
        canvas.setAttribute('format', this.format);
		canvas.id = this.id;
        canvas.className = "org-main-canvas";
        return canvas;
    }
    setRenderer(){
        // console.log(this.canvas.width);
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
            // console.log(this.canvas.width);
        }
        this.renderer.setSize( this.canvas.width / this.devicePixelRatio, this.canvas.height / this.devicePixelRatio, false);
        // console.log(this.canvas.width);
    }
    setCamera(){
        let z = this.canvas.width * 5.72 * this.devicePixelRatio;
		this.near = z - this.canvas.width / this.scale * this.devicePixelRatio;
		this.far = z + this.canvas.width / this.scale * this.devicePixelRatio;
		this.camera = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
		this.camera.position.set(0, 0, z);
    }
    updateAutoRecordingQueue()
    {
        let pattern = /\[(.*?)\]/g;
        let match = this.fields['recordName'].value.split(pattern).filter(word => word != '');
        this.autoRecordingQueue = match;
    }
    initRecording(){
        // console.log('initRecording');
        this.isInitRecording = true;
        this.downloadVideoButton.innerText = 'Loading . . .';
        this.readyState = 0;
        this.resetAnimation();
        setTimeout(()=>{
            this.canvas_stream = this.canvas.captureStream(this.framerate); // fps
            this.chunks = [];
            try{
                // console.log('try?');
                this.media_recorder = new MediaRecorder(this.canvas_stream, { mimeType: "video/mp4;codecs=avc1" }); // safari
                this.media_recorder.ondataavailable = (evt) => { 
                    // console.log('ondataavailable--');
                    this.chunks.push(evt.data); };
                this.media_recorder.addEventListener('start', ()=>{
                    this.isRecording = true;
                    // console.log('start--');
                    // console.log(this)
                    for(const shape_id in this.shapes) {
                        this.shapes[shape_id].animate(performance.now());
                    }
                });
                this.media_recorder.addEventListener('stop', ()=>{
                    // console.log('stop--');
                    this.isRecording = false;
                    this.saveCanvasAsVideo(); 
                });
            } catch{
                console.log('error-0');
            }
            this.downloadVideoButton.innerText = 'Recording . . .';
            document.body.classList.add('recording');
            
            this.startRecording();
        }, 0)
        
    }
    initSavingImage(){
        this.autoRecordingQueueIdx = 0;
        this.isSaving = true;
        this.readyState = 0;
        document.body.classList.add('saving');
        this.prepareNextSaving();
    }
	startRecording(){
        // let now = new Date();
        // let start = now + 1000;
        // console.log('start recording--');
        // console.log('startRecording--');
        this.media_recorder.start(1); 
        // this.animate(true); 
        this.animate(); 
    }
    getDefaultOption(options, returnKey = false){
        return getDefaultOption(options, returnKey);
    }
    saveCanvasAsVideo(mediaType="video/mp4"){
        // Gather chunks of video data into a blob and create an object URL
        let blob = new Blob(this.chunks, {type: mediaType });
        this.recording_url = URL.createObjectURL(blob);
        // Attach the object URL to an <a> element, setting the download file name
        this.downloadA = document.createElement('a');
        this.downloadA.href = this.recording_url;
        let filename = document.getElementById('main').getAttribute('filename');
        if(!filename) filename = 'video';
        filename += '.mp4';
        this.downloadA.download = filename;
        this.downloadA.click();
        this.downloadA.delete;
        URL.revokeObjectURL(this.recording_url);
    }
    saveCanvasAsImage(){
        const link = document.createElement('a');
        let filename = document.getElementById('main').getAttribute('filename');
        if(!filename) filename = 'image';
        filename += '.png';
        link.download = filename;
        // if(this.isThree) var context = this.canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
        link.href = this.canvas.toDataURL();
        link.click();
        link.delete;
        this.autoRecordingQueueIdx++;
        if(this.autoRecordingQueueIdx >= this.autoRecordingQueue.length) {
            this.stopSaving();
        }
        else {
            setTimeout(function(){
                this.prepareNextSaving();
            }.bind(this), 0);
        }
    }
    async initDownloadGif(){
        this.isRecordingGif = true;
        
        // Generate
        const renderFunctions = [];
        for(const s_id in this.shapes) {
            let shape = this.shapes[s_id];
            shape.initAnimate('', true);
            renderFunctions.push(shape[shape.animationName].bind(shape));
        }
        const buffer = await this.saveCanvasAsGif( this.canvas, renderFunctions, this.gifRecordingDuration);

        // Download

        const blob = new Blob( [ buffer ], { type: 'image/gif' } );

        const link = document.createElement( 'a' );
        link.href = URL.createObjectURL( blob );
        let filename = document.getElementById('main').getAttribute('filename');
        if(!filename) filename = 'video';
        filename += '.gif';
        link.download = filename;
        link.dispatchEvent( new MouseEvent( 'click' ) );
        this.isRecordingGif = false;
        this.animate();
    }
    saveCanvasAsGif( element, renderFunctions, duration = 1, fps = 30 ){
        // https://github.com/mrdoob/omggif-example
        const frames = duration * fps;

        const canvas = document.createElement( 'canvas' );
        canvas.width = element.width;
        canvas.height = element.height;

        const context = canvas.getContext( '2d' );
        // context.willReadFrequently = true;

        const buffer = new Uint8Array( canvas.width * canvas.height * frames * 5 );
        const pixels = new Uint8Array( canvas.width * canvas.height );
        const writer = new GifWriter( buffer, canvas.width, canvas.height, { loop: 0 } );
        const delay = 100 / fps; // Delay in hundredths of a sec (100 = 1s)
        let current = 0;

        return new Promise( async function addFrame( resolve ) {
            
            if(Array.isArray(renderFunctions)) {
                for(const fn of renderFunctions) {
                    fn( current / frames );
                }
            } else renderFunctions( current / frames)

            context.drawImage( element, 0, 0 );
            const data = context.getImageData( 0, 0, canvas.width, canvas.height ).data;
            const palette = [];
            for ( var j = 0, k = 0, jl = data.length; j < jl; j += 4, k ++ ) {
                const r = Math.floor( data[ j + 0 ] * 0.1 ) * 10;
                const g = Math.floor( data[ j + 1 ] * 0.1 ) * 10;
                const b = Math.floor( data[ j + 2 ] * 0.1 ) * 10;
                const color = r << 16 | g << 8 | b << 0;
                const index = palette.indexOf( color );
                if ( index === -1 ) {
                    pixels[ k ] = palette.length;
                    palette.push( color );
                } else {
                    pixels[ k ] = index;
                }
            }

            // Force palette to be power of 2
            let powof2 = 1;
            while ( powof2 < palette.length ) powof2 <<= 1;
            palette.length = powof2;
            // powof2 = powof2 > 8 ? 8 : powof2;
            // try {
            //     palette.length = Math.pow(2, powof2)
            // } catch{
            //     console.log('powof2', powof2)
            //     console.log(Math.pow(2, powof2));
            // }
            
            
            // const delay = Math.round(1000 / fps / 10);
            const options = { palette: new Uint32Array( palette ), delay: delay };
            writer.addFrame( 0, 0, canvas.width, canvas.height, pixels, options );

            current ++;

            if ( current < frames ) {
                requestAnimationFrame(() => addFrame(resolve));
                // setTimeout( addFrame, 0, resolve );
            } else {
                resolve( buffer.subarray( 0, writer.end() ) );
            }

        } );
    }
    toPixel(val, source_unit) {
        var n = 1;
        var cpi = 2.54; // centimeters per inch
        // var dpi = 96; // dots per inch
        var dpi = 300; // dots per inch
        var ppd = this.devicePixelRatio; // pixels per dot
        val = parseFloat(val);
        // console.log('toPixel', val * (dpi * ppd), this.devicePixelRatio);
        // return source_unit === 'cm' ? parseInt((val * (dpi * ppd) / cpi).toFixed(n)) : parseInt((val * (dpi * ppd)).toFixed(n));
        return source_unit === 'cm' ? parseInt((val * (dpi) / cpi).toFixed(n)) : parseInt((val * (dpi)).toFixed(n));
    }
    pixelToCm(val){
        var n = 1;
        var cpi = 2.54; // centimeters per inch
        var dpi = 96; // dots per inch
        var ppd = this.devicePixelRatio; // pixels per dot
        return parseFloat((val * cpi  / (dpi * ppd)).toFixed(n));
    }
    promptPdfSize(){
        this.pdfSizePopup.setAttribute('data-hidden', 0);
    }
    async saveCanvasAsPdf(){
        let size = this.generatePdfSize();
        const original_width = this.canvas.width;
        const original_height = this.canvas.height;
        let pdf_width = size['format'][0];
        let pdf_height = size['format'][1];
        let resized_width = this.toPixel(pdf_width, 'in'),
            resized_height = this.toPixel(pdf_height, 'in');
        this.canvas.width = resized_width;
        this.canvas.height = resized_height;
        this.context.save();
        const scaleFactor = resized_width / original_width;
        this.context.scale(scaleFactor, scaleFactor);
        this.draw();
        let pdf = new jsPDF(size);
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" style="background:none;">
                <text x="50" y="100" font-size="40" font-family="Arial">Canvas Text</text>
            </svg>`;
        
        let imgData = this.canvas.toDataURL("image/png", 1.0);
            
        pdf.addImage(imgData, 'PNG', 0, 0, pdf_width, pdf_height);
        pdf.save("download.pdf");

        this.canvas.width = original_width;
        this.canvas.height = original_height;
        this.context.restore();
        this.draw();
    }
    generatePdfSize(){
        let width = parseFloat(this.pdfWidth),
            height = this.pdfWidth * this.canvas.height / this.canvas.width,
            unit = this.formatUnit;

            const output = {
            'orientation': 'portrait',
            'unit': unit,
            'format': [width, height]
        }
        return output;
    }
    
    stopRecording(){
        this.media_recorder.stop(); // https://webkit.org/blog/11353/mediarecorder-api/
        document.body.classList.remove('recording');
        this.downloadVideoButton.innerText = 'Record video';
    }
    stopSaving(){
        this.autoRecordingQueueIdx = 0;
        this.isSaving = false;
        document.body.classList.remove('saving');
    }
    renderSelect(id, options, extraClass=''){
        let temp_select = document.createElement('SELECT');
        temp_select.id = id;
        temp_select.className = 'field-id-' + id + ' ' + extraClass;
        if(typeof options === 'object' && options !== null)
        {
            for (const [key, value] of Object.entries(options)) {
                let temp_option = document.createElement('OPTION');
                temp_option.value = key;
                temp_option.innerText = value['name'];
                temp_select.appendChild(temp_option);
            }
        }

        return temp_select;
    }
    renderSelectField(name, displayName, options, extraClass='', elementExtraClass='')
    {
        let id = this.id + '-field-id-' + name;
        let temp_panel_section = document.createElement('DIV');
        temp_panel_section.className  = "panel-section float-container " + extraClass;
        let temp_label = document.createElement('LABEL');
        temp_label.setAttribute('for', id);
        temp_label.innerText = displayName;
        let temp_right = document.createElement('div');
        temp_right.className = 'half-right flex-container';
        let temp_select = this.renderSelect(id, options, 'flex-item ' + elementExtraClass);
        temp_right.appendChild(temp_select);
        temp_panel_section.appendChild(temp_label);
        temp_panel_section.appendChild(temp_right);
        this.fields[name] = temp_select;
        return temp_panel_section;
    }
    renderFormatField(){
        let formatField = this.renderSelectField('format', 'Format', this.formatOptions, '', 'field-id-format');
        formatField.querySelector('select').setAttribute('flex', 'full');
        if(this.format == 'custom') {
            let customWidth = document.createElement('input');
            customWidth.id="custom-width-input";
            customWidth.placeholder = 'W';
            customWidth.className = 'flex-item';
            customWidth.setAttribute('flex', 3);
            customWidth.value = this.formatOptions['custom']['w'];
            let cross = document.createElement('span');
            cross.innerHTML = '&times;';
            cross.className = 'flex-item';
            let customHeight = document.createElement('input');
            customHeight.id="custom-height-input";
            customHeight.className = 'flex-item';
            customHeight.placeholder="H";
            customHeight.setAttribute('flex', 3);
            customHeight.value = this.formatOptions['custom']['h'];
            let temp_right = formatField.querySelector('.half-right');
            temp_right.appendChild(customWidth);
            temp_right.appendChild(cross);
            temp_right.appendChild(customHeight);

            this.fields['custom-width-input'] = customWidth;
            this.fields['custom-height-input'] = customHeight;
        }
        let options = formatField.querySelectorAll('option');
        [].forEach.call(options, function(el, i){
            if(el.value == this.format)
                el.selected = true;
            
        }.bind(this));
        let select = formatField.querySelector('select');
        select.addEventListener('change', function(event){
            this.changeFormat(event, this.format);
        }.bind(this));
        return formatField;
    }
    renderButtonLikeCheckbox(id, text, extraClass=""){
        let temp_panel_section = document.createElement('div');
        temp_panel_section.className  = "panel-section float-container";
        let temp_label = document.createElement('label');
        temp_label.setAttribute('for', id);
        temp_label.innerText = text;
        temp_label.className = 'button-like-label';
        let temp_input = document.createElement('input');
        temp_input.type = 'checkbox';
        temp_input.id = id;
        temp_input.className = extraClass;
        let temp_right = document.createElement('div');
        temp_right.className = 'half-right flex-container';
        temp_right.appendChild(temp_input);
        temp_right.appendChild(temp_label);
        temp_panel_section.appendChild(temp_right);
        
        return temp_panel_section;
    }
    renderAddShape(extraClass=""){
        let id = this.id + '-add-second-shape';
        let text = 'Add a shape';
        let element = this.renderButtonLikeCheckbox(id, text, extraClass);
        element.id = 'panel-second-shape';
        element.querySelector('input').addEventListener('click', (event)=>{this.toggleSecondShape(event)});
        return element;
    }
    renderDownloadButton(text, extraClass=[]){
        const cls = ['btn'].concat(extraClass);
        const button = document.createElement('button');
        button.className = cls.join(' ');
        button.innerHTML = `<span>${text}</span>`;
        return button;
    }
    renderDownloadImageButton(){
        let button = document.createElement('BUTTON');
        button.className = 'download-image-button btn';
        button.innerText = 'Download image';
        this.downloadImageButton = button;
        return button;
    }
    renderDownloadVideoButton(){
        let button = document.createElement('BUTTON');
        button.className = 'download-video-button btn';
        button.innerText = 'Record';
        this.downloadVideoButton = button;
        return button;
    }
    renderDownloadGifButton(){
        let button = document.createElement('BUTTON');
        button.className = 'download-gif-button btn';
        button.innerText = 'Record (gif)';
        this.downloadGifButton = button;
        return button;
    }
    renderDownloadPdfButton(){
        let button = document.createElement('BUTTON');
        button.className = 'download-pdf-button btn';
        button.innerText = 'Download PDF';
        this.downloadPdfButton = button;
        return button;
    }
    renderPdfSizeBlock(){
        const output = document.createElement('div');
        output.id = `${this.prefix}-pdf-size-popup`;
        output.className = 'pdf-size-popup';
        output.setAttribute('data-hidden', 1);
        let flex_container = document.createElement('div');
        flex_container.className = 'flex-container';
        this.pdfSizeInput = document.createElement('input');
        this.pdfSizeInput.id = `${this.prefix}-pdf-width-input`;
        this.pdfSizeInput.className = 'flex-item';
        this.pdfSizeInput.setAttribute('flex', 7);
        flex_container.appendChild(this.pdfSizeInput);
        if(this.formatUnitOptions) {
            let id = `${this.id}-formatUnit`;
            this.pdfSizeUnitInput = this.renderSelect(id, this.formatUnitOptions)
            this.pdfSizeUnitInput.className = 'flex-item';
            this.pdfSizeUnitInput.setAttribute('flex', 1);
            flex_container.appendChild(this.pdfSizeUnitInput);
        }
        let p = document.createElement('p');
        p.for = this.pdfSizeInput.id;
        p.innerText = 'Please enter the width of the generated pdf';
        
        let buttons_container = document.createElement('div');
        buttons_container.className = 'buttons-container';
        this.confirmPdfSizeButton = document.createElement('button');
        this.confirmPdfSizeButton.className = 'btn';
        this.confirmPdfSizeButton.innerText = 'Confirm';
        this.cancelPdfSizeButton = document.createElement('button');
        this.cancelPdfSizeButton.className = 'btn';
        this.cancelPdfSizeButton.innerText = 'Cancel';
        
        buttons_container.appendChild(this.cancelPdfSizeButton);
        buttons_container.appendChild(this.confirmPdfSizeButton);
        output.appendChild(p);
        output.appendChild(flex_container);
        output.appendChild(buttons_container);
        this.addListenersPdfSizePopup();
        return output;
    }
    addShape(shapeObj){
        this.shapes[shapeObj.id] = shapeObj;
    }
    addControl(control_wrapper)
    {
    	this.control_wrapper = control_wrapper;
        this.control_top = document.createElement('DIV');
        this.control_top.className = 'common-control common-control-top';
        this.control_top.classList.add(this.isThree ? 'animated-common-control' : 'static-common-control');
        this.control_top.id = this.id + '-common-control-top';
        this.control_bottom = document.createElement('DIV');
        this.control_bottom.className = 'common-control common-control-bottom';
        this.control_bottom.classList.add(this.isThree ? 'animated-common-control' : 'static-common-control');
        this.control_bottom.id = this.id + '-common-control-bottom';
        this.control_shape = document.createElement('DIV');
        this.control_shape.className = 'shape-control-wrapper';
        this.control_wrapper.appendChild(this.control_top);
        this.control_wrapper.appendChild(this.control_shape);
        this.control_wrapper.appendChild(this.control_bottom);
        this.renderControlTop();
        this.renderControlBottom();
        this.pdfSizePopup = this.renderPdfSizeBlock();
        this.control_wrapper.appendChild(this.pdfSizePopup);
    }
    renderControlTop(){
        if(this.formatOptions && Object.keys(this.formatOptions).length > 1)
            this.control_top.appendChild(this.renderFormatField());
        if(this.baseOptions && Object.keys(this.baseOptions).length > 1)
            this.control_top.appendChild(this.renderSelectField('base', 'Base', this.baseOptions, '', 'field-id-base'));
        this.addListenersTop();
    }
    renderControlBottom(){
        this.control_bottom.appendChild(this.renderAddShape('second-shape-button'));
        let buttons_container = document.createElement('div');
        buttons_container.className = 'buttons-container';
        this.downloadImageButton = this.renderDownloadButton('png', ['download-image-button', 'download-button']);
        buttons_container.appendChild(this.downloadImageButton);
        if(!this.isThree) {
            this.downloadPdfButton = this.renderDownloadButton('pdf', ['download-pdf-button', 'download-button']);
            buttons_container.appendChild(this.downloadPdfButton);
        } else {
            this.downloadVideoButton = this.renderDownloadButton('mp4', ['download-video-button', 'download-button']);
            buttons_container.appendChild(this.downloadVideoButton);
            this.downloadGifButton = this.renderDownloadButton('gif', ['download-gif-button', 'download-button']);
            buttons_container.appendChild(this.downloadGifButton);
        }
        this.control_bottom.appendChild(buttons_container);
        // if(!this.isThree) {
        //     this.downloadVideoButton.style.display = 'none';
        //     this.downloadGifButton.style.display = 'none';
        // } else {
        //     this.downloadPdfButton.style.display = 'none';
        // }
        
        this.addListenersBottom();
    }
    addListenersTop(){
    	let sBase = this.control_top.querySelector('.field-id-base');
        if(sBase) {
            sBase.onchange = function(e){
                this.updateBase(e.target.value);
                this.counterpart.updateBase(e.target.value);
            }.bind(this);
        }
	    
        let sCustomWidth = this.control_top.querySelector('#custom-width-input');
        if(sCustomWidth) sCustomWidth.onchange = () => {
            this.setCanvasSize({width: parseInt(sCustomWidth.value)}, null, false);
        };
        let sCustomHeight = this.control_top.querySelector('#custom-height-input');
        if(sCustomHeight) sCustomHeight.onchange = () => {
            this.setCanvasSize({height: parseInt(sCustomHeight.value)}, null, false);
        };
        
    }
    
    addListenersBottom(){
        if(this.downloadImageButton) this.downloadImageButton.onclick = this.saveCanvasAsImage.bind(this);
        if(this.downloadVideoButton) this.downloadVideoButton.onclick = this.initRecording.bind(this);
        if(this.downloadGifButton) this.downloadGifButton.onclick = this.initDownloadGif.bind(this);
        if(this.downloadPdfButton) this.downloadPdfButton.onclick = this.promptPdfSize.bind(this);
    }
    addListenersPdfSizePopup(){
        if(this.pdfSizeUnitInput) {
            this.pdfSizeUnitInput.onchange = ()=>{
                this.formatUnit = this.pdfSizeUnitInput.value;
            }
        }
        if(this.cancelPdfSizeButton) this.cancelPdfSizeButton.onclick = ()=>{
            this.pdfSizePopup.setAttribute('data-hidden', 1);
        }
        if(this.confirmPdfSizeButton) this.confirmPdfSizeButton.onclick = ()=>{
            if(isNaN(this.pdfSizeInput.value)) {
                alert('Please enter a valid number');
                return;
            }
            this.pdfWidth = this.pdfSizeInput.value;
            this.saveCanvasAsPdf();
            this.pdfSizePopup.setAttribute('data-hidden', 1);
        }
    }
    updateBase(base){
    	this.base = base;
		this.draw();
	}
	drawBase(){
		if(!this.isThree)
    	{
    		this.context.fillStyle = this.base;
    		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    	}
    	else
    	{
    		this.renderer.setClearColor( new THREE.Color(this.base));
    	}
	}
    draw(){
        this.drawBase();
        for(let shape_id in this.shapes) {
            this.shapes[shape_id].draw();
        }
    }
    animate(isSilent = false){
        for(let shape_id in this.shapes) {
            let el = this.shapes[shape_id];
            if(this.isThree) el.initAnimate(el.animationName, isSilent);
            else el.animate(el.colorData);
        }
    }
    resetAnimation(){
        for(let shape_id in this.shapes) {
            let el = this.shapes[shape_id];
            if(this.isThree) {
                el.resetAnimation();
            }
        }
    }
    addCounterpart(obj)
    {
        this.counterpart = obj;
        // if(obj.isThree) this.downloadVideoButton.style.display = 'block';
    }
    changeFormat(event, currentFormat, toConfirm=true){
        let el = event ? event.target : this.control_wrapper.querySelector('.field-id-format');
        currentFormat = currentFormat ? currentFormat : el.value;
        if(toConfirm) {
            const confirmChangeFormat = confirm('You are about to change the format. The current content will not be saved. Continue?');
            if(confirmChangeFormat)
            {
                window.location.href = '?format=' + el.value;
                return;
            }
        } else window.location.href = '?format=' + el.value;
        el.value = currentFormat;
        return false;
    }
    toggleSecondShape(event, isSync = false){
        let shapes_length = Object.keys(this.shapes).length;
        if( (isSync || event.target.checked) && shapes_length < 2)
        {
            let format = this.format;            
            let shapeIndex = shapes_length;
            let firstShape = this.shapes[Object.keys(this.shapes)[0]];
            let newShape = this.isThree ? new ShapeAnimated(this.prefix, this, firstShape.options, format, firstShape.fonts, shapeIndex) : new ShapeStatic(this.prefix, this, firstShape.options, format, shapeIndex);
            this.addShape(newShape);
            
            if(!isSync) {
                let counterNewShape = this.counterpart.toggleSecondShape(event, true);
                newShape.addCounterpart(counterNewShape);
            }
            newShape.init(this);
            firstShape.updateFrame();
            if(firstShape.img)
                firstShape.updateImg(firstShape.img);
            this.draw();
            return newShape;
        }
        return false;
    }
    generateFrame(centerX, centerY, canvasW, canvasH, shapeAmount, isThree = false)
    {
        let output = {};
        // assuming vertically stacking only
        let unit_w = canvasW;
        let unit_h = canvasH / shapeAmount;
        let length = unit_w > unit_h ? unit_h : unit_w;
        output.w = length;
        output.h = length;
        output.x = !isThree ? centerX - output.w / 2 : centerX;
        output.y = !isThree ? centerY - output.h / 2 : centerY;
        return output;
    }
    stringToNode(string){
        let div = document.createElement('DIV');
        div.innerHTML = string;
        return div.childNodes;
    }
    divToNl(nodes){
        let output = '';
        [].forEach.call(nodes, function(el){
            if(el.nodeName == 'DIV' && el.previousSibling) output += "\n";
            if(el.nodeName == 'I')
            {
                output += '<i>' +el.textContent+ '</i>';
            }
            else if(el.childNodes && el.childNodes.length !== 0) {
                output += this.divToNl(el.childNodes);
            }
            else if(el.nodeName == 'BR') {

                if(el.previousSibling) {
                    output += el.previousSibling.nodeName == '#text' ? '' : "\n";
                }
                else {
                    output += '';
                }
            }
            else output += el.previousSibling && el.previousSibling.tagName !== 'I' ? '\n' + el.textContent : el.textContent;
            
        }.bind(this));

        return output;
    }

    sync(){
        if(this.fields['base'])
            this.counterpart.fields['base'].selectedIndex = this.fields['base'].selectedIndex;
        this.counterpart.fields['format'].value = this.fields['format'].value;
        if(this.format === 'custom') {
            this.counterpart.fields['custom-width-input'].value = this.fields['custom-width-input'].value;
            this.counterpart.fields['custom-height-input'].value = this.fields['custom-height-input'].value;
            this.counterpart.setCanvasSize({'width': this.fields['custom-width-input'].value, 'height': this.fields['custom-height-input'].value}, null, false);
        } else {
            // console.log(this.canvas.width / 2 * this.scale);
            this.counterpart.setCanvasSize({'width': this.canvas.width, 'height': this.canvas.height}, null, false);
        }
        for(let shape_id in this.shapes) {
            let shape = this.shapes[shape_id];
            shape.sync();
        }
    }
    setCanvasSize(size, callback, silent=true, rescale=false){
        // if(this.isThree) console.log('setCanvasSize()', size);
        let updated = false;

        if(size.width) {
            updated = true;
            this.canvas.width = size.width;
            this.canvas.style.width = size.width / this.scale + 'px';
        }
        if(size.height) {
            updated = true;
            this.canvas.height = size.height;
            this.canvas.style.height = size.height / this.scale + 'px';
        }
        // if(this.isThree) console.log('post setCanvasSize()', this.canvas.width, this.canvas.height);
        if(!this.wrapper.offsetHeight || !updated) return;
        
        if(this.isThree)
        {
            this.setRenderer();
            this.setCamera();
        }
        if(typeof callback === 'function') {
            callback(size);
        }
        if(updated && !silent) {
            for(let shape_id in this.shapes) {
                this.shapes[shape_id].updateCanvasSize();
                this.shapes[shape_id].updateFrame(null, true);
                if(this.isThree)
                    this.shapes[shape_id].drawShape();
            }
            this.draw();
        }

        let event = new CustomEvent('resize');
        this.canvas.dispatchEvent(event);
        return updated;
    }
    toFix(val, digits=2){
        let output = parseFloat(val).toFixed(digits);
        return parseFloat(output);
    }
}

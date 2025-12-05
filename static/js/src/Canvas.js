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
import ShapeStatic from "./ShapeStatic.js";
import ShapeAnimated from "./ShapeAnimated.js";
import { getDefaultOption, getClassString, addExtraAttr } from './utils/lib.js'
import { renderSection, renderNumeralSection, renderSelect, renderSelectSection, renderImageControls, renderFileField } from './utils/render.js'
import { GifWriter } from 'omggif'
import { jsPDF } from "jspdf";
import { Canvg } from 'canvg';

export default class Canvas {
	constructor(wrapper, format, prefix, options, active=false){
        this.initialized = false;
		for(const property in options){
			this[property] = options[property];
		}
		this.wrapper = wrapper;
        this.container = this.wrapper.parentNode.parentNode;
		this.format = format;
		this.prefix = prefix;
        this.id = prefix + '-canvas';
        this.active = active;
        
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
        this.fields.media = {};
        this.colorPattern = null;
		this.media = {};
        this.isdebug = false;
        this.r = 1;
        this.pdfSize = {
            'a4': {
                orientation: 'portrait',
                unit: 'cm',
                format: [21, 29.7]
            },
        }
        this.gifRecordingDuration = 7; // sec
        this.framerate = 60;
        this.pdfWidth = null;
        this.v = null; // canvg

        this.windowResize_timer = null;
        this.windowResizeListeners = [
            this.checkWrapperWidth.bind(this)
        ];
        this.loadedListeners = [
            this.checkWrapperWidth.bind(this)
        ];
        this.canvasResizeListeners = [
            this.checkWrapperWidth.bind(this)
        ]
        this.canvas = this.createCanvas();
        this.isMediaFrame = false;
        this.recording_timer = null;
	}
	init(){
		
        this.wrapper.appendChild(this.canvas);
        this.setCanvasSize(
            {
                'width': this.formatOptions[this.format].w,
                'height': this.formatOptions[this.format].h
            }
        );
        
        this.autoRecordingQueue = [];
        this.autoRecordingQueueIdx = 0;
        this.isRecording = false;
        this.isAutoRecording = false;
        this.readyState = 0;
        this.textAmount = 0;
        this.fieldCounterparts = {};
        this.setFieldCounterparts();
		this.canvas_stream = this.canvas.captureStream(this.framerate); // fps
	    try{
	    	this.media_recorder = new MediaRecorder(this.canvas_stream, { mimeType: "video/mp4;codecs=avc1" }); // safari
	    	this.media_recorder.ondataavailable = (evt) => { this.chunks.push(evt.data); };
            this.media_recorder.addEventListener('start', ()=>{
                for(const shape_id in this.shapes) {
                    this.shapes[shape_id].initRecording(performance.now());
                }
            });
	    }
	    catch(err){
	    	this.media_recorder = null;
	    	alert('This page works on browsers that support MediaRecorder only.');
            return false;
	    }
        
        this.addWindowResizeListeners();
        this.addLoadedListeners();
        this.addCanvasResizeListeners();
	}
    createCanvas(){
        const canvas = document.createElement('canvas');
        canvas.setAttribute('format', this.format);
		canvas.id = this.id;
        canvas.className = "org-main-canvas";
        return canvas;
    }
    
    updateAutoRecordingQueue()
    {
        let pattern = /\[(.*?)\]/g;
        let match = this.fields['recordName'].value.split(pattern).filter(word => word != '');
        this.autoRecordingQueue = match;
    }
    initRecording(duration=10000){
        if(this.isRecording) return;
        this.isInitRecording = true;
        this.downloadVideoButton.innerText = 'Loading . . .';
        this.readyState = 0;
        this.resetAnimation();
        setTimeout(()=>{
            this.canvas_stream = this.canvas.captureStream(this.framerate); // fps
            this.chunks = [];
            try{
                this.media_recorder = new MediaRecorder(this.canvas_stream, { mimeType: "video/mp4;codecs=avc1" }); // safari
                this.media_recorder.ondataavailable = (evt) => { 
                    this.chunks.push(evt.data); };
                this.media_recorder.addEventListener('start', ()=>{
                    console.log('start--');
                    this.isRecording = true;
                    for(const shape_id in this.shapes) {
                        // if(this.isThree)
                        //     this.shapes[shape_id].initAnimate(this.shapes[shape_id].animationName, true);
                        this.shapes[shape_id].initRecording(performance.now());
                    }
                    
                });
                this.media_recorder.addEventListener('stop', ()=>{
                    // console.log('stop');
                    this.isRecording = false;
                    this.saveCanvasAsVideo(); 
                });
                if(this.isThree) {
                    for(const shape_id in this.shapes) {
                        this.shapes[shape_id].initAnimate(this.shapes[shape_id].animationName, true);
                    }
                } else {
                    for(const shape_id in this.shapes) {
                        this.shapes[shape_id].animate();
                    }
                }
                
            } catch (err) {
                console.log('error-0');
                console.log(err);
            }
            this.downloadVideoButton.innerText = 'Recording . . .';
            document.body.classList.add('recording');
            const delay = this.isThree ? 0 : 90; // 60 fps
            console.log('delay', delay);
            setTimeout(()=>{
                // console.log(duration);
                this.startRecording(duration)
            }, delay);
            // this.startRecording();
        }, 0)
        
    }
    initSavingImage(){
        this.autoRecordingQueueIdx = 0;
        this.isSaving = true;
        this.readyState = 0;
        document.body.classList.add('saving');
        this.prepareNextSaving();
    }
	startRecording(duration=0){
        // console.log(duration)
        if(this.isRecording) return;
        this.media_recorder.start(1); 
        if(this.isThree) {
            this.animate(); 
        }
        if(duration > 0) {
            this.recording_timer = setTimeout(()=>{
                this.recording_timer = null;
                this.stopRecording();
            }, duration);
        }
        
    }
    getDefaultOption(options, returnKey = false){
        return getDefaultOption(options, returnKey);
    }
    getClassString(arr){
        return getClassString(arr);
    };
    addExtraAttr(el, attrs){
        addExtraAttr(el, attrs);
        return el;
    };
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
        if(source_unit == 'px')
            return parseInt(parseFloat(val).toFixed(n));
        var cpi = 2.54; // centimeters per inch
        // var dpi = 96; // dots per inch
        var dpi = 300; // dots per inch
        var ppd = this.devicePixelRatio; // pixels per dot
        val = parseFloat(val);
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
        let resized_width = this.toPixel(pdf_width, size['unit']),
            resized_height = this.toPixel(pdf_height, size['unit']);
        this.canvas.width = resized_width;
        this.canvas.height = resized_height;
        this.context.save();
        const scaleFactor = resized_width / original_width;
        this.context.scale(scaleFactor, scaleFactor);
        this.draw();
        let pdf;
        try {
            pdf = new jsPDF(size);
            // const svg = `
            // <svg xmlns="http://www.w3.org/2000/svg" fill="none" style="background:none;">
            //     <text x="50" y="100" font-size="40" font-family="Arial">Canvas Text</text>
            // </svg>`;
        
            let imgData = this.canvas.toDataURL("image/png", 1.0);
                
            pdf.addImage(imgData, 'PNG', 0, 0, pdf_width, pdf_height);
            pdf.save("download.pdf");

            this.canvas.width = original_width;
            this.canvas.height = original_height;
            this.context.restore();
            this.draw();
        } catch(error){
            console.log(error);
            alert(`An error happened when generating the PDF. Please make sure the browser can handle canvas of the specified size (${resized_width}px x ${resized_height}px)`)
        }
        
        
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
        if(!this.isRecording) return;
        this.media_recorder.stop(); // https://webkit.org/blog/11353/mediarecorder-api/
        document.body.classList.remove('recording');
        this.downloadVideoButton.innerText = 'mp4';
    }
    stopSaving(){
        this.autoRecordingQueueIdx = 0;
        this.isSaving = false;
        document.body.classList.remove('saving');
    }
    renderSelect(key, options, extraClass=[], attrs=null, selected_value=null){
        if(!options) return null;
        const ex_cls = ['field-id-' + key].concat(extraClass);
        const id = this.id + '-field-id-' + key;
        return renderSelect(id, options, ex_cls, attrs, selected_value)
    }
    renderSelectSection(key, displayName, data, extraSelectClass=[], extraSectionClass=[], extraAttr = null, extraSectionAttr=null)
    {
        const s_cls = ['field-id-' + key].concat(extraSelectClass);
        const id = this.id + '-field-id-' + key;
        const [section, select] = renderSelectSection(id, displayName, data, s_cls, extraSectionClass, extraAttr = null, extraSectionAttr=null);
        if(!this.fields[key]) this.fields[key] = select;
        return [section, select];
    }
    renderNumeralSection(id, displayName, begin, step, min=false, extraClass='', extraWrapperClass=''){
        return renderNumeralSection(id, displayName, begin, step, min, extraClass, extraWrapperClass);
    }
    renderFormatField(){
        const [format_section] = this.renderSelectSection('format', 'Format', {options: this.formatOptions});
        format_section.querySelector('select').setAttribute('flex', 'full');
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
            let temp_right = format_section.querySelector('.half-right');
            temp_right.appendChild(customWidth);
            temp_right.appendChild(cross);
            temp_right.appendChild(customHeight);

            this.fields['custom-width-input'] = customWidth;
            this.fields['custom-height-input'] = customHeight;
        }
        let options = format_section.querySelectorAll('option');
        [].forEach.call(options, function(el, i){
            if(el.value == this.format)
                el.selected = true;
            
        }.bind(this));
        let select = format_section.querySelector('select');
        select.addEventListener('change', function(event){
            this.changeFormat(event, this.format);
        }.bind(this));
        return format_section;
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
            this.pdfSizeUnitInput = this.renderSelect(id,{options: this.formatUnitOptions})
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
        if(this.baseOptions && Object.keys(this.baseOptions).length > 1) {
            const [base_section] = this.renderSelectSection('base', 'Base', { options: this.baseOptions });
            this.control_top.appendChild(base_section);
            if(this.baseOptions['upload']) {
                const right = base_section.querySelector('.half-right');
                const media_div = document.createElement('div');
			    media_div.className = 'color-upload-section';
                // const m_key = 'base-image';
                let key = this.checkMediaKey('base-image');
                // let [section, right] = this.renderSection('', '', [], key + '-section');
                const m = this.media[key];
                m.addTo(media_div);
                right.appendChild(media_div);

                
			
        	// const m = this.media[key];
			// m.addTo(media_div);
			// shape_right.appendChild(media_div);
            }
        }
            
        this.addListenersTop();
    }
    renderControlBottom(){
        this.control_bottom.appendChild(this.renderAddShape('second-shape-button'));
        let buttons_container = document.createElement('div');
        buttons_container.className = 'buttons-container';
        const button_list = Object.keys(this.downloadOptions);
        if(button_list.includes('png')) {
            this.downloadImageButton = this.renderDownloadButton('png', ['download-image-button', 'download-button']);
            buttons_container.appendChild(this.downloadImageButton);
        }
        if(button_list.includes('pdf') && !this.isThree) {
            this.downloadPdfButton = this.renderDownloadButton('pdf', ['download-pdf-button', 'download-button']);
            buttons_container.appendChild(this.downloadPdfButton);
        }
        if(button_list.includes('mp4')) {
            this.downloadVideoButton = this.renderDownloadButton('mp4', ['download-video-button', 'download-button']);
            buttons_container.appendChild(this.downloadVideoButton);
        }
        if(button_list.includes('gif') && this.isThree) {
            this.downloadGifButton = this.renderDownloadButton('gif', ['download-gif-button', 'download-button']);
            buttons_container.appendChild(this.downloadGifButton);
        }
        
        this.control_bottom.appendChild(buttons_container);
        this.addListenersBottom();
    }
    addListenersTop(){
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
        if(this.downloadVideoButton) this.downloadVideoButton.onclick = ()=>this.initRecording();
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
    readImage(idx, src, cb) {
        let image = new Image();
        image.onload = function (e) {
            if(typeof cb === 'function') {
                cb(idx, image);	
            }
                
        };
        image.src = src;
    }
    updatePositionByKey(e, inputs, cb){
        if(e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        let val = e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -1.0 : 1.0;
        val *= e.shiftKey ? 10 : 1;
        if(e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            if(!inputs.y.value) inputs.y.value = 0;
            inputs.y.value = this.toFix(inputs.y.value) + val;
        } else if(e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            if(!inputs.x.value) inputs.x.value = 0;
            inputs.x.value = this.toFix(inputs.x.value) + val;
        }
        inputs.x.classList.add('pseudo-focused');
        inputs.y.classList.add('pseudo-focused');
        if(typeof cb === 'function') cb({x: inputs.x.value, y: inputs.y.value});
    }
    draw(trigger = null){
        const isMediaFrame = trigger && typeof trigger === 'object' && trigger.isMediaFrame === true;
        this.isMediaFrame = isMediaFrame;
        this.drawBase();
        for(let shape of Object.values(this.shapes)) {
            shape.draw();
        }
        for(let m of Object.values(this.media)) {
            m.draw();
        }
        this.isMediaFrame = false;
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
    }
    changeFormat(event, currentFormat, toConfirm=true){
        let el = event ? event.target : this.control_wrapper.querySelector('.field-id-format');
        currentFormat = currentFormat ? currentFormat : el.value;
        let redirect = new URL(window.location.href);
        redirect.searchParams.set('format', el.value);
        redirect = redirect.toString();
        
        if(toConfirm) {
            const confirmChangeFormat = confirm('You are about to change the format. The current content will not be saved. Continue?');
            if(confirmChangeFormat)
            {
                
                window.location.href = redirect;
                return;
            }
        } else window.location.href = redirect;
        el.value = currentFormat;
        return false;
    }
    toggleSecondShape(event, isSync = false){
        let shapes_length = Object.keys(this.shapes).length;
        // console.log('toggleSecondShape', shapes_length);
        if( (isSync || event.target.checked) && shapes_length < 2)
        {
            let format = this.format;            
            let shapeIndex = shapes_length;
            let firstShape = this.shapes[Object.keys(this.shapes)[0]];
            let newShape = this.isThree ? new ShapeAnimated(this.prefix, this, firstShape.options, format, firstShape.fonts, shapeIndex) : new ShapeStatic(this.prefix, this, firstShape.options, format, shapeIndex);
            this.addShape(newShape);
            
            if(!isSync && this.counterpart) {
                let counterNewShape = this.counterpart.toggleSecondShape(event, true);
                newShape.addCounterpart(counterNewShape);
                counterNewShape.addCounterpart(newShape);
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
            if(el.nodeName == 'I') {
                output += '<i>' +el.textContent+ '</i>';
            }
            else if(el.childNodes && el.childNodes.length !== 0) {
                output += this.divToNl(el.childNodes);
            }
            else if(el.nodeName == 'BR') {
                if(el.previousSibling) {
                    output += el.previousSibling.nodeName == '#text' ? '' : "\n";
                } else {
                    output += '';
                }
            }
            else output += el.previousSibling && el.previousSibling.tagName !== 'I' ? '\n' + el.textContent : el.textContent;
            
        }.bind(this));

        return output;
    }
    checkMediaKey(key){
        if(!key) {
            key = 'media-' + this.mediaIndex;
            displayName = 'Media ' + this.mediaIndex;
            this.mediaIndex++;
        }
        if(!this.media[key]) {
            this.media[key] = this.initMedia(key);
        }
        return key;
    }
    sync(){
        // console.log(this.id + '.sync()');
        if(!this.counterpart) return;
        for(const name in this.fieldCounterparts) {
			let field = this.fields[name];
			let counterField = this.counterpart.fields[this.fieldCounterparts[name]];
			if(!counterField || !field) continue;
            this.updateCounterpartField(field, counterField);
		}
        for(let shape_id in this.shapes) {
            // console.log(shape_id);
            let shape = this.shapes[shape_id];
            shape.sync();
        }
        this.syncMedia();
    }
    updateCounterpartField(field, counter_field){
        let tagName = field.tagName.toLowerCase();
        if(tagName === 'select') {
            let val = field.value;
            if(val !== counter_field.value) {
                let options = counter_field.querySelectorAll('option');
                for(const [index, option] of options.entries()) {
                    if(option.value === val) {
                        this.updateCounterpartSelectField(counter_field, index);
                        break;
                    }
                }
            }
        } else if(tagName === 'textarea' || tagName === 'input') {
            let val = field.value;
            if(!val) return;
            counter_field.value = val;
        }
        counter_field.dispatchEvent(new CustomEvent('change', {detail: {isSilent: true, isSyncing: true}}));
        counter_field.dispatchEvent(new CustomEvent('input',  {detail: {isSilent: true, isSyncing: true}}));
    }
    updateCounterpartSelectField(field, index) {
        if(!this.counterpart) return;
        let f = typeof field === 'string' ? this.counterpart.fields[field] : field;
        if(!f) return false;
        f.selectedIndex = index;
    }
    syncMedia(){
        // console.log('canvas syncMedia');
        const m_key_pattern = /media\-\d+/;
        for(const key in this.media) {
            if(!this.media[key].isShapeColor && this.media[key].isEmpty) delete this.media[key];
        }
        this.media = this.reindexMedia();
        this.counterpart.resetMedia();
        for(const key in this.media) {
            let counter_key = key.match(m_key_pattern) ? key : this.fieldCounterparts[key];
            if(!counter_key) continue;
            const media = this.media[key];
            const props = media.getProps();
            const {calibrated_x, calibrated_y} = this.counterpart.calibratePosition(props.x, props.y);
            props.x = calibrated_x;
            props.y = calibrated_y;
            let file = null;
            if(media.elements['file-input'].files && media.elements['file-input'].files[0]) {
                // console.log(key);
                const dt = new DataTransfer();
                dt.items.add(media.elements['file-input'].files[0]); // add the first file
                file = dt.files;
            } 
            if(this.counterpart.media[counter_key]) {
                this.counterpart.media[counter_key].sync(props, file, true);
            } else {
                this.counterpart.media[counter_key] = this.counterpart.initMedia(key, props);
            }
            if(!media.isShapeColor) {
                this.counterpart.addMediaSection(counter_key, '');
            }
        }
    }
    resetMedia(fieldOnly=false){
        this.mediaIndex = 1;
        if(fieldOnly) {
            this.media = this.reindexMedia();
        } else {
            for(const key in this.media) {
                const m = this.media[key];
                if(m.isShapeColor) continue;
                delete this.media[key];
            }
        }
    }
    reindexMedia(){
        let index = 1;
        let reindexed = {};
        for(let key in this.media) {
            const m = this.media[key];
            if(m.isShapeColor) {
                reindexed[key] = this.media[key];
            } else {
                const new_key = 'media-' + index;
                const m = this.media[key];
                m.updateKey(new_key);
                reindexed[new_key] = m;
                index++;
            }
        }
        return reindexed;
    }
    setCanvasSize(size, callback, silent=true, rescale=false){
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
        if(!this.wrapper.offsetHeight || !updated) return;
        
        if(this.isThree)
        {
            this.aspect = this.canvas.width / this.canvas.height;
            this.fov = 10 / this.aspect;
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
    renderFileField(id, extraClass={'wrapper': [], 'input': []}, extraAttr={'wrapper': null, 'input': null}){
        let input_id = this.id + '-field-id-' + id;
        let output = document.createElement('div');
        let input = document.createElement('input');
        let label = document.createElement('label');
        let extraWrapperClass = extraClass['wrapper'] && extraClass['wrapper'].length ? ' ' + this.getClassString(extraClass['wrapper']) : '';
        output.className = 'field-wrapper ' + input_id + '-wrapper' + extraWrapperClass;
        if(extraAttr['wrapper']) output = this.addExtraAttr(output, extraAttr['wrapper']);
        
        let extraInputClass = extraClass['input'] && extraClass['input'].length ? ' ' + this.getClassString(extraClass['input']) : '';
        input.className = 'field-id-' + id + extraInputClass;
        input.id = input_id;
        input.type = 'file';
		input.setAttribute('image-idx', id);
        label.setAttribute('for', input_id);
		label.className = 'pseudo-upload';
        label.innerText = 'Choose file';
        output.appendChild(input);
        output.appendChild(label);
        this.fields.media[id] = input
        return output;
    }
    renderImageControls(id='', control_data){
        return renderImageControls(id, control_data);
	}
    renderSection(id='', displayName, children=[], extraClass=''){
        return renderSection(id, displayName, children, extraClass);
    }
    addWindowResizeListeners(){
        window.addEventListener('resize', ()=>{
            if(this.windowResize_timer) clearTimeout(this.windowResize_timer);
            this.windowResize_timer = setTimeout(()=>{
                for(const fn of this.windowResizeListeners)
                    fn();
                this.windowResize_timer = null;
            }, 200);
        });
    }
    addCanvasResizeListeners(){
        this.canvas.addEventListener('resize', ()=>{
            for(const fn of this.canvasResizeListeners)
                fn();
        });
    }
    addLoadedListeners(){
        window.addEventListener('DOMContentLoaded', ()=>{
            for(const fn of this.loadedListeners)
                fn();
        });
    }
    checkWrapperWidth(){
        this.wrapper.style.width = 'auto';
        this.wrapper.style.height = 'auto';
        this.wrapper.style.transform = 'none';
        this.wrapper.parentNode.style.width = 'auto';
        this.wrapper.parentNode.style.height = 'auto';
        const canvas_style = window.getComputedStyle(this.canvas);
        const canvas_computed_width = parseFloat(canvas_style.getPropertyValue('width'));
        if(this.wrapper.offsetWidth != canvas_computed_width ) {
            const scale = (this.wrapper.offsetWidth / canvas_computed_width * (2 / this.scale)).toFixed(2);
            const canvas_computed_height = parseFloat(canvas_style.getPropertyValue('height'));
            this.wrapper.style.width = canvas_computed_width + 'px';
            this.wrapper.style.height = canvas_computed_height + 'px';
            this.wrapper.style.transform = `scale(${scale})`;
            this.wrapper.parentNode.style.height = canvas_computed_height * scale + 'px';
        }
    }
    show(){
        this.container.classList.remove('hidden');
        this.container.classList.add('active');
        this.checkWrapperWidth();
    }
    hide(){
        this.container.classList.add('hidden');
        this.container.classList.remove('active');
    }
    activate(){
        if(this.active) return;
        this.active = true;
        this.show();
        this.counterpart.deactivate();
        this.draw();
    }
    deactivate(){
        if(!this.active) return;
        this.active = false;
        this.sync();
        this.hide();
        this.counterpart.activate();
    }
    onSave(){
        // anything to clean up before saving?
        if(this.base !== 'upload' && this.media['base-image']) {
            this.media['base-image'].src = '';
            this.media['base-image'].obj = null;
            this.media['base-image'].checkEmpty();
        }
            
    }
}

import * as THREE from "three";
import { ShapeStatic } from "./ShapeStatic.js";
import { ShapeAnimated } from "./ShapeAnimated.js";
import { getDefaultOption } from './lib.js'

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
	    this.isRecording = false;
        this.fields = {};
        this.isdebug = false;
        this.scale = this.isThree ? 1 : 2;
        this.framerate = 60;
	}
	init(){
        if(this.initialized) return;
        this.initialized = true;
		this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('format', this.format);
		if(!this.isThree)
		  this.context = this.canvas.getContext('2d');
		
		this.canvas.id = this.id;
        
        this.canvas.className = "org-main-canvas";
        this.wrapper.appendChild(this.canvas);
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
	    }
	    catch(err){
	    	this.media_recorder = null;
	    	alert('This page works on browsers that support MediaRecorder only.');
            return false;
	    }
        for(let shape_id in this.shapes) {
            if(!this.shapes[shape_id].initialized) this.shapes[shape_id].init(this);
        }
        this.draw();
	}
    
	initThree(){
		this.renderer = new THREE.WebGLRenderer({
			'canvas': this.canvas, 
			'antialias': true,
            'preserveDrawingBuffer': true 
		});
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( this.canvas.width / window.devicePixelRatio, this.canvas.height / window.devicePixelRatio );
		this.scene = new THREE.Scene();
        
		this.aspect = 1;  // the canvas default
		this.fov = 10;
        let z = this.canvas.width * 5.72 * window.devicePixelRatio;
		this.near = z - this.canvas.width / 2 * window.devicePixelRatio;
		this.far = z + this.canvas.width / 2 * window.devicePixelRatio;
		this.camera = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
		this.camera.position.set(0, 0, z);

	}
    setRenderer(){
        if(!this.initialized) {
            this.renderer = new THREE.WebGLRenderer({
                'canvas': this.canvas, 
                'antialias': true,
                'preserveDrawingBuffer': true 
            });
            this.renderer.setPixelRatio( window.devicePixelRatio );
        }
        this.renderer.setSize( this.canvas.width / window.devicePixelRatio, this.canvas.height / window.devicePixelRatio );
    }
    updateAutoRecordingQueue()
    {
        let pattern = /\[(.*?)\]/g;
        let match = this.fields['recordName'].value.split(pattern).filter(word => word != '');
        this.autoRecordingQueue = match;
    }
    initRecording(){
        this.autoRecordingQueueIdx = 0;
        this.readyState = 0;
        this.downloadVideoButton.innerText = 'Recording . . .';
    	this.chunks = [];
        document.body.classList.add('recording');
        this.animate(false, true);
        // if(!this.isThree) this.startRecording();
    }
    initSavingImage(){
        this.autoRecordingQueueIdx = 0;
        this.isSaving = true;
        this.readyState = 0;
        document.body.classList.add('saving');
        this.prepareNextSaving();
    }
	startRecording(){
        if(this.isRecording) return;
        this.isRecording = true;
    	/* 
            mediaRecorder safari only supports mp4
            but mp4 compression shifts colors
            so adjust grey value in advance
            arrived at color by test outputs
        */
        this.media_recorder.addEventListener('start', ()=>{console.log('start')})
        this.media_recorder.start(1); 

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
        
        this.stopRecording();
    }
    saveCanvasAsImage(){
        const link = document.createElement('a');
        let filename = document.getElementById('main').getAttribute('filename');
        if(!filename) filename = 'image';
        filename += '.png';
        link.download = filename;
        if(this.isThree) var context = this.canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
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
    stopRecording(){
        // this.autoRecordingQueueIdx = 0;
        // this.autoRecordingQueue = [];
        this.isAutoRecording = false;
        this.isRecording = false;
        this.readyState = 0;

        this.media_recorder.stop(); // https://webkit.org/blog/11353/mediarecorder-api/
        document.body.classList.remove('recording');
        this.downloadVideoButton.innerText = 'Record video';

    }
    stopSaving(){
        this.autoRecordingQueueIdx = 0;
        this.isSaving = false;
        this.readyState = 0;
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
            customWidth.setAttribute('flex', 1);
            customWidth.value = this.formatOptions['custom']['w'];
            let cross = document.createElement('span');
            cross.innerHTML = '&times;';
            cross.className = 'flex-item';
            let customHeight = document.createElement('input');
            customHeight.id="custom-height-input";
            customHeight.className = 'flex-item';
            customHeight.placeholder="H";
            customHeight.setAttribute('flex', 1);
            customHeight.value = this.formatOptions['custom']['h'];
            let temp_right = formatField.querySelector('.half-right');
            temp_right.appendChild(customWidth);
            temp_right.appendChild(cross);
            temp_right.appendChild(customHeight);
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
        buttons_container.appendChild(this.renderDownloadImageButton());
        buttons_container.appendChild(this.renderDownloadVideoButton());
        this.control_bottom.appendChild(buttons_container);
        if(!this.isThree) this.downloadVideoButton.style.display = 'none';
        if(this.isThree) {
            
            // this.control_bottom.appendChild(this.renderAutoRecordingField());
            // this.control_bottom.appendChild(this.renderAutoRecordingButton());
        }
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
    animate(isSilent = false, initRecording = false){
        for(let shape_id in this.shapes) {
            let el = this.shapes[shape_id];
            // el.resetAnimation();
            if(initRecording) el.initRecording = true;
            if(this.isThree) el.updateAnimation(el.animationName, isSilent);
            else el.animate(el.colorData);
        }
    }
    addCounterpart(obj)
    {
        this.counterpart = obj;
        if(obj.isThree) this.downloadVideoButton.style.display = 'block';
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
                // setTimeout(function(){
                //     newShape.addCounterpart(counterNewShape);
                // }.bind(this), 0);
                newShape.addCounterpart(counterNewShape);
            }
            // else
            //     newShape.addCounterpart(this.counterpart.shapes[this.counterpart.shapes.length - 1]);
            newShape.init(this);
            firstShape.updateFrame();
            if(firstShape.img)
                firstShape.updateImg(firstShape.img);
            this.draw();
            return newShape;
        }
        return false;
    }
    // renderRecordFetchingForm(){
    //     let container = document.createElement('DIV');
    //     // container.className = 'panel-section float-container';
    //     container.className = 'panel-section float-container hide';
    //     let form = document.createElement('form');
    //     form.setAttribute('method', 'POST');
    //     form.setAttribute('flex', 'full');
    //     form.className = 'flex-item';
    //     let label = document.createElement('LABEL');
    //     label.setAttribute('for', 'recordName');
    //     label.innerText = 'Record';
    //     let input = document.createElement('INPUT');
    //     input.id = 'recordName';
    //     input.name = 'recordName';
    //     input.type = 'text';
    //     input.setAttribute('placeholder', '[record 1][record 2] . . .');
    //     input.setAttribute('required', true);
    //     let input_action = document.createElement('INPUT');
    //     input_action.value = 'fetchRecordByName';
    //     input_action.name = 'action';
    //     input_action.type = 'hidden';
    //     let button = document.createElement('INPUT');
    //     button.type = 'submit';
    //     button.value = 'fetch';
    //     // form.appendChild(label);
    //     form.appendChild(input);
    //     form.appendChild(input_action);
    //     form.appendChild(button);
    //     let temp_right = document.createElement('div');
    //     temp_right.className = 'half-right flex-container';
    //     temp_right.append(form);
    //     container.appendChild(label);
    //     container.appendChild(temp_right);
    //     this.fields['recordName'] = input;
    //     this.fields['record'] = form;
    //     this.fields['fetch'] = button;
    //     this.fields['fetch'].addEventListener('click', function(event){
    //         event.preventDefault();
    //         this.updateAutoRecordingQueue();
    //         let name = this.fields['recordName'].value;
    //         // this.requestRecordByName(event);
    //     }.bind(this));
    //     this.fields['recordName'] = input;
    //     return container;
    // }
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
        this.counterpart.fields['base'].selectedIndex = this.fields['base'].selectedIndex;
        this.counterpart.fields['format'].value = this.fields['format'].value;
        for(let shape_id in this.shapes) {
            let shape = this.shapes[shape_id];
            shape.sync();
        }
    }
    setCanvasSize(size, callback, silent=true, rescale=false){
        let updated = false;
        if(size.width) {
            updated = true;
            this.canvas.width = size.width * this.scale;
            this.canvas.style.width = size.width + 'px';
        }
        if(size.height) {
            updated = true;
            this.canvas.height = size.height *  this.scale;
            this.canvas.style.height = size.height + 'px';
        }
        if(!this.wrapper.offsetHeight || ! updated) return;
        // this.setRenderer()
        if(this.isThree)
            this.initThree();
        // if(this.renderer)
        //     this.renderer.setSize( this.canvas.width / window.devicePixelRatio, this.canvas.height / window.devicePixelRatio );
        // if(size.width > this.wrapper.offsetWidth) {
        //     let style = window.getComputedStyle(this.canvas);
        //     if(style.getPropertyValue('position') === 'absolute') {
        //         let r = this.toFix(this.canvas.height / this.canvas.width * 100);
        //         this.wrapper.style.paddingTop = r + '%';
        //     }
        //     let s = this.toFix(this.wrapper.offsetWidth / size.width);
        //     this.canvas.style.transform = 'scale('+s+')';
        // }
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
            // setTimeout(this.draw.bind(this), 2000);
            this.draw();
        }
        return updated;
    }
    // updateReadyState(){
    //     this.readyState++;
    //     setTimeout(function(){
    //         this.startRecording();
    //     }.bind(this), 0);
    //     // if(this.readyState == this.textAmount || this.textAmount == 0){
            
    //     // }
    // }
    toFix(val, digits=2){
        let output = parseFloat(val).toFixed(digits);
        return parseFloat(output);
    }
}

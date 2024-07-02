import * as THREE from "three";
import { ShapeStatic } from "./ShapeStatic.js";
import { ShapeAnimated } from "./ShapeAnimated.js";

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
        // this.init();
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
        let canvasSizeUpdated = this.setCanvasSize(
            {
                'width': this.formatOptions[this.format].w,
                'height': this.formatOptions[this.format].h
            }, 
            false, 
            ()=>{
                for(let shape_id in this.shapes) {
                    this.shapes[shape_id].updateFrame(false, true);
                }
                // for(let i = 0; i < this.shapes.length; i++) {
                //     this.shapes[i].updateFrame(false, true);
                // }
            }
        );
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
            // this.media_recorder.onstop = () => {this.saveCanvasAsVideo();};
            // this.media_recorder.onstart = () => {console.log('startredoring . . .');};
	    }
	    catch(err){
	    	this.media_recorder = null;
	    	alert('This page works on safari only.');
	    }
        // console.log(this.shapes);
        for(let shape_id in this.shapes) {
            // console.log(this.shapes[shape_id]);
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
        // console.log(this.canvas.width);
        // console.log(this.canvas.height);
		this.scene = new THREE.Scene();
        
		this.aspect = 1;  // the canvas default
		this.fov = 10;
		let z = this.formatOptions[this.format].w * 5.72 * window.devicePixelRatio;
		this.near = z - this.formatOptions[this.format].w / 2 * window.devicePixelRatio;
		this.far = z + this.formatOptions[this.format].w / 2 * window.devicePixelRatio;
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
        // console.log('initRecording()');
        /* =====================================
        
        workflow of recording for animated canvas

        initRecording()
          |
        prepareNextRecording()
          |                   
        [first item?]_______________________
          |                                 |
        false                              true
          |                                 |
        requestRecordByName()               |
          |                                 |
        handleResponse()                    |
          |                                 |
        calling drawForRecording()          |
        of shapes, which renders shapes     |
        and texts on the canvas but         |
        doesn't animate it. when a text     |
        is rendered, it calls               |
        updateReadyState() of canvas.       | 
          |                                 |      
        updateReadyState() manages          |
        readyState and if readyState equals |
        textAmount, it proceeds             |
          |                                 |
        startRecording(), it also  _________|
        calls updateAnimation(), 
        which starts animations of
        the shapes
          |
        the shape calls saveCanvasAsVideo()
        of the canvas once the animation 
        passes recordingBreakPoint
          |
        [autoRecordingQueueIdx >= autoRecordingQueue.length?]
          |                                  |
        false                               true
      .   |                                  |
      . prepareNextRecording()              stopRecording()
      .   |
      |___|

        ===================================== */
        this.autoRecordingQueueIdx = 0;
        this.isRecording = true;
        this.readyState = 0;
        document.body.classList.add('recording');
        // if(this.autoRecordingQueue.length == 0) this.autoRecordingQueue.push('current');
        this.prepareNextRecording();
        // window.addEventListener('keyDown', function(event){
        //     console.log()
        //     if(event.keyCode == '34') this.fakeSaveCanvasAsVideo();

        // }.bind(this));
    }
    initSavingImage(){
        this.autoRecordingQueueIdx = 0;
        this.isSaving = true;
        this.readyState = 0;
        document.body.classList.add('saving');
        this.prepareNextSaving();
    }
    prepareNextRecording(){

        this.readyState = 0;
        this.textAmount = 0;
        // if( this.autoRecordingQueueIdx == 0 || !this.isThree){
        if( this.autoRecordingQueueIdx == 0 || !this.isThree){
            // console.log('this.autoRecordingQueueIdx == 0');
            this.startRecording(); // record the first item in the queue directly
        }
        else {
            // console.log('this.autoRecordingQueueIdx != 0');
            // this.requestRecordByName(false, '', 'recording');
        }
    }
    prepareNextSaving(){
        this.readyState = 0;
        this.textAmount = 0;
        if( this.autoRecordingQueueIdx == 0 )
            this.startRecording(); // save the first item in the queue directly
        // else
        //     this.requestRecordByName(false, '', 'savingImage');
        
    }
	startRecording(){
        // console.log('startRecording()');
        // this.isRecording = true;
        
        // this.downloadVideoButton.innerText = 'Stop & save video';
        this.downloadVideoButton.innerText = 'Recording . . .';
        // alert('Recording stops automatically.');
    	this.chunks = [];
    	/* 
            mediaRecorder safari only supports mp4
            but mp4 compression shifts colors
            so adjust grey value in advance
            arrived at color by test outputs
        */
    	// if (this.base == '#666060')
        //     this.base = '#5B5656';
        // let ready = [];
        // for(let i = 0; i < this.shapes.length; i++)
        // {
        //     if(this.shapes[i].animationName !== 'none') {
        //         console.log('startRecording draw() . . .');
        //         let temp = await this.shapes[i].drawForRecording();
        //     }
        // }
        this.animate();
        // console.log('post-await, recording starting. . .');
        setTimeout(function(){
            if(!this.isdebug) this.media_recorder.start(1); // 1s timeslice (ie data is made available every 1s)
            // if(!this.isThree) {
            //     setTimeout(function(){
            //         this.saveCanvasAsVideo();
            //     }.bind(this), 5000);
            // }
        }.bind(this), 0);
        
    }
    
    // fakeSaveCanvasAsVideo(){
    //     this.autoRecordingQueueIdx++;
    //     setTimeout(function(){
    //         if(this.autoRecordingQueueIdx >= this.autoRecordingQueue.length) {
    //             console.log(this.isRecording)
    //             console.log('saveCanvasAsVideo end');
    //             // this.stopRecording();
    //         }
    //         else this.prepareNextRecording();
    //     }.bind(this), 0);
    // }
    saveCanvasAsVideo(mediaType="video/mp4"){
        // Gather chunks of video data into a blob and create an object URL
        let blob = new Blob(this.chunks, {type: mediaType });
        this.recording_url = URL.createObjectURL(blob);
        // Attach the object URL to an <a> element, setting the download file name
        this.downloadA = document.createElement('a');
        this.downloadA.href = this.recording_url;
        let filename = this.autoRecordingQueue[this.autoRecordingQueueIdx] + '.mp4';
        if (!this.autoRecordingQueue[this.autoRecordingQueueIdx]) filename = 'video.mp4';
        this.downloadA.download = filename;
        // Trigger the file download
        this.downloadA.click();
        this.downloadA.delete;
        URL.revokeObjectURL(this.recording_url);
        this.autoRecordingQueueIdx++;
        // console.log('RecordingQueue: ' + this.autoRecordingQueueIdx +  ' / ' + this.autoRecordingQueue.length);
        this.media_recorder.stop();
        setTimeout(function(){
            if(this.autoRecordingQueueIdx >= this.autoRecordingQueue.length) {
                this.stopRecording();
            }
            else this.prepareNextRecording();
        }.bind(this), 0);
    }
    saveCanvasAsImage(){
        const link = document.createElement('a');
        link.download = this.autoRecordingQueue[this.autoRecordingQueueIdx] + '.png';
        if (!this.autoRecordingQueue[this.autoRecordingQueueIdx]) link.download = 'download.png';
        if(this.isThree) var context = this.canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
        link.href = this.canvas.toDataURL();
        link.click();
        link.delete;
        this.autoRecordingQueueIdx++;
        if(this.autoRecordingQueueIdx >= this.autoRecordingQueue.length) {
            // console.log(this.isRecording)
            // console.log('saveCanvasAsVideo end');
            this.stopSaving();
        }
        else {
            setTimeout(function(){
                this.prepareNextSaving();
            }.bind(this), 0);
        }
    }
    stopRecording(){
        this.autoRecordingQueueIdx = 0;
        this.autoRecordingQueue = [];
        this.isAutoRecording = false;
        this.isRecording = false;
        this.readyState = 0;

        this.media_recorder.stop(); // https://webkit.org/blog/11353/mediarecorder-api/
        // console.log('stop recording');        
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
            
            // let customSizeField = document.createElement('div');
            // customSizeField.id="custom-size-wrapper";
            // customSizeField.className = 'flex-container'
            let customWidth = document.createElement('input');
            customWidth.id="custom-width-input";
            customWidth.placeholder = 'W';
            customWidth.className = 'flex-item';
            customWidth.setAttribute('flex', 1);
            customWidth.value = parseInt(this.canvas.style.width);
            let cross = document.createElement('span');
            cross.innerHTML = '&times;';
            cross.className = 'flex-item';
            let customHeight = document.createElement('input');
            customHeight.id="custom-height-input";
            customHeight.className = 'flex-item';
            customHeight.placeholder="H";
            customHeight.setAttribute('flex', 1);
            customHeight.value = parseInt(this.canvas.style.height);
            let temp_right = formatField.querySelector('.half-right');
            temp_right.appendChild(customWidth);
            temp_right.appendChild(cross);
            temp_right.appendChild(customHeight);
            // formatField.querySelector('.half-right').appendChild(customSizeField);
            // console.log(formatField);
        }
        let options = formatField.querySelectorAll('option');
        [].forEach.call(options, function(el, i){
            if(el.value == this.format)
                el.selected = true;
            
        }.bind(this));
        let select = formatField.querySelector('select');
        select.addEventListener('change', function(event){
            // console.log('format onchange');
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
        // if(!shapeObj.id) {
        //     console.log('addShape(): missing shapeObj id');
        // } else if (this.shapes[shapeObj.id]){
        //     console.log('addShape(): shapeObj id ('+shapeObj.id+') is already taken');
        // }

        this.shapes[shapeObj.id] = shapeObj;
    }
    // renderAutoRecordingField(){
    //     let id = 'auto-recording-records';
    //     let temp_panel_section = document.createElement('DIV');
    //     temp_panel_section.className  = "panel-section float-container ";
    //     let temp_label = document.createElement('LABEL');
    //     temp_label.setAttribute('for', id);
    //     temp_label.className = 'button-like-label';
    //     let temp_input = document.createElement('INPUT');
    //     temp_input.type = 'text';
    //     temp_input.id = id;
    //     temp_panel_section.appendChild(temp_input);
    //     temp_panel_section.appendChild(temp_label);
    //     this.fields[id] = temp_input;
    //     return temp_panel_section;
    // }
    // renderAutoRecordingButton(){
    //     let button = document.createElement('BUTTON');
    //     button.className = 'btn';
    //     button.innerText = 'Auto-record';
    //     this.autoRecordingButton = button;
    //     return button;
    // }
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
        this.control_bottom.appendChild(this.renderDownloadImageButton());
        this.control_bottom.appendChild(this.renderDownloadVideoButton());
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
            this.setCanvasSize({width: parseInt(sCustomWidth.value)});
        };
        let sCustomHeight = this.control_top.querySelector('#custom-height-input');
        if(sCustomHeight) sCustomHeight.onchange = () => {
            this.setCanvasSize({height: parseInt(sCustomHeight.value)});
        };
    }
    addListenersBottom(){
        if(this.downloadImageButton) this.downloadImageButton.onclick = this.saveCanvasAsImage.bind(this);
        if(this.downloadVideoButton) this.downloadVideoButton.onclick = this.initRecording.bind(this);
    }
    updateBase(base){
        // console.log(this.id);
        // console.log('updateBase');
        // console.log(base);
    	this.base = base;
		this.draw();
	}
	drawBase(){
		if(!this.isThree)
    	{
    		this.context.fillStyle = this.base;
            // console.log(this.id);
            // console.log('=== drawBase ===');
            // console.log(this.base);
            // console.log(this.canvas.width);
            // console.log(this.canvas.height);
    		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    	}
    	else
    	{
    		this.renderer.setClearColor( new THREE.Color(this.base));
    	}
	}
    draw(){
        // console.log('canvas draw()');
        this.drawBase();
        for(let shape_id in this.shapes) {
            this.shapes[shape_id].draw();
        }
    }
    animate(){
        // console.log('Canvas animate();')
        for(let shape_id in this.shapes) {
            let el = this.shapes[shape_id];
            if(this.isThree) el.updateAnimation(el.animationName);
            else el.animate(el.colorData);
        }
        // for(let i = 0; i < this.shapes.length; i++)
        // {
            
        // }
    }
    addCounterpart(obj)
    {
        // console.log('addCounterpart');
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
            // let shapeId = this.prefix + '-shape-' + shapeIndex;
            let firstShape = this.shapes[Object.keys(this.shapes)[0]];
            let newShape = this.isThree ? new ShapeAnimated(this.prefix, this, firstShape.options, format, firstShape.fonts, shapeIndex) : new ShapeStatic(this.prefix, this, firstShape.options, format, shapeIndex);
            // console.log('sad')
            this.addShape(newShape);
            // this.shapes.push( newShape );
            
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
    setCanvasSize(size, rescale=false, callback){
        let updated = false;
        if(size.width) {
            updated = true;
            this.canvas.width = size.width *  this.scale;
            this.canvas.style.width = size.width + 'px';
        }
        if(size.height) {
            updated = true;
            this.canvas.height = size.height *  this.scale;
            this.canvas.style.height = size.height + 'px';
        }
        if(!this.wrapper.offsetHeight) return;
        if(size.width > this.wrapper.offsetWidth) {
            let style = window.getComputedStyle(this.canvas);
            if(style.getPropertyValue('position') === 'absolute') {
                let r = this.toFix(this.canvas.height / this.canvas.width * 100);
                this.wrapper.style.paddingTop = r + '%';
            }
            let s = this.toFix(this.wrapper.offsetWidth / size.width);
            this.canvas.style.transform = 'scale('+s+')';
        }
        if(typeof callback === 'function') {
            callback(size);
        }
        // for(let i = 0; i < this.shapes.length; i++) {
        //     this.shapes[i].updateFrame();
        // }
        return updated;
        if(updated && draw) {
            this.draw();
        }
    }
    updateReadyState(){
        this.readyState++;
        if(this.readyState == this.textAmount || this.textAmount == 0){
            setTimeout(function(){
                this.startRecording();
            }.bind(this), 1000);
        }
    }
    toFix(val, digits=2){
        let output = parseFloat(val).toFixed(digits);
        return parseFloat(output);
    }
}

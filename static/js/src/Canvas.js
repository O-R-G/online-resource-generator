import * as THREE from "three";
import { ShapeStatic } from "./ShapeStatic.js";
import { ShapeAnimated } from "./ShapeAnimated.js";

export class Canvas {
	constructor(wrapper, format, id="canvas", options, isThree = false){
        console.log(options);
		for(const property in options){
			this[property] = options[property];
		}
		this.wrapper = wrapper;
		this.format = format;
		this.isThree = isThree;
		this.id = id;
		this.chunks = [];
		this.shapes = [];
		this.base = Object.values(this.baseOptions)[0].color.code;
	    this.isRecording = false;
        this.fields = {};
		this.init();
        this.isdebug = false;
	}
	init(){
        console.log(this.format);
        
		this.canvas = document.createElement('CANVAS');
        this.canvas.setAttribute('format', this.format);
		if(!this.isThree)
		  this.context = this.canvas.getContext('2d');
		
		this.canvas.id = this.id;
        this.canvas.className = "org-main-canvas";
		this.canvas.width = this.isThree ? this.formatOptions[this.format].w / 2 : this.formatOptions[this.format].w;
        this.canvas.style.width = this.formatOptions[this.format].w / 2 + 'px';
        let h = this.formatOptions[this.format].h === 'auto' ?  this.formatOptions[this.format].w : this.formatOptions[this.format].h;
        this.canvas.height = this.isThree ? h / 2 : h;
        this.canvas.style.width = h / 2 + 'px';
        this.autoRecordingQueue = [];
        this.autoRecordingQueueIdx = 0;
        this.isRecording = false;
        this.isAutoRecording = false;
        this.readyState = 0;
        this.textAmount = 0;

		if(!this.isThree)
		{
			// this.canvas.height = this.formatOptions[this.format].h === 'auto' ? this.formatOptions[this.format].w / 2 : this.formatOptions[this.format].h / 2;
		}
		else
		{
			// this.canvas.height = this.formatOptions[this.format].h === 'auto' ? this.formatOptions[this.format].w : this.formatOptions[this.format].h;
			this.initThree();
		}

		this.wrapper.appendChild(this.canvas);

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
		let z = 3090 * window.devicePixelRatio;
		// this.fov = 20;
		// let z = 1680;
		this.near = z - 270 * window.devicePixelRatio;
		this.far = z + 270 * window.devicePixelRatio;
		this.camera = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
		this.camera.position.set(0, 0, z);

	}
    updateAutoRecordingQueue()
    {
        // console.log('updateAutoRecordingQueue()');
        // console.log(this.fields['recordName'].value);
        let pattern = /\[(.*?)\]/g;
        // console.log(this.fields['recordName']);
        let match = this.fields['recordName'].value.split(pattern).filter(word => word != '');
        // console.log(match);
        this.autoRecordingQueue = match;
    }
    initRecording(){
        console.log('initRecording()');
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
        console.log('prepareNextRecording . . . ');
        this.readyState = 0;
        this.textAmount = 0;
        if( this.autoRecordingQueueIdx == 0 || !this.isThree){
            console.log('this.autoRecordingQueueIdx == 0');
            this.startRecording(); // record the first item in the queue directly
        }
        else {
            console.log('this.autoRecordingQueueIdx != 0');
            this.requestRecordByName(false, '', 'recording');
        }
    }
    prepareNextSaving(){
        this.readyState = 0;
        this.textAmount = 0;
        if( this.autoRecordingQueueIdx == 0 )
            this.startRecording(); // save the first item in the queue directly
        else
            this.requestRecordByName(false, '', 'savingImage');
        
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
        console.log('media_recorder.start()');
        this.animate();
        // console.log('post-await, recording starting. . .');
        setTimeout(function(){
            if(!this.isdebug) this.media_recorder.start(1); // 1s timeslice (ie data is made available every 1s)
            // if(!this.isThree) {
            //     setTimeout(function(){
            //         this.saveCanvasAsVideo();
            //     }.bind(this), 5000);
            // }
        }.bind(this));
        
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
        console.log('RecordingQueue: ' + this.autoRecordingQueueIdx +  ' / ' + this.autoRecordingQueue.length);
        this.media_recorder.stop();
        setTimeout(function(){
            if(this.autoRecordingQueueIdx >= this.autoRecordingQueue.length) {
                console.log(this.isRecording)
                console.log('saveCanvasAsVideo end');
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
            console.log(this.isRecording)
            console.log('saveCanvasAsVideo end');
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
        console.log('stop recording');        
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
    renderSelectField(id, displayName, options, extraClass='')
    {
        let temp_panel_section = document.createElement('DIV');
        temp_panel_section.className  = "panel-section float-container " + extraClass;
        let temp_label = document.createElement('LABEL');
        temp_label.setAttribute('for', id);
        temp_label.innerText = displayName;
        let temp_select = this.renderSelect(id, options);
        temp_panel_section.appendChild(temp_label);
        temp_panel_section.appendChild(temp_select);
        this.fields[id] = temp_select;
        return temp_panel_section;
    }
    renderFormatField(){

        // let formatOptions = {
        //     'post': {
        //         'name': 'post'
        //     },
        //     'story': {
        //         'name': 'story'
        //     }
        // }

        let formatField = this.renderSelectField('format', 'Format', this.formatOptions);
        let options = formatField.querySelectorAll('option');
        // let selectedIndex = 0;
        [].forEach.call(options, function(el, i){
            if(el.value == this.format)
                el.selected = true;
            
        }.bind(this));

        formatField.addEventListener('change', function(event){
            this.changeFormat(event, this.format);
        }.bind(this));

        return formatField;
    }
    renderButtonLikeCheckbox(id, text, extraClass=""){
        let temp_panel_section = document.createElement('DIV');
        temp_panel_section.className  = "panel-section float-container " + extraClass;
        let temp_label = document.createElement('LABEL');
        temp_label.setAttribute('for', id);
        temp_label.innerText = text;
        temp_label.className = 'button-like-label';
        let temp_input = document.createElement('INPUT');
        temp_input.type = 'checkbox';
        temp_input.id = id;
        temp_panel_section.appendChild(temp_input);
        temp_panel_section.appendChild(temp_label);
        temp_input.onchange = function(event){ this.toggleSecondShape(event) }.bind(this);
        
        return temp_panel_section;
    }
    renderAddShape(extraClass=""){
        let id = 'addSecondShape';
        let text = 'Add a shape';
        let element = this.renderButtonLikeCheckbox(id, text, extraClass);
        element.id = 'panel-second-shape';
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
        this.control_top.className = 'common-control';
        this.control_top.id = 'common-control-top';
        this.control_bottom = document.createElement('DIV');
        this.control_bottom.className = 'common-control';
        this.control_bottom.id = 'common-control-bottom';
        this.control_shape = document.createElement('DIV');
        this.control_shape.className = 'shape-control-wrapper';
        this.control_wrapper.appendChild(this.control_top);
        this.control_wrapper.appendChild(this.control_shape);
        this.control_wrapper.appendChild(this.control_bottom);
        this.renderControlTop();
        this.renderControlBottom();
    }
    renderControlTop(){
        this.control_top.appendChild(this.renderFormatField());
        this.control_top.appendChild(this.renderSelectField('base', 'Base', this.baseOptions));
        this.addListenersTop();
    }
    renderControlBottom(){
        this.control_bottom.appendChild(this.renderAddShape('second-shape-button'));
        this.control_bottom.appendChild(this.renderDownloadImageButton());
        this.control_bottom.appendChild(this.renderDownloadVideoButton());
        if(this.isThree) {
            
            // this.control_bottom.appendChild(this.renderAutoRecordingField());
            // this.control_bottom.appendChild(this.renderAutoRecordingButton());
        }
        this.addListenersBottom();
    }
    addListenersTop(){
    	let sBase = this.control_top.querySelector('.field-id-base');
	    sBase.onchange = function(e){
	        this.updateBase(e.target.value);
            this.counterpart.updateBase(e.target.value);
	    }.bind(this);
    }
    addListenersBottom(){
        this.downloadImageButton.onclick = function(){
            this.saveCanvasAsImage();
        }.bind(this);
        // if(this.isThree){
            this.downloadVideoButton.onclick = function(){
                console.log('this.downloadVideoButton.onclick');
                this.initRecording();
            }.bind(this);
        // } 
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
    // async draw(){
    //     console.log('canvas draw()');
    // 	this.drawBase();
    //     for(let i = 0; i < this.shapes.length; i++)
    //     {
    //         let el = this.shapes[i];
    //         await el.draw();
    //     }
    // }
    draw(){
        // console.log('canvas draw()');
        this.drawBase();
        for(let i = 0; i < this.shapes.length; i++)
        {
            let el = this.shapes[i];
            el.draw();
        }
    }
    animate(){
        console.log('Canvas animate();')
        for(let i = 0; i < this.shapes.length; i++)
        {
            let el = this.shapes[i];
            if(this.isThree) el.updateAnimation(el.animationName);
            else el.animate(el.colorData);
        }
    }
    addCounterpart(obj)
    {
        this.counterpart = obj;
    }
    changeFormat(event, currentFormat){
        const confirmChangeFormat = confirm('You are about to change the format. The current content will not be saved. Continue?');
        if(confirmChangeFormat)
        {
            window.location.href = '?format=' + event.target.value;
        }
        else {
            event.target.value = currentFormat;
            return false;
        }
    }
    toggleSecondShape(event, isSync = false){        
        if( (isSync || event.target.checked)&& this.shapes.length < 2)
        {
            
            let format = this.format;
            let shapeCenter = {
                x: this.isThree ? 0 : this.canvas.width / 2,
                y: this.isThree ? this.canvas.height / 4 : this.canvas.height / 4
            };
            let shapeFrame = this.generateFrame(shapeCenter.x, shapeCenter.y, this.canvas.width, this.canvas.height, this.shapes.length + 1, this.isThree);            
            this.shapes[0].updateFrame(shapeFrame);
            if(this.shapes[0].img)
                this.shapes[0].updateImg(this.shapes[0].img);
            let newShapeCenter = {
                x: this.isThree ? 0 : this.canvas.width / 2,
                y: this.isThree ? -this.canvas.height / 4 : this.canvas.height - this.canvas.height / 4
            };
            let newShapeFrame = this.generateFrame(newShapeCenter.x, newShapeCenter.y, this.canvas.width, this.canvas.height, this.shapes.length + 1, this.isThree);
            let shapeId = this.isThree ? 'animatedShape-' + (this.shapes.length + 1) : 'staticShape-' + (this.shapes.length + 1);
            if(this.isThree) this.shapes.push( new ShapeAnimated(shapeId, this, this.shapes[0].options, this.shapes[0].control_wrapper, format, newShapeFrame) );
            else this.shapes.push(new ShapeStatic(shapeId, this, this.shapes[0].options, this.shapes[0].control_wrapper, format, newShapeFrame));
            this.counterpart.toggleSecondShape(event, true);
            if(!isSync) {
                setTimeout(function(){
                    this.shapes[this.shapes.length - 1].addCounterpart(this.counterpart.shapes[this.counterpart.shapes.length - 1]);
                }.bind(this), 0);
            }
            else
                this.shapes[this.shapes.length - 1].addCounterpart(this.counterpart.shapes[this.counterpart.shapes.length - 1]);

            this.draw();
        }
    }
    renderRecordFetchingForm(){
        let container = document.createElement('DIV');
        // container.className = 'panel-section float-container';
        container.className = 'panel-section float-container hide';
        let form = document.createElement('FORM');
        form.setAttribute('method', 'POST');
        let label = document.createElement('LABEL');
        label.setAttribute('for', 'recordName');
        label.innerText = 'Record';
        let input = document.createElement('INPUT');
        input.id = 'recordName';
        input.name = 'recordName';
        input.type = 'text';
        input.setAttribute('placeholder', '[record 1][record 2] . . .');
        input.setAttribute('required', true);
        let input_action = document.createElement('INPUT');
        input_action.value = 'fetchRecordByName';
        input_action.name = 'action';
        input_action.type = 'hidden';
        let button = document.createElement('INPUT');
        button.type = 'submit';
        button.value = 'fetch';
        form.appendChild(label);
        form.appendChild(input);
        form.appendChild(input_action);
        form.appendChild(button);
        container.appendChild(form);
        this.fields['recordName'] = input;
        this.fields['record'] = form;
        this.fields['fetch'] = button;
        this.fields['fetch'].addEventListener('click', function(event){
            event.preventDefault();
            this.updateAutoRecordingQueue();
            let name = this.fields['recordName'].value;
            this.requestRecordByName(event);
        }.bind(this));
        this.fields['recordName'] = input;
        return container;
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
    // async requestRecordByName(event, startRecordingAfterFetching = false){
    //     // console.log(event);
    //     if(event) event.preventDefault();
    //     let data = new FormData(this.fields['record']);
    //     let recordName = this.autoRecordingQueue[this.autoRecordingQueueIdx];
    //     data.set('recordName', recordName);
    //     return new Promise(function (resolve, reject) {            
    //         let url = '/static/php/recordNameHandler.php';
    //         let request = new XMLHttpRequest();
    //         request.open('POST', url, true);
    //         request.onload = function () {
    //             if (request.status >= 200 && request.status < 300) {
    //                 let result = JSON.parse(request.responseText);
    //                 if(result.status == 'success')
    //                 {
    //                     let r = this.handleResponse(result.body, startRecordingAfterFetching);
    //                     resolve("requestRecordByName() success");
    //                 }
    //                 else if(result.status == 'error')
    //                 {
    //                     console.log('request fail');
    //                     this.stopRecording(false);
    //                 }
                    
    //             } else {
    //                 reject({
    //                     status: request.status,
    //                     statusText: request.statusText
    //                 });
    //             }
    //         }.bind(this);
    //         request.send(data);
    //     }.bind(this));
    // }
    requestRecordByName(event, recordName = '', postFetchingAction = false){
        // console.log(event);
        if(event) event.preventDefault();
        let data = new FormData(this.fields['record']);
        if(this.autoRecordingQueue.length == 0) return;
        recordName = recordName == '' ? this.autoRecordingQueue[this.autoRecordingQueueIdx] : recordName;
        data.set('recordName', recordName);
        
        let url = '/static/php/recordNameHandler.php';
        let request = new XMLHttpRequest();
        request.open('POST', url, true);
        request.onload = function () {
            if (request.status >= 200 && request.status < 300) {
                let result = JSON.parse(request.responseText);
                console.log();
                if(result.status == 'success')
                {
                    let r = this.handleResponse(result.body, postFetchingAction);
                    // resolve("requestRecordByName() success");
                }
                else if(result.status == 'error')
                {
                    console.log('error:' + recordName);
                    console.log(result);
                    // console.log('request fail');
                    if(postFetchingAction == 'recording') this.stopRecording();
                }
                
            } 
        }.bind(this);
        request.send(data);
    }
    requestRecordByURL(event, _url = '', postFetchingAction = false){
        if(event) event.preventDefault();
        let data = new FormData(this.fields['record']);
        // for now, commented 
        // if(this.autoRecordingQueue.length == 0) return;
        console.log('requestRecordByURL:' + _url);
        data.set('url', _url);
        
        let url = '/static/php/recordURLHandler.php';
        let request = new XMLHttpRequest();
        request.open('POST', url, true);
        request.onload = function () {
            if (request.status >= 200 && request.status < 300) {
                let result = JSON.parse(request.responseText);
                console.log();
                if(result.status == 'success')
                {
                    let r = this.handleResponse(result.body, postFetchingAction);
                    // resolve("requestRecordByName() success");
                }
                else if(result.status == 'error')
                {
                    console.log('error:' + recordName);
                    console.log(result);
                    // console.log('request fail');
                    if(postFetchingAction == 'recording') this.stopRecording();
                }
                
            } 
        }.bind(this);
        request.send(data);
    }
    handleResponse(response, startRecordingAfterFetching){
        
            console.log('handleResponse');
            let response_clean = this.divToNl(this.stringToNode(response));
            let search = /\[(front\-text\-1|front\-text\-2|back\-text\-1|back\-text\-2|watermark\-1|watermark\-2)\]\(((?:.|\n|\r)*?\)*)\)/ig;
            let found = [...response_clean.matchAll(search)];
            let shape0_watermark_counter = 0;
            let shape1_watermark_counter = 0;
            for(let i = 0; i < found.length; i++){
                let el = found[i];
                let position = el[1];
                let text = el[2];
                if(!this.isThree)
                {
                    if(     position == 'front-text-1' && this.shapes[0]) this.shapes[0].updateText(text, true);
                    else if(position == 'front-text-2' && this.shapes[1]) this.shapes[1].updateText(text, true);
                    else if(position == 'watermark-1' && this.shapes[0]) {
                        this.shapes[0].overrideWatermark(shape0_watermark_counter, text);
                        shape0_watermark_counter++;
                    }
                    else if(position == 'watermark-2' && this.shapes[1]) {
                        this.shapes[1].overrideWatermark(shape1_watermark_counter, text);
                        shape1_watermark_counter++;
                    }
                }
                else
                {
                    if(     position == 'front-text-1' && this.shapes[0]) this.shapes[0].updateFrontText(text, true);
                    else if(position == 'front-text-2' && this.shapes[1]) this.shapes[1].updateFrontText(text, true);
                    else if(position == 'back-text-1'  && this.shapes[0]) this.shapes[0].updateBackText(text, true);
                    else if(position == 'back-text-2'  && this.shapes[1]) this.shapes[1].updateBackText(text, true);
                    else if(position == 'watermark-1' && this.shapes[0]) {
                        this.shapes[0].overrideWatermark(shape0_watermark_counter, text);
                        shape0_watermark_counter++;
                    }
                    else if(position == 'watermark-2' && this.shapes[1]) {
                        this.shapes[1].overrideWatermark(shape1_watermark_counter, text);
                        shape1_watermark_counter++;
                    }
                    
                }
                this.textAmount += position.indexOf('watermark') !== -1 ? 1 : 2;
            }
            if(this.shapes[0]){
                this.shapes[0].trimWatermark(shape0_watermark_counter);
                
            }
            if(this.shapes[1]) {
                this.shapes[1].trimWatermark(shape1_watermark_counter);
            }
            
            for(let i = 0; i < this.shapes.length; i++)
            {
                if(this.shapes[i].animationName !== 'none') {
                    console.log('drawing after handling');
                    console.log('startRecordingAfterFetching? ' + startRecordingAfterFetching);
                    if(startRecordingAfterFetching == 'recording') this.shapes[i].drawForRecording();
                    else if(startRecordingAfterFetching == 'savingImage')  this.shapes[i].drawForSavingImage();
                    else this.shapes[i].draw();
                    // let temp = await 
                    // console.log(temp);
                }
            }
            
            console.log('handleResponse drawing done');
    }
    checkWatermarksAndWrite(shape, idx, text){
        
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
        this.shapes.forEach(function(el){
            el.sync();
        });
    }
    updateReadyState(){
        this.readyState++;
        // console.log('updateReadyState');
        console.log(this.readyState +' / '+this.textAmount);
        if(this.readyState == this.textAmount || this.textAmount == 0){
            // console.log('media_recorder.start()');
            setTimeout(function(){
                this.startRecording();
            }.bind(this), 1000);
        }
    }
}

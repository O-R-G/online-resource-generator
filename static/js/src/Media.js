import {getClassString, addExtraAttr, updatePositionByKey, getAncestorByClass} from "./utils/lib.js"
import {renderNumeralSection, renderSelectSection} from "./utils/render.js"
export default class Media{
    constructor(key, prefix, canvas, onUpdate, onUpload, options){
        this.initialized = false;
        this.key = key;
        this.prefix = prefix;
        this.canvas = canvas;
        this.onUpdate = onUpdate;
        this.onUpload = onUpload;
        this.options = options;
        this.isEmpty = true;
        this.isShown = true;
        this.isVideo = false;
        this.elements = {};
        this.dom = null;
        this.shared_props = {
            obj: null,
            src: '',
            x: 0,
            y: 0,
            'shift-x': 0,
            'shift-y': 0,
            scale: 1,
            'blend-mode': 'normal',
            fit: 'auto',
            isShapeColor: false,
            isVideo: false
        }
        this.controls_data = this.generateControlsData();
    }
    generateControlsData(){
        const output = [
            { 
                'name': 'scale',
                'displayName': 'Scale',
                'id': this.prefix + '-scale',
                'input-type': 'number',
                'attr': {'flex': 'half', 'placeholder' : 'Scale (1)'},
                'meta': {'begin': 1.0, 'step': 0.1},
                'class': ['img-control-scale', 'flex-item']
            },{ 
                'name': 'shift-x',
                'displayName': 'X',
                'id': this.prefix + '-shift-x',
                'input-type': 'number',
                'attr': {'flex': 'half', 'placeholder' : 'X (0)'},
                'meta': {'begin': 0, 'step': 1},
                'class': ['img-control-shift-x', 'flex-item']
            },{ 
                'name': 'shift-y',
                'displayName': 'Y',
                'id': this.prefix + '-shift-y',
                'input-type': 'number',
                'attr': {'flex': 'half', 'placeholder' : 'Y (0)'},
                'meta': {'begin': 0, 'step': 1},
                'class': ['img-control-shift-y', 'flex-item']
            }
        ];
        if(this.options['blendModeOptions']) {
            output.push({ 
                'name': 'blend-mode',
                'displayName': 'Blend mode',
                'id': this.prefix + '-blend-mode',
                'input-type': 'select',
                'attr': {'flex': 'half', 'placeholder' : 'Blend Mode'},
                'meta': {options: this.options['blendModeOptions']},
                'class': ['img-control-blend-mode', 'flex-item']
            });
        }
        return output;
    }
    init(props, file){
        for(const key in this.props_template) {
            const value = typeof props[key] !== 'undefined' ? props[key] : this.props_template[key];
            this[key] = value;
        }
        
        this.initialized = true;
        this.render();
        if(file && this.elements['file-input']) {
            this.elements['file-input'].files = file;
        }
        this.checkEmpty();
    }
    update(props, silent){  
        for(const key in props) {
            if(typeof this.props_template[key] === 'undefined') continue;
            this[key] = props[key];
        }
        this.checkEmpty();
        if(!silent) this.onUpdate();
    }
    sync(props, file, silent){
        this.update(props, true);
        if(file) {
            this.elements['file-input'].files = file;
        }
        for(const item of this.controls_data) {
            const name = item.name;
            this.elements[name].value = this[name];
        }
        
        if(!silent) this.onUpdate();
    }
    render(){
        const cls = [];
        const [field, input] = this.renderFileField({'wrapper':['flex-item'], 'input': cls}, {'wrapper': {'flex': 'full'}});
        this.elements['file-input'] = input;
        const controls = this.renderControls();
        // this.dom_temp = document.createDocumentFragment();
        this.dom = document.createElement('div');
        this.dom.className = 'media-dom-wrapper flex-container';
        this.dom.appendChild(field);
        this.dom.appendChild(controls);
        this.addListeners();
    }
    addTo(parent) {
        if(parent) {
            parent.appendChild(this.dom);
        }
    }
    renderFileField(extraClass={'wrapper': [], 'input': []}, extraAttr={'wrapper': null, 'input': null}){
        let output = document.createElement('div');
        let input = document.createElement('input');
        let label = document.createElement('label');
        let extraWrapperClass = extraClass['wrapper'] && extraClass['wrapper'].length ? getClassString(extraClass['wrapper']) : '';
        output.className = 'field-wrapper ' + this.prefix + '-wrapper' + ' ' + extraWrapperClass;
        if(extraAttr['wrapper']) output = addExtraAttr(output, extraAttr['wrapper']);
        
        let extraInputClass = extraClass['input'] && extraClass['input'].length ? getClassString(extraClass['input']) : '';
        input.className = 'field-id-' + this.key + ' ' + extraInputClass;
        input.id = this.prefix;
        input.type = 'file';
		input.setAttribute('image-idx', this.key);
        input.setAttribute('data-file-src', this.src);
        label.setAttribute('for', this.prefix);
        
		label.className = 'pseudo-upload';
        label.innerText = 'Choose file';
        output.appendChild(input);
        output.appendChild(label);
        return [output, input];
    }
    renderControls(controls_data=null){
        controls_data = controls_data ? controls_data : this.controls_data;
        let container = document.createElement('div');
        container.className = 'field-id-image-controls float-container flex-item';
        container.id = this.prefix + '-field-id-image-controls';
        container.setAttribute('flex', 'full');
        for(const control of controls_data) {
            const name = control['name'];
            if(control['input-type'] === 'number') {
                let [section, input] = renderNumeralSection(control['id'], control['displayName'], control.meta.begin, control.meta.step, false, control['class'], ['media-control-section']);
                this.elements[name] = input;
                if(this[name] !== this.props_template[name])
                    input.value = this[name];
                container.append(section);
            }else if(control['input-type'] === 'select') {
                let [section, input] = renderSelectSection(control['id'], control['displayName'], { options: control.meta.options}, control['class'], ['media-control-section']);
                this.elements[control['name']] = input;
                if(this[name] !== this.props_template[name]) {
                    for(let i = 0; i < input.length; i++) {
                        if(input[i].value === this[name]) {
                            input.selectedIndex = i;
                            break;
                        }
                    }
                }
                container.append(section);
            }
        }
        return container;
    }
    addListeners(){
		this.elements['file-input'].onclick = function (e) {
			e.target.value = null;
		}.bind(this);
		this.elements['file-input'].onchange = function(e){
			this.readImageUploaded(e, (image)=>{
                
                if(typeof this.onUpload === 'function')
                    this.onUpload(image);
                else
                    this.update({obj:image}); // resetting src
			});
		}.bind(this);
		this.elements['file-input'].addEventListener('applySavedFile', async (e)=>{
			let src = this.elements['file-input'].getAttribute('data-file-src');
            const type = await this.classifyFile(src);

            if(type === 'image') {
                this.isVideo = false;
				this.readImage(src, (image)=>{
					// input.classList.add('not-empty');
					this.update({'obj': image, 'src': src})
				});
			} else if(type === 'video') {
                
				this.readVideo(src, (video)=>{
					// input.classList.add('not-empty');
					// this.updateMedia(idx, image);
                    this.update({'obj': video, 'src': src})
				});
			}
			// this.readImage(src, (image)=>{
            //     this.update({'obj': image, 'src': src})
			// });
		});
		if(this.elements['scale']) {
			this.elements['scale'].oninput = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				e.preventDefault();
				this.updateScale(e.target.value, isSilent);
			}.bind(this);
        }
		if(this.elements['shift-x']) {
			this.elements['shift-x'].oninput = function(e){
                let isSilent = e && e.detail ? e.detail.isSilent : false;
				this.updatePositionX(e.target.value, isSilent);
			}.bind(this);
		}
		if(this.elements['shift-y']) {
			this.elements['shift-y'].oninput = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				this.updatePositionY(e.target.value, isSilent);
			}.bind(this);
		}
        if(this.elements['shift-x'] && this.elements['shift-y'] ) {
            this.elements['shift-x'].onkeydown = e => updatePositionByKey(e, {x: this.elements['shift-x'], y: this.elements['shift-y']}, (shift)=>{
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				this.updatePositionX(shift.x, isSilent)
				this.updatePositionY(shift.y, isSilent)
			});
            this.elements['shift-y'].onkeydown = e => updatePositionByKey(e, {x: this.elements['shift-x'], y: this.elements['shift-y']}, (shift)=>{
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				this.updatePositionX(shift.x, isSilent)
				this.updatePositionY(shift.y, isSilent)
			});
        }
		if(this.elements['blend-mode']) {
			this.elements['blend-mode'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				this.updateBlendMode(e.target.value, isSilent);
			}.bind(this);
		}
	}
    checkEmpty(){
        if(!this.obj && !this.src) {
            if(this.elements['file-input'])
                this.elements['file-input'].classList.remove('not-empty');
            this.isEmpty = true;
        }
        else {
            if(this.elements['file-input'])
                this.elements['file-input'].classList.add('not-empty');
            this.isEmpty = false;
        }
    }
    readImage(src, cb) {
        if (!src) src = this.src;
        let image = new Image();
        image.onload = function (e) {
            if(typeof cb === 'function') {
                cb(image);	
            }
                
        };
        image.src = src;
    }
    
    async classifyFile(url){
        const res = await fetch(url, { method: 'HEAD' });
		const type = res.headers.get('Content-Type') || '';
		if (type.startsWith('image/')) return 'image';
		if (type.startsWith('video/')) return 'video';
		return 'unknown';
    }
    readImageUploaded(event, cb){
        let input = event.target;
		let idx = input.getAttribute('image-idx');

        if (input.files && input.files[0]) {
            const file_type = input.files[0].type.substring(0, input.files[0].type.indexOf('/'));
        	var FR = new FileReader();
            FR.onload = function (e) {
                if(file_type === 'image') {
                    this.isVideo = false;
                    this.readImage(e.target.result, (image)=>{
                        // input.classList.add('not-empty');
                        if(typeof cb === 'function') cb(image);
                    });
                } else if(file_type === 'video') {
                    this.isVideo = true;
                    this.readVideo(e.target.result, (video)=>{
                        // input.classList.add('not-empty');
                        if(typeof cb === 'function') cb(video);
                    });
                }
                
            }.bind(this);
            FR.readAsDataURL(input.files[0]);
            input.parentNode.parentNode.parentNode.classList.add('viewing-image-control');
        }
    }
    show(){
        this.isShown = true;
        const section = getAncestorByClass(this.dom, 'base-image-section');
        if(section)
            section.style.display = 'block';
    }
    hide(){
        this.isShown = false;
        const section = getAncestorByClass(this.dom, 'base-image-section');
        if(section)
            section.style.display = 'none';
    }
    getProps(){
        const output = {};
        for(const key in this.props_template) {
            output[key] = this[key];
        }
        return output;
    }
    updateKey(key){
        const old_key = this.key;
        this.key = key;
        this.prefix = this.prefix.replace(old_key, this.key);
        this.controls_data = this.generateControlsData();
        this.elements['file-input'].id = this.prefix;
        for(const control of this.controls_data) {
            const name = control.name;
            this.elements[name].id = control.id;
        }
    }
    initRecording(){
        
    }
}

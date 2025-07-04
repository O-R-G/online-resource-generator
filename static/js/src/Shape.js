import { getDefaultOption, getClassString, addExtraAttr } from './utils/lib.js'
import { renderInput, renderCustomControls, renderSelect, renderSelectSection, renderNumeralSection, renderSection, renderImageControls } from './utils/render.js';

export class Shape {
	constructor(prefix, canvasObj, options, format, shape_index = 0){
        this.initialized = false;
        this.id = prefix + '-shape-' + shape_index;
        this.canvasObj = canvasObj;	
        this.options = options;
        this.format = format;
        this.shape_index = shape_index;
        this.shape = null;
        for(let prop in this.options.shapeOptions) {
            if(this.options.shapeOptions[prop]['default']) this.shape = this.options.shapeOptions[prop].shape;
        }
        if(!this.shape) this.shape = Object.values(this.options.shapeOptions)[0].shape;
		this.cornerRadius = this.shape.cornerRadius;
		this.padding = this.shape.padding;
        this.innerPadding = {};
        this.shapeShiftX = 0;
        this.shapeShiftY = 0;
        this.font = this.options['fontOptions'] ? this.getDefaultOption(this.options['fontOptions']) : null;

		this.framerate = 120;
		this.watermarks = [];
		this.watermarkidx = 0;
		
        this.shapeCenter = {
            x: this.shapeShiftX,
            y: this.shapeShiftY
        };
        this.media = {
			'background-image': {
				obj: null,
				x: 0,
				y: 0,
				shiftY: 0,
				shiftX: 0,
				scale: 1
			}
		};
        this.mediaIndex = 1;
        this.text = {
			'text': {
				obj: null,
                position: '',
                color: '',
                typography: '',
                rotate: 0,
				shiftY: 0,
				shiftX: 0,
                isWatermark: false
			}
		};
        this.supported_ext = {
            'image': ['jpg', 'jpeg', 'png', 'gif'],
            'video': ['mp4']
        };
        this.fields = {};
        this.fields.media = {};
        this.fields.watermarks = [];
        this.fieldCounterparts = {};

        this.shapeMethod = 'draw';
	}
    init(canvasObj){
        this.initialized = true;
        if(!canvasObj) canvasObj = this.canvasObj;
        else this.canvasObj = canvasObj;
        this.control_wrapper = this.canvasObj.control_shape;
        this.control = document.createElement('div');
        this.control.className = 'shape-control';
        this.control.id = this.id + '-shape-control';
        this.control.setAttribute('data-shape-id', this.id);
        if(this.control_wrapper.lastElementChild && this.control_wrapper.lastElementChild.classList.contains('shape-general-control')){
            this.control_wrapper.insertBefore(this.control, this.control_wrapper.lastElementChild);
        }
        else
            this.control_wrapper.appendChild(this.control);
        this.frame = this.generateFrame();
        this.size = {
            'width': false,
            'height': false
        };
    }
    getShapeIndex(){
        for(const index of Object.keys(this.canvasObj.shapes)) {
            if(this.canvasObj.shapes[index] === this) {
                this.shape_index = index;
            }
        }
    }
	addCounterpart(obj)
	{
		this.counterpart = obj;
	}
    updateSize(width, height){
        this.size.width = width;
        this.size.height = height;
    }
    setShape(){
        for(let prop in this.options.shapeOptions) {
            if(this.options.shapeOptions[prop]['default']) this.shape = this.options.shapeOptions[prop].shape;
        }
        if(!this.shape) this.shape = Object.values(this.options.shapeOptions)[0].shape;
        this.updateShape(this.shape, true);
        this.shapeShiftX = 0;
        this.shapeShiftY = 0;
    }
	updateShape(shape){
		this.shape = shape;
		this.cornerRadius = shape.cornerRadius;
		this.padding = shape.padding;
        this.innerPadding = {
            x: shape.innerPadding[0],
            y: shape.innerPadding[1] ? shape.innerPadding[1] : shape.innerPadding[0]
        }
        // this.rad = shape.rotate ? shape.rotate * Math.PI / 180 : 0;
	}
	
    updateWatermark(idx, values_obj = {}, silent=true){
        let typography = typeof values_obj.typography === 'string' ? ( this.options.watermarkTypographyOptions[values_obj['typography']] ? this.options.watermarkTypographyOptions[values_obj['typography']] : false ) : values_obj.typography;
        if(typeof this.watermarks[idx] == 'undefined')
    	{
            if(!typography) typography = this.getDefaultOption(this.options.watermarkTypographyOptions);
            let values = {...values_obj, typography:typography};
            values['position'] = values['position'] ? values['position'] : this.getDefaultOption(this.options.watermarkPositionOptions, true);
    		this.watermarks[idx] = {
    			'str': values['str'] ? values['str'] : '',
    			'position': values['position'],
    			'color': values['color'],
    			'typography': values['typography'],
                'font': values['font'],
                'shift': values['shift'],
                'rotate': values['rad']
    		};
    	}	
    	else
    	{
            if(!typography) typography = this.watermarks[idx]['typography'];
            let values = {...values_obj, typography:typography};
            for(let name in values) {
                if(!values[name] && values[name] !== 0) continue;
                this.watermarks[idx][name] = values[name];
            }
    	} 		
        if(!silent)
            this.canvasObj.draw();
	}
    renderSection(id='', displayName, children=[], extraClass=[]){
        return renderSection(id, displayName, children, extraClass);
    }
    renderSelect(key, data, extraClass=[], attrs=null, selected_value=null){
        // if(!data) return null;
        const ex_cls = ['field-id-' + key].concat(extraClass);
        const id = this.id + '-field-id-' + key;
        const select = renderSelect(id, data, ex_cls, attrs, selected_value);
        if(!this.fields[key]) this.fields[key] = select;
        return select;
    }
    renderSelectSection(key, displayName, data, extraSelectClass=[], extraSectionClass=[], extraAttr = null, extraSectionAttr=null)
    {
        const s_cls = ['field-id-' + key].concat(extraSelectClass);
        const id = this.id + '-field-id-' + key;
        const [section, select] = renderSelectSection(id, displayName, data, s_cls, extraSectionClass, extraAttr = null, extraSectionAttr=null);
        if(!this.fields[key]) this.fields[key] = select;
        return [section, select];
    }
    renderShapeSection(id, displayName, extraClass=[])
    {
        let cls = ['flex-item', 'typography-flex-item'];
        let select = this.renderSelect('shape', {options: this.options.shapeOptions}, cls, {'flex': 'full'});
        let input_x = this.renderInput('shape-shift-x', null, {'flex': 'half', 'placeholder' : 'X (0)'}, cls);
        let input_y = this.renderInput('shape-shift-y', null, {'flex': 'half', 'placeholder' : 'X (0)'}, cls);
        this.fields['shape'] = select;
        this.fields['shape-shift-x'] = input_x;
        this.fields['shape-shift-y'] = input_y;
        const section = this.renderSection(id, displayName, [select, input_x, input_y], extraClass=[]);
        
        return section;
    }
    renderTextSection(key, displayName, extraClass='')
    {
        const id = this.id + '-field-id-' + key;
        let textarea = document.createElement('TEXTAREA');
        textarea.className = getClassString(['flex-item','field-id-' + key].concat(extraClass));
        textarea.id = id;
        textarea.setAttribute('rows', 3);
        textarea.setAttribute('flex', 'full');

        let text_controls = [
            { 
                'name': 'position',
                'id': key + '-position',
                'input-type': 'select',
                'options': this.options['textPositionOptions'],
                'attr': {'flex': 'half'},
                'class': ['typography-flex-item']
            },
            { 
                'name': 'color',
                'id': key + '-color',
                'input-type': 'select',
                'options': this.options['textColorOptions'],
                'attr': {'flex': 'half'},
                'class': ['typography-flex-item']
            },
            { 
                'name': 'typography',
                'id': key + '-typography',
                'input-type': 'select',
                'options': this.options['typographyOptions'],
                'attr': {'flex': 'half'},
                'class': ['typography-flex-item']
            },
            { 
                'name': 'font',
                'id': key + '-font',
                'input-type': 'select',
                'options': this.options['fontOptions'],
                'attr': {'flex': 'half'},
                'class': ['typography-flex-item']
            },
            { 
                'name': 'shift-x',
                'id': key + '-shift-x',
                'input-type': 'text',
                'attr': {'flex': 'half', 'placeholder' : 'X (0)'},
                'class': []
            },{ 
                'name': 'shift-y',
                'id': key + '-shift-y',
                'input-type': 'text',
                'attr': {'flex': 'half', 'placeholder' : 'Y (0)'},
                'class': []
            }
        ]
        const control_items = Array.from(this.renderCustomControls(text_controls));
        const section = renderSection('', displayName, [textarea, ...control_items]);
        
        if(!this.fields[key]) this.fields[key] = textarea;

        return section;
    }
    renderCustomControls(items=[], cb){
        const rendered_items = renderCustomControls(items);
        const elements = [];
        for(const item of rendered_items) {
            
            // if(!item['el']) continue;
            elements.push(item['el']);
            if(this.fields[item['id']]) continue;
            this.fields[item['id']] = item['el'];
        }
        
        if(typeof cb === 'function') {
            cb(rendered_items);
        }
        return elements;
    }
    renderAddMedia(){
    	let container = document.createElement('div');
    	container.className = 'media-container';
    	let btn = document.createElement('div');
    	btn.className = 'btn-add-media btn-add';
        this.addMediaButton = btn;
    	btn.addEventListener('click', function(){
    		this.addMediaSection();
    	}.bind(this));
    	btn.innerText = 'Add media';
    	container.appendChild(btn);
        if(!this.fields['media-container']) this.fields['media-container'] = container;
    	return container;
    }
    renderMediaSection(key, displayName, extraClass=[])
    {
        
        if(!key) {
            key = 'media-' + this.mediaIndex;
            displayName = 'Media ' + this.mediaIndex;
            this.mediaIndex++;
        }

        const id = this.id + '-field-id-' + key;    
        let control_data = [
            { 
                'name': 'scale',
                'displayName': 'Scale',
                'id': id + '-scale',
                'input-type': 'number',
                'attr': {'flex': 'half', 'placeholder' : 'Scale (1)'},
                'meta': {begin: 1.0, step: 0.1},
                'class': ['img-control-scale', 'flex-item']
            },{ 
                'name': 'shift-x',
                'displayName': 'X',
                'id': id + '-shift-x',
                'input-type': 'number',
                'attr': {'flex': 'half', 'placeholder' : 'X (0)'},
                'meta': {begin: 0, step: 1},
                'class': ['img-control-shift-x', 'flex-item']
            },{ 
                'name': 'shift-y',
                'displayName': 'Y',
                'id': id + '-shift-y',
                'input-type': 'number',
                'attr': {'flex': 'half', 'placeholder' : 'Y (0)'},
                'meta': {begin: 0, step: 1},
                'class': ['img-control-shift-y', 'flex-item']
            }
        ];
        if(this.options['blendModeOptions']) {
            control_data.push({ 
                'name': 'blend-mode',
                'displayName': 'Blend mode',
                'id': id + '-blend-mode',
                'input-type': 'select',
                'attr': {'flex': 'half', 'placeholder' : 'Blend Mode'},
                'meta': {options: this.options['blendModeOptions']},
                'class': ['img-control-blend-mode', 'flex-item']
            });
        }
        let upload = this.renderFileField(key, {'wrapper':['flex-item']}, {'wrapper': {'flex': 'full'}});
        const ex_cls = ['media-section'].concat(extraClass);
        const controls = this.renderImageControls(id, control_data);
        const section = this.renderSection('', displayName, [upload, controls], ex_cls);
        const delete_button = document.createElement('div');
        delete_button.className='delete-button media-delete-button btn small-btn';
        delete_button.addEventListener('click', ()=>{ 
            this.deleteItem('media', key, section); 
        });
        section.appendChild(delete_button);
        if(!this.fields.media[key]) this.fields.media[key] = upload;
        return [section, upload];
    }
    addMediaSection(key, displayName, extraClass=[]){
        if(!key) {
            key = 'media-' + this.mediaIndex;
            displayName = 'Media ' + this.mediaIndex;
            this.mediaIndex++;
        }
        const [section] = this.renderMediaSection(key, displayName, extraClass); 
        this.addMediaButton.parentNode.insertBefore(section, this.addMediaButton);
        if(!this.media[key]) {
            this.media[key] = {
                obj: null,
                x: 0,
                y: 0,
                shiftY: 0,
                shiftX: 0,
                scale: 1,
                'blend-mode': 'normal'
            };
        }
        
        this.addMediaListener(key);
    }
    divToNl(nodes){
        let output = '';
        [].forEach.call(nodes, function(el){
            if(el.nodeName == 'DIV' && el.previousSibling) output += "\r\n";
            if(el.childNodes && el.childNodes.length !== 0) {
                output += this.divToNl(el.childNodes);
            }
            else if(el.nodeName == 'BR') {
                if(el.previousSibling) {
                    output += el.previousSibling.nodeName == '#text' ? '' : "\r\n";
                }
                else {
                    output += '';
                }
            }
            else output += el.previousSibling ? '\r\n' + el.textContent : el.textContent;
            
        }.bind(this));

        return output;
    }
    
    
    // var this.watermarkidx = 0;
    renderWatermarkSection(idx, extraClass=[])
    {
        let key = 'watermark-' + idx;
        let id = this.id + '-field-id-' +key;
        let displayName = 'Text ' + (idx + 1);
        const ex_section_cls = ['watermark-section'].concat(extraClass);
        

        // let right = document.createElement('div');
        // right.className = 'half-right flex-container typography-control';
        let textarea = document.createElement('TEXTAREA');
        textarea.className = 'field-id-' +key + ' watermark flex-item';
        textarea.id = id;
        textarea.setAttribute('flex', 'full');

        if(this.watermarks[idx] && this.watermarks[idx]['str']) {
            textarea.value = this.watermarks[idx]['str'];
            textarea.innerText = this.watermarks[idx]['str'];
        }
        // right.appendChild(textarea);

        this.fields['watermarks'][idx] = 
        {
            'text': textarea,
            'position': null,
            'color': null,
            'typography': null,
            'shift': {
            },
            'rotate': null
        };
        textarea.onchange = function(e){
            this.updateWatermark(idx, {'str': textarea.value});
        }.bind(this);
        let text_controls = [
            { 
                'name': 'position',
                'id': 'watermark-position-' + idx,
                'input-type': 'select',
                'options': this.options['watermarkPositionOptions'],
                'attr': {'flex': 'one-third'},
                'class': ['watermark-position'],
                'value': this.watermarks[idx] ? this.watermarks[idx]['position'] : null
            },{ 
                'name': 'color',
                'id': 'watermark-color-' + idx,
                'input-type': 'select',
                'options': this.options['textColorOptions'],
                'attr': {'flex': 'one-third'},
                'class': ['watermark-color'],
                'value': this.watermarks[idx] ? this.watermarks[idx]['color'] : null
            },{ 
                'name': 'typography',
                'id': 'watermark-typography-' + idx,
                'input-type': 'select',
                'options': this.options['watermarkTypographyOptions'],
                'attr': {'flex': 'one-third'},
                'class': ['watermark-typography'],
                'value': this.watermarks[idx] ? this.watermarks[idx]['typography'] : null
            },{ 
                'name': 'font',
                'id': 'watermark-font-' + idx,
                'input-type': 'select',
                'options': this.options['fontOptions'],
                'attr': {'flex': 'one-third'},
                'class': ['watermark-font'],
                'value': this.watermarks[idx] ? this.watermarks[idx]['font'] : null
            },{ 
                'name': 'rotate',
                'id': 'watermark-rotate-' + idx,
                'input-type': 'text',
                'attr': {'flex': 'one-third', 'placeholder' : 'rotate (0)'},
                'class': ['watermark-rotate'],
                'value': this.watermarks[idx] && this.watermarks[idx]['rotate'] ? this.watermarks[idx]['rotate'] * 360 / (2 * Math.PI) : null
            },{ 
                'name': 'shift-x',
                'id': 'watermark-shift-x-' + idx,
                'input-type': 'text',
                'attr': {'flex': 'one-third', 'placeholder' : 'X (0)'},
                'class': ['watermark-shift-x'],
                'value': this.watermarks[idx] && this.watermarks[idx]['shift'] ? this.watermarks[idx]['shift']['x'] : null
            },{ 
                'name': 'shift-y',
                'id': 'watermark-shift-y-' + idx,
                'input-type': 'text',
                'attr': {'flex': 'one-third', 'placeholder' : 'Y (0)'},
                'class': ['watermark-shift-y'],
                'value': this.watermarks[idx] && this.watermarks[idx]['shift'] ? this.watermarks[idx]['shift']['y'] : null
            }
        ]
        const control_items = Array.from(this.renderCustomControls(text_controls, (items)=>{
            let self = this;
            for(let item of items) {
                if(item['name'].indexOf('shift-') === -1) {
                    self.fields['watermarks'][idx][item['name']] = item['el'];
                    item['el'].onchange = function(e){
                        let label = item['el'].parentNode.parentNode.querySelector('label');
                        console.log('render watermark section', label);
                        if(item['name'] === 'position') self.checkWatermarkPosition(e.target.value, label);
                        let param = {};
                        if(item['name'] === 'rotate') {
                            param[item['name']] = e.target.value ? (2 * Math.PI) * e.target.value / 360 : '';
                        } else if(item['name'] === 'font') {
                            param[item['name']] = self.options['fontOptions'][e.target.value];
                        } else {
                            param[item['name']] = e.target.value;
                        }
                        self.updateWatermark(idx, param);
                    }
                    if(item['name'] === 'rotate') {
                        item['el'].onkeydown = (e) => {
                            let param = {};
                            param['rotate'] = (2 * Math.PI) * e.target.value / 360;
                            this.updateRotationByKey(e, item['el'], ()=>this.updateWatermark(idx, param));
                        }
                    }
                } else {
                    let shift_direction = item['name'].replace('shift-', '');
                    self.fields['watermarks'][idx]['shift'][shift_direction] = item['el'];
                    item['el'].onchange = function(e){
                        let val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        if(isNaN(val)) return;
                        let params = {
                            'shift': {}
                        };
                        for(let d in self.fields['watermarks'][idx]['shift']) {
                            params['shift'][d] = d === shift_direction ? val : parseFloat( self.fields['watermarks'][idx]['shift'][d].value);
                        }
                        self.updateWatermark(idx, params);
                    }
                    item['el'].onkeydown = (e) => {
                        this.updatePositionByKey(e, self.fields['watermarks'][idx]['shift'], (shift)=>this.updateWatermark(idx, {'shift': shift}, false));
                    }
                    const counterpart_name = shift_direction === 'x' ? 'shift-y' : 'shift-x';
                    const counterpart = items.find((itm)=> itm.name.indexOf(counterpart_name) !== -1 );
                    item['el'].onblur = () => {
                        this.unfocusInputs([item['el'], counterpart['el']]);
                    }
                }
                
            }
        }));
        const section = renderSection('', displayName, [textarea, ...control_items]);
        const delete_button = document.createElement('div');
        delete_button.className='delete-button watermark-delete-button btn small-btn';
        delete_button.addEventListener('click', ()=>{ 
            this.deleteItem('watermark', idx, section); 
        });
        section.appendChild(delete_button);

        if(!this.fields[key]) this.fields[key] = textarea;

        return section;
    }
    renderInput(key, value='', attrs = null, extraClass = []){
        const id = this.id + '-field-id-' + key;
        const input = renderInput(id, value, attrs, extraClass);
        if(!this.fields[key]) this.fields[key] = input;
        return input;
        let output = document.createElement('input');
        output.id = id;
        if(value !== null) output.value = value;
        output.autocomplete = "off";
        if(attrs) {
            for(let attr in attrs) {
                output.setAttribute(attr, attrs[attr]);
            }
        }
        if(extraClass) output.className = extraClass;
        return output;
    }
    updateRotationByKey(e, input, cb){
        if(e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        let val = e.key === 'ArrowUp' ?  -1.0 : 1.0;
        if(!input.value) input.value = 0;
        input.value = this.toFix(input.value) + val;
        input.classList.add('pseudo-focused');

        if(typeof cb === 'function') cb({rotate: input.value});
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
    toFix(val, digits=2){
        let output = parseFloat(val).toFixed(digits);
        return parseFloat(output);
    }
    unfocusInputs(inputs){
        for(let i = 0; i < inputs.length; i++){
            if(!inputs[i]) continue;
            inputs[i].classList.remove('pseudo-focused');
        }
    }
    renderAddWaterMark(){
    	let container = document.createElement('div');
    	container.className = 'watermarks-container';
    	let btn = document.createElement('div');
    	btn.className = 'btn-add-watermark';
        this.addWatermarkButton = btn;
    	btn.addEventListener('click', function(){
    		this.addWatermark();
    	}.bind(this));
    	btn.innerText = 'Add text';
    	container.appendChild(btn);
        if(!this.fields['watermark-container']) this.fields['watermark-container'] = container;
    	return container;
    }

    addWatermark(str = ''){
        let section = this.renderWatermarkSection(this.watermarkidx); 
        const availables = this.shape.watermarkPositions;
        let position = section.querySelector('.watermark-position').value;
        let label = section.querySelector('label');
        console.log('addWatermark label', label);
        let pp = position;
        this.checkWatermarkPosition(pp, label);

        this.addWatermarkButton.parentNode.insertBefore(section, this.addWatermarkButton);
        this.watermarks[this.watermarkidx] = {
            'str': str,
            'position': this.getDefaultOption(this.options.watermarkPositionOptions, true),
            'color': this.getDefaultOption(this.options.watermarkColorOptions, true),
            'typography': this.getDefaultOption(this.options.watermarkTypographyOptions),
            'font': this.getDefaultOption(this.options.fontOptions),
        };
        this.watermarkidx++;
    }
    checkWatermarkPosition(position, label){
        let availables = this.shape.watermarkPositions;
        let isAvailable = ( availables == 'all' || availables.includes(position) );
        if(isAvailable) label.classList.remove('not-supported');
        else {
            label.classList.add('not-supported');
        }
    }
    updateCounterpartSelect(selectElement, value){
        let options = selectElement.querySelectorAll('option');
        [].forEach.call(options, function(el, i){
            if(el.value == value)
                el.selected = 'selected';                    
        });
    }

    renderControl(){
        if(this.options.shapeOptions && Object.keys(this.options.shapeOptions).length > 1) {
            this.control.appendChild(this.renderShapeSection('shape', 'Shape'));
        }
        if(this.options.animationOptions && Object.keys(this.options.animationOptions).length > 1) {
            const id = 'animation';
            const [section] = this.renderSelectSection(id, 'Animation', { options: this.options.animationOptions});
	        this.control.appendChild(section);
        }
    }
    renderFileField(key, extraClass={'wrapper': [], 'input': []}, extraAttr={'wrapper': null, 'input': null}){
        let id = this.id + '-field-id-' + key;
        let output = document.createElement('div');
        let input = document.createElement('input');
        let label = document.createElement('label');
        let extraWrapperClass = extraClass['wrapper'] && extraClass['wrapper'].length ? ' ' + this.getClassString(extraClass['wrapper']) : '';
        output.className = 'field-wrapper ' + id + '-wrapper' + extraWrapperClass;
        if(extraAttr['wrapper']) output = this.addExtraAttr(output, extraAttr['wrapper']);
        
        let extraInputClass = extraClass['input'] && extraClass['input'].length ? ' ' + this.getClassString(extraClass['input']) : '';
        input.className = 'field-id-' + key + extraInputClass;
        input.id = id;
        input.type = 'file';
		input.setAttribute('image-idx', key);
        label.setAttribute('for', id);
		label.className = 'pseudo-upload';
        label.innerText = 'Choose file';
        output.appendChild(input);
        output.appendChild(label);
        this.fields.media[key] = input
        return output;
    }
    
    renderImageControls(id, control_data){
        return renderImageControls(id, control_data);
	}
    renderNumeralSection(id, displayName, begin, step, min=false, extraClass='', extraWrapperClass='')
    {
        const ex_cls = 'field-id-' + id + ' ' + extraClass;
        const final_id = this.id + '-field-id-' + id;
        const [section, input] = renderNumeralSection(final_id, displayName, begin, step, min, ex_cls, extraWrapperClass);
        this.fields[id] = input;
        return section;
    }
    renderNumeralInput(id, begin, step, min=false, extraClass='', attrs=null){
        let output = document.createElement('INPUT');
        output.className = 'field-id-' + id + ' flex-item ' + extraClass;
        output.type = 'number';
        output.value = begin;
        output.setAttribute('step', step);
        output.setAttribute('min', min);
        if(attrs) {
            for(let attr in attrs) {
                output.setAttribute(attr, attrs[attr]);
            }
        }
		output.id = this.id + '-field-id-' + id;
        return output;
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
    deleteItem(type, idx, panel_section, silent=false){
        if(type === 'watermark') {
            if(this.watermarks[idx]) {
                this.watermarks.splice(idx, 1);
                this.resetWatermarks(true);
                for(let i = 0 ; i < this.watermarks.length; i++) {
                    this.addWatermarkButton.parentNode.insertBefore(this.renderWatermarkSection(i), this.addWatermarkButton);
                }
            }
            if(panel_section)
                panel_section.parentNode.removeChild(panel_section);
        } else if(type === 'media') {
            if(this.media[idx]) {
                delete this.media[idx];
                this.resetMedia(true);
                for(let id in this.media) {
                    // if(id.indexOf('media-') === 0) {
                    //     this.addMedia(id, id.replace('media-', 'Media '));
                    // }
                    
                }
            }
        }
        if(!silent)
            this.canvasObj.draw();
    }
    async readVideo(idx, src, cb){
        // Create video element
        const videoElement = document.createElement('video');
        videoElement.className = 'hidden';
        videoElement.src = src;
        videoElement.loop = true;
        videoElement.controls = true;
        videoElement.muted = true;
        // videoElement.width = 600; // Adjust width as needed

        // Append video element to body
        document.body.appendChild(videoElement);

        // Load and play video
        videoElement.load();
        try {
            await videoElement.play();
        } catch(err)
        {
            console.log(err);
        }
        
        if(typeof cb === 'function')
            cb(idx, videoElement);	
    }
    readImageUploaded(event, cb){
        let input = event.target;
		let idx = input.getAttribute('image-idx');

        if (input.files && input.files[0]) {
        	var FR = new FileReader();
            FR.onload = function (e) {
                this.readImage(idx, e.target.result, (idx, image)=>{
                    input.classList.add('not-empty');
                    if(typeof cb === 'function') cb(idx, image);
                });
            }.bind(this);
            FR.readAsDataURL(input.files[0]);
            input.parentNode.parentNode.classList.add('viewing-image-control');
        }
    }
    updateMediaScale(imgScale, idx, silent = false){
        if(!this.media[idx]) return;
        if(!imgScale) imgScale = 1;
    	this.media[idx].scale = imgScale;
        if(this.media[idx].obj)
    	    this.updateMedia(idx, this.media[idx].obj, silent)
    };
    updateMediaPositionX(imgShiftX, idx, silent = false){
        console.log('updateMediaPositionX', this.media[idx]);
        if(!this.media[idx]) return;
        if(!imgShiftX) imgShiftX = 0;
    	this.media[idx].shiftX = parseFloat(imgShiftX);
        if(this.media[idx].obj)
    	    this.updateMedia(idx, this.media[idx].obj, silent)
    };
    updateMediaPositionY(imgShiftY, idx, silent = false){
        if(!this.media[idx]) return;
        if(!imgShiftY) imgShiftY = 0;
    	this.media[idx].shiftY = parseFloat(imgShiftY);
        if(this.media[idx].obj)
    	    this.updateMedia(idx, this.media[idx].obj, silent)
    };
    updateMediaBlendMode(mode, idx, silent=false){
        if(!this.media[idx]) return;
    	this.media[idx]['blend-mode'] = mode;
        if(this.media[idx].obj)
    	    this.updateMedia(idx, this.media[idx].obj, silent)
    }
    updateMedia(idx, obj, silent = false){
        obj = obj ? obj : (this.media[idx] ? this.media[idx].obj : null);
        if(!obj) return false;
		if(!this.media[idx]) {
			this.media[idx] = {
				obj: null,
				x: 0,
				y: 0,				
				shiftY: 0,
				shiftX: 0,
				scale: 1
			}
		}
		this.media[idx].obj = obj;
	}
    updateFrame(frame){
        frame = frame ? frame : this.generateFrame();
        this.frame = frame;
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
        // counter_field.dispatchEvent(new Event('change', {detail: {isSilent: true}}));
        // counter_field.dispatchEvent(new Event('input', {detail: {isSilent: true}}));
        counter_field.dispatchEvent(new CustomEvent('change', {detail: {isSilent: true, isSyncing: true}}));
        counter_field.dispatchEvent(new CustomEvent('input',  {detail: {isSilent: true, isSyncing: true}}));
        // counter_field.dispatchEvent(new Event('input', {detail: {isSilent: true}}));
    }
    updateCounterpartSelectField(field, index)
    {
        if(!this.counterpart || !field) return;
        let f = field;
        if(typeof f === 'string') {
            if(!this.counterpart.fields[f]) return false;
            f = this.counterpart.fields[field];
        }
        f.selectedIndex = index;
        
    }
    updateCounterpartTextField(field, value)
    {
        if(!this.counterpart || !field) return;
        if(typeof field === 'string' && this.counterpart.fields[field])
            this.counterpart.fields[field].value = value;
        else if (typeof field === 'object')
            field.value = value;
    }

    updateCounterpartWatermarks(silent=false){

        this.fields.watermarks.forEach(function(this_watermark, i){
            if(!this.counterpart.fields.watermarks[i])
                this.counterpart.addWatermark();
            let that_watermark = this.counterpart.fields.watermarks[i];
            for(const name in this_watermark) {
                let field = this_watermark[name];
                let counterField = that_watermark[name];
                if(!counterField || !field) continue;
                if(field.tagName) {
                    this.updateCounterpartField(field, counterField);
                } else {
                    for(const prop in field) {
                        this.updateCounterpartField(field[prop], counterField[prop]);
                    }
                }
            }
        }.bind(this));
    }

    resetWatermarks(fieldOnly=false){
        if(fieldOnly) {
            this.watermarkidx = this.watermarks.length;
        } else {
            this.watermarks = [];
            this.watermarkidx = 0;
        }
        this.fields.watermarks = [];
        let container = this.renderAddWaterMark();
        this.fields['watermark-container'].parentNode.replaceChild(container, this.fields['watermark-container']);
        this.fields['watermark-container'] = container;
    }
    overrideWatermark(idx, text){
        if(!this.watermarks[idx])
            this.addWatermark(text);
        else this.watermarks[idx].str = text;
        let text_field = this.fields.watermarks[ idx ]['text'];
        text_field.value = text;

        // this.watermarks[idx].str = text;
    }
    trimWatermark(idx){
        this.watermarkidx = idx;
        this.watermarks = this.watermarks.slice(0, idx+1);
        this.fields.watermarks = this.fields.watermarks.slice(0, idx+1);
    }
    resetMedia(fieldOnly=false){
        if(fieldOnly) {
            // this.mediaIndex = Object.keys(this.media).filter((item)=>item.indexOf('media') === 0).length;
            this.reindexMedia();
        } else {
            this.media = {};
            this.mediaIndex = 0;
        }
        this.fields.media = {};
        let container = this.renderAddMedia();
        this.fields['media-container'].parentNode.replaceChild(container, this.fields['media-container']);
        this.fields['media-container'] = container;
    }
    reindexMedia(){
        this.mediaIndex = 1;
        let reindexed = {};
        for(let key in this.media) {
            if(key.indexOf('media') === 0) {
                reindexed['media-' + this.mediaIndex] = this.media[key];
                this.mediaIndex++;
            } else {
                reindexed[key] = this.media[key];
            }
        }
        this.media = reindexed;
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
    syncMedia(){
        for(const idx in this.media) {
            if(!this.fieldCounterparts[idx]) continue;
            let counter_idx = this.fieldCounterparts[idx];
            this.counterpart.media[counter_idx] = this.media[idx];
        }
    }
    sync(){
        for(const name in this.fieldCounterparts) {
			let field = this.fields[name];
			let counterField = this.counterpart.fields[this.fieldCounterparts[name]];
            
			if(!counterField || !field) continue;
            this.updateCounterpartField(field, counterField);
		}
        this.syncMedia();
    }
}


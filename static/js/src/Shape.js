
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
		this.framerate = 120;
		this.watermarks = [];
		this.watermarkidx = 0;
		
	    
	    
        this.shapeCenter = {
            x: 0,
            y: 0
        };
        // this.frame = frame;
        
        // this.updateFrame();
        this.fields = {};
        this.fields.watermarks = [];
	}
    init(canvasObj){
        console.log('shape init()');
        this.initialized = true;
        if(!canvasObj) canvasObj = this.canvasObj;
        else this.canvasObj = canvasObj;
        this.control_wrapper = this.canvasObj.control_shape;
        this.control = document.createElement('DIV');
        this.control.className = 'shape-control';
        this.control.id = this.id + '-shape-control';
        this.control.setAttribute('data-shape-id', this.id);
        if(this.control_wrapper.lastElementChild && this.control_wrapper.lastElementChild.classList.contains('shape-general-control')){
            this.control_wrapper.insertBefore(this.control, this.control_wrapper.lastElementChild);
        }
        else
            this.control_wrapper.appendChild(this.control);
        this.frame = this.generateFrame();
    }
    getShapeIndex(){
        console.log(this.canvasObj.shapes);
        for(const index of Object.keys(this.canvasObj.shapes)) {
            console.log(shape);
            console.log(index);
            if(this.canvasObj.shapes[index] === this) {
                this.shape_index = index;
            }
                
        }
    }
	addCounterpart(obj)
	{
		this.counterpart = obj;
	}
	updateShape(shape){
		this.shape = shape;
		this.cornerRadius = shape.cornerRadius;
		this.padding = shape.padding;
        // this.innerPadding.x = shape.innerPadding[0] * this.canvasObj.scale;
        // this.innerPadding.y = shape.innerPadding[1] ? shape.innerPadding[1] * this.canvasObj.scale : shape.innerPadding[0] * this.canvasObj.scale;
        this.innerPadding.x = shape.innerPadding[0];
        this.innerPadding.y = shape.innerPadding[1] ? shape.innerPadding[1] : shape.innerPadding[0];
	}
	
    updateWatermark(idx, values_raw = {str: false, position : false, color : false, fontSize:false, font:false, shift : false, rad:false}){
        let values = values_raw;
        values['position'] = values['position'] ? values['position'] : ( this.watermarks[idx]['position'] ? this.watermarks[idx]['position'] : Object.values(this.options.watermarkPositionOptions)[0].name);
        if(this.watermarks[idx] == undefined)
    	{
    		this.watermarks[idx] = {
    			'str': values['str'],
    			'position': values['position'],
    			'color': values['color'],
    			'fontSize': values['fontSize'],
                'shift': values['shift'],
                'rotate': values['rad']
    		};
    		if (values['font']) this.watermarks[idx].values['font'] = values['font'];
    	}	
    	else
    	{
            for(let name in values) {
                if(values[name] !== false) {
                    this.watermarks[idx][name] = values[name];
                }
            }   
    	} 		
	}
    
    renderSelect(id, options, extraClass='', attrs=null){
        let output = document.createElement('select');
        output.className = 'field-id-' + id + ' ' + extraClass;
        output.id = this.id + '-field-id-' + id;
        if(typeof options === 'object' && options !== null)
        {
            for (const [key, value] of Object.entries(options)) {
                let opt = document.createElement('option');
                opt.value = key;
                opt.innerText = value['name'];
                if(value['default']) opt.selected=true;
                output.appendChild(opt);
            }
        }
        if(attrs) {
            for(let attr in attrs) {
                output.setAttribute(attr, attrs[attr]);
            }
        }

        return output;
    }
    renderSelectField(id, displayName, options, extraClass='')
    {
        let temp_panel_section = document.createElement('DIV');
        temp_panel_section.className  = "panel-section float-container " + extraClass;
        let temp_label = document.createElement('LABEL');
        temp_label.setAttribute('for', id);
        temp_label.innerText = displayName;
        let temp_right = document.createElement('div');
        temp_right.className = 'half-right flex-container';
        let temp_select = this.renderSelect(id, options, 'flex-item');
        temp_right.appendChild(temp_select);
        temp_panel_section.appendChild(temp_label);
        temp_panel_section.appendChild(temp_right);
        this.fields[id] = temp_select;
        return temp_panel_section;
    }
    renderTextField(id, displayName, textPositionOptions, textColorOptions, fontOptions, extraClass='')
    {

        let temp_panel_section = document.createElement('DIV');
        temp_panel_section.className  = "panel-section float-container " + extraClass;
        let temp_label = document.createElement('LABEL');
        temp_label.setAttribute('for', id);
        temp_label.innerText = displayName;
        let temp_right = document.createElement('div');
        temp_right.className = 'half-right flex-container';
        let temp_textarea = document.createElement('TEXTAREA');
        temp_textarea.className = 'flex-item field-id-' + id + ' ' + extraClass;
        temp_textarea.id = this.id + '-field-id-' + id;
        temp_textarea.setAttribute('rows', 3);
        temp_textarea.setAttribute('flex', 'full');
        temp_right.appendChild(temp_textarea);

        let text_controls = [
            { 
                'name': 'position',
                'id': id + '-position',
                'input-type': 'select',
                'options': this.options['textPositionOptions'],
                'attr': {'flex': 'one-third'},
                'class': ''
            },
            { 
                'name': 'color',
                'id': id + '-color',
                'input-type': 'select',
                'options': this.options['textColorOptions'],
                'attr': {'flex': 'one-third'},
                'class': ''
            },
            { 
                'name': 'font',
                'id': id + '-font',
                'input-type': 'select',
                'options': this.options['fontOptions'],
                'attr': {'flex': 'one-third'},
                'class': ''
            },
            { 
                'name': 'shift-x',
                'id': id + '-shift-x',
                'input-type': 'text',
                'attr': {'flex': 'half', 'placeholder' : 'X (0)'},
                'class': ''
            },{ 
                'name': 'shift-y',
                'id': id + '-shift-y',
                'input-type': 'text',
                'attr': {'flex': 'half', 'placeholder' : 'Y (0)'},
                'class': ''
            }
        ]
        this.renderTextControls(id, temp_right, text_controls);
        temp_panel_section.appendChild(temp_label);
        temp_panel_section.appendChild(temp_right);
        this.fields[id] = temp_textarea;
        
        return temp_panel_section;
    }
    renderTextControls(id, container, items=[], cb){
        for (let item of items) {
            if(item['input-type'] === 'select') {
                let cls = item['class'] ? 'flex-item typography-flex-item ' + item['class'] :  'flex-item typography-flex-item';
                item['el'] = this.renderSelect(item['id'], item['options'], cls, item['attr']);
            } else if(item['input-type'] === 'text') {
                let cls = item['class'] ? 'flex-item ' + item['class'] :  'flex-item';
                item['el'] = this.renderInput(item['id'], item['value'], item['attr'], cls);
            }
            container.appendChild(item['el']);
            this.fields[item['id']] = item['el'];
        }
        if(typeof cb === 'function') {
            cb(items);
        }
    }
    // addText(btn, id) {
    //     let type_control = this.field[id].parentNode;
    // }
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
    renderWatermark(idx, extraClass='')
    {
        let id = 'watermark-' + idx;
        let displayName = 'Watermark';
        let temp_panel_section = document.createElement('DIV');
        temp_panel_section.className  = "panel-section float-container " + extraClass;
        let temp_label = document.createElement('LABEL');
        temp_label.setAttribute('for', id);
        temp_label.innerText = displayName;
        let temp_right = document.createElement('DIV');
        temp_right.className = 'half-right flex-container typography-control';
        let temp_input = document.createElement('TEXTAREA');
        temp_input.className = 'field-id-' +id + ' watermark flex-item ' + extraClass;
        temp_input.id = this.id + '-field-id-' +id;
        temp_input.setAttribute('flex', 'full');
        temp_right.appendChild(temp_input);

        // let temp_select_position = this.renderSelect('watermark-position-' + idx, this.options.watermarkPositionOptions, 'watermark-position flex-item typography-flex-item');
        // temp_select_position.setAttribute('flex', 'one-third');
        // temp_right.appendChild(temp_select_position);

        // let temp_select_color = this.renderSelect('watermark-color-' + idx, this.options.textColorOptions, 'watermark-color flex-item typography-flex-item');
        // temp_select_color.setAttribute('flex', 'one-third');
        // temp_right.appendChild(temp_select_color);

        // let temp_select_fontSize = this.renderSelect('watermark-fontsize-' + idx, this.options.watermarkFontOptions, 'watermark-fontsize flex-item typography-flex-item');
        // temp_select_fontSize.setAttribute('flex', 'one-third');
        // temp_right.appendChild(temp_select_fontSize);

        // let temp_input_rotate = this.renderInput('watermark-rotate-' + idx, null, {'flex': 'one-third', 'placeholder' : 'rotate (0)'}, 'watermark-rotate flex-item');
        // let temp_input_x = this.renderInput('watermark-shift-x-' + idx, null, {'flex': 'one-third', 'placeholder' : 'X (0)'}, 'watermark-shift-x flex-item');
        // let temp_input_y = this.renderInput('watermark-shift-y-' + idx, null, {'flex': 'one-third', 'placeholder' : 'Y (0)'}, 'watermark-shift-y flex-item');
        // temp_right.appendChild(temp_input_rotate);
        // temp_right.appendChild(temp_input_x);
        // temp_right.appendChild(temp_input_y);

        this.fields['watermarks'][idx] = 
        {
            'text': temp_input,
            'position': null,
            'color': null,
            'font': null,
            'shift': {
            },
            'rotate': null
        };
        temp_input.onchange = function(e){
            this.updateWatermark(idx, {'str': temp_input.value});
        }.bind(this);

        let text_controls = [
            { 
                'name': 'position',
                'id': 'watermark-position-' + idx,
                'input-type': 'select',
                'options': this.options['watermarkPositionOptions'],
                'attr': {'flex': 'one-third'},
                'class': 'watermark-position'
            },{ 
                'name': 'color',
                'id': 'watermark-color-' + idx,
                'input-type': 'select',
                'options': this.options['textColorOptions'],
                'attr': {'flex': 'one-third'},
                'class': 'watermark-color'
            },{ 
                'name': 'font',
                'id': 'watermark-fontsize-' + idx,
                'input-type': 'select',
                'options': this.options['fontOptions'],
                'attr': {'flex': 'one-third'},
                'class': 'watermark-fontsize'
            },{ 
                'name': 'rotate',
                'id': 'watermark-rotate-' + idx,
                'input-type': 'text',
                'attr': {'flex': 'one-third', 'placeholder' : 'rotate (0)'},
                'class': 'watermark-rotate'
            },{ 
                'name': 'shift-x',
                'id': 'watermark-shift-x-' + idx,
                'input-type': 'text',
                'attr': {'flex': 'one-third', 'placeholder' : 'X (0)'},
                'class': 'watermark-shift-x'
            },{ 
                'name': 'shift-y',
                'id': 'watermark-shift-y-' + idx,
                'input-type': 'text',
                'attr': {'flex': 'one-third', 'placeholder' : 'Y (0)'},
                'class': 'watermark-shift-y'
            }
        ]
        this.renderTextControls(id, temp_right, text_controls, (items)=>{
            let self = this;
            for(let item of items) {
                if(item['name'].indexOf('shift-') === -1) {
                    self.fields['watermarks'][idx][item['name']] = item['el'];
                    item['el'].onchange = function(e){
                        if(item['name'] === 'position') self.checkWatermarkPosition(e.target.value, temp_label);
                        let param = {};
                        param[item['name']] = item['name'] === 'rotate' ? (2 * Math.PI) * e.target.value / 360 : e.target.value;
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
                        let params = {
                            'shift': {}
                        };
                        for(let d in self.fields['watermarks'][idx]['shift']) {
                            params['shift'][d] = parseFloat( self.fields['watermarks'][idx]['shift'][d].value * self.canvasObj.scale);
                        }
                        self.updateWatermark(idx, params);
                    }
                    item['el'].onkeydown = (e) => {
                        let params = {
                            'shift': {}
                        };
                        for(let d in self.fields['watermarks'][idx]['shift']) {
                            params['shift'][d] = parseFloat( self.fields['watermarks'][idx]['shift'][d].value * self.canvasObj.scale);
                        }
                        this.updatePositionByKey(e, self.fields['watermarks'][idx]['shift'], ()=>this.updateWatermark(idx, params));
                    }
                }
                
            }
        });
        temp_panel_section.appendChild(temp_label);
        temp_panel_section.appendChild(temp_right);
        return temp_panel_section;
    }
    renderInput(id, value='', attrs = null, extraClass = ''){
        let output = document.createElement('input');
        output.id = id;
        if(value !== null) output.value = value;
        if(attrs) {
            for(let attr in attrs) {
                output.setAttribute(attr, attrs[attr]);
            }
        }
        if(extraClass) output.className = extraClass;
        return output;
    }
    updateRotationByKey(e, input, cb){
        if(e.keyCode !== 38 && e.keyCode !== 40) return;
        e.preventDefault();
        let val = e.keyCode === 40 ?  -1.0 : 1.0;
        if(!input.value) input.value = 0;
        input.value = this.toFix(input.value) + val;
        input.classList.add('pseudo-focused');

        if(typeof cb === 'function') cb({rotate: input.value});
    }
    updatePositionByKey(e, inputs, cb){
        if(e.keyCode !== 37 && e.keyCode !== 38 && e.keyCode !== 39 && e.keyCode !== 40) return;
        e.preventDefault();
        let val = e.keyCode === 38 || e.keyCode === 37 ? -1.0 : 1.0;
        if(e.keyCode === 38 || e.keyCode === 40) {
            if(!inputs.y.value) inputs.y.value = 0;
            inputs.y.value = this.toFix(inputs.y.value) + val;
        } else if(e.keyCode === 37 || e.keyCode === 39) {
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
    	let container = document.createElement('DIV');
    	container.className = 'watermarks-container';
    	let btn = document.createElement('DIV');
    	btn.className = 'btn-add-watermark';
        this.addWatermarkButton = btn;
    	btn.addEventListener('click', function(){
    		this.addWatermark();
    	}.bind(this));
    	btn.innerText = 'Add a watermark';
    	container.appendChild(btn);
        if(!this.fields['watermark-container']) this.fields['watermark-container'] = container;
    	return container;
    }

    addWatermark(str = ''){
        let sBtn_add_watermark = document.getElementById('btn-add-watermark');
        let newWatermark = this.renderWatermark(this.watermarkidx); 
        
        const availables = this.shape.watermarkPositions;
        let position = newWatermark.querySelector('.watermark-position').value;
        let label = newWatermark.querySelector('label[for^="watermark"]');
        this.pp = position;
        this.checkWatermarkPosition(this.pp, label);

        this.addWatermarkButton.parentNode.insertBefore(newWatermark, this.addWatermarkButton);
        this.watermarks[this.watermarkidx] = {
            'str': str,
            'position': Object.keys(this.options.watermarkPositionOptions)[0],
            'color': Object.keys(this.options.watermarkColorOptions)[0],
            'fontSize': Object.keys(this.options.watermarkFontOptions)[0]
        };
        this.watermarkidx++;
        
    }
    checkWatermarkPosition(positionn, label){
        let availables = this.shape.watermarkPositions;
        let isAvailable = ( availables == 'all' || availables.includes(positionn) );
        if(isAvailable) label.classList.remove('not-supported');
        else label.classList.add('not-supported');
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
            let shape = this.renderSelectField('shape', 'Shape', this.options.shapeOptions);
            shape.querySelector('select').classList.add('flex-item');
            this.control.appendChild(shape);
        }
        if(this.options.animationOptions && Object.keys(this.options.animationOptions).length > 1) {
	        this.control.appendChild(this.renderSelectField('animation', 'Animation', this.options.animationOptions));
        }
    }
    
    updateFrame(frame){
        frame = frame ? frame : this.generateFrame();
        this.frame = frame;
    }

    updateCounterpartSelectField(field, index)
    {
        if(!this.counterpart || !field) return;
        if(typeof field === 'string' && this.counterpart.fields[field])
            this.counterpart.fields[field].selectedIndex = index;
        else if (typeof field === 'object')
            field.selectedIndex = index;
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
        this.fields.watermarks.forEach(function(el, i){
            if(!this.counterpart.fields.watermarks[i])
                this.counterpart.addWatermark();
            let that_watermark = this.counterpart.fields.watermarks[i]
            this.updateCounterpartTextField(that_watermark['text'], this.watermarks[i].str);
            this.updateCounterpartSelectField(that_watermark['position'], el['position'].selectedIndex);
            this.updateCounterpartSelectField(that_watermark['color'], el['color'].selectedIndex);
            this.updateCounterpartSelectField(that_watermark['font'], el['font'].selectedIndex);
            this.counterpart.updateWatermark(i, this.watermarks[i].str, this.watermarks[i].position, this.watermarks[i].color, this.watermarks[i].fontSize, silent);
        }.bind(this));
    }

    resetWatermarks(){
        this.watermarks = [];
        this.watermarkidx = 0;
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
    

}


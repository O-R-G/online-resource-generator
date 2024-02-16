
export class Shape {
	constructor(id, canvasObj, options, control_wrapper, format){
        this.id = id;
        this.options = options;
        this.canvasObj = canvasObj;
		this.canvas = this.canvasObj.canvas;
		this.canvasW = this.canvas.width;
		this.canvasH = this.canvas.height;
		this.shape = Object.values(this.options.shapeOptions)[0].shape;
		this.cornerRadius = this.shape.cornerRadius;
		this.padding = this.shape.padding;
        this.innerPadding = {};
		this.framerate = 120;
		this.watermarks = [];
		this.watermarkidx = 0;
		
	    this.control_wrapper = this.canvasObj.control_shape;
        this.control = document.createElement('DIV');
        this.control.className = 'shape-control';
        this.control.id = this.id + '-shape-control';
        if(this.control_wrapper.lastElementChild && this.control_wrapper.lastElementChild.classList.contains('shape-general-control')){
            this.control_wrapper.insertBefore(this.control, this.control_wrapper.lastElementChild);
        }
        else
            this.control_wrapper.appendChild(this.control);
	    this.format = format;
        this.shapeCenter = {
            x: 0,
            y: 0
        };
        // this.frame = frame;
        this.frame = this.generateFrame();
        // this.updateFrame();
        this.fields = {};
        this.fields.watermarks = [];
	}

	addCounterpart(obj)
	{
		this.counterpart = obj;
	}
	updateShape(shape){
		this.shape = shape;
		this.cornerRadius = shape.cornerRadius;
		this.padding = shape.padding;
        this.innerPadding.x = shape.innerPadding[0] * this.canvasObj.scale;
        this.innerPadding.y = shape.innerPadding[1] ? shape.innerPadding[1] * this.canvasObj.scale : shape.innerPadding[0] * this.canvasObj.scale;
	}
	
    updateWatermark(idx, str = false, position = false, color = false, fontSize=false, font=false, shift = null, rad=0){
        position = position ? position : Object.values(this.options.watermarkPositionOptions)[0].name;
        if(this.watermarks[idx] == undefined)
    	{
    		this.watermarks[idx] = {
    			'str': str,
    			'position': position,
    			'color': color,
    			'fontSize': fontSize,
                'shift': shift,
                'rotate': rad
    		};
    		if (font) this.watermarks[idx].font = font;
    	}	
    	else
    	{
    		if(str !== false)
				this.watermarks[idx].str = str;
			if(position !== false)
				this.watermarks[idx].position = position;
			if(color !== false)
				this.watermarks[idx].color = color;
			if(fontSize !== false)
				this.watermarks[idx].fontSize = fontSize;
            if(shift !== null)
                this.watermarks[idx].shift = shift;
            this.watermarks[idx].rotate = rad;
    	} 		
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
        // temp_right.setAttribute('flex-wrap', 'wrap');
        let temp_textarea = document.createElement('TEXTAREA');
        temp_textarea.className = 'flex-item field-id-' + id + ' ' + extraClass;
        temp_textarea.setAttribute('rows', 3);
        temp_textarea.setAttribute('flex', 'full');

        let temp_select_textPosition = this.renderSelect(id + '-position', textPositionOptions, 'flex-item typography-flex-item');
        let temp_select_textColor = this.renderSelect(id + '-color', textColorOptions, 'flex-item typography-flex-item');
        let temp_select_font = this.renderSelect(id + '-font', fontOptions, 'flex-item typography-flex-item');
        temp_select_textPosition.setAttribute('flex', 'one-third');
        temp_select_textColor.setAttribute('flex', 'one-third');
        temp_select_font.setAttribute('flex', 'one-third');
        
        let temp_input_x = this.renderInput(id + '-shift-x', null, {'flex': 'half', 'placeholder' : 'X (0)'}, 'flex-item');
        let temp_input_y = this.renderInput(id + '-shift-y', null, {'flex': 'half', 'placeholder' : 'Y (0)'}, 'flex-item');
        
        temp_right.appendChild(temp_textarea);
        temp_right.appendChild(temp_select_textPosition);
        temp_right.appendChild(temp_select_textColor);
        temp_right.appendChild(temp_select_font);
        temp_right.appendChild(temp_input_x);
        temp_right.appendChild(temp_input_y);

        temp_panel_section.appendChild(temp_label);
        temp_panel_section.appendChild(temp_right);
        // temp_panel_section.appendChild(add);
        this.fields[id] = temp_textarea;
        this.fields[id + '-position'] = temp_select_textPosition;
        this.fields[id + '-color'] = temp_select_textColor;
        this.fields[id + '-font'] = temp_select_font;
        this.fields[id + '-shift-x'] = temp_input_x;
        this.fields[id + '-shift-y'] = temp_input_y;
        return temp_panel_section;
    }
    addText(btn, id) {
        let type_control = this.field[id].parentNode;
        

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
        temp_input.setAttribute('flex', 'full');
        temp_right.appendChild(temp_input);

        let temp_select_position = this.renderSelect('watermark-position-' + idx, this.options.watermarkPositionOptions, 'watermark-position flex-item typography-flex-item');
        temp_select_position.setAttribute('flex', 'one-third');
        temp_right.appendChild(temp_select_position);

        let temp_select_color = this.renderSelect('watermark-color-' + idx, this.options.textColorOptions, 'watermark-color flex-item typography-flex-item');
        temp_select_color.setAttribute('flex', 'one-third');
        temp_right.appendChild(temp_select_color);

        let temp_select_fontSize = this.renderSelect('watermark-fontsize-' + idx, this.options.watermarkFontOptions, 'watermark-fontsize flex-item typography-flex-item');
        temp_select_fontSize.setAttribute('flex', 'one-third');
        temp_right.appendChild(temp_select_fontSize);

        let temp_input_rotate = this.renderInput('watermark-rotate-' + idx, null, {'flex': 'one-third', 'placeholder' : 'rotate (0)'}, 'watermark-rotate flex-item');
        let temp_input_x = this.renderInput('watermark-shift-x-' + idx, null, {'flex': 'one-third', 'placeholder' : 'X (0)'}, 'watermark-shift-x flex-item');
        let temp_input_y = this.renderInput('watermark-shift-y-' + idx, null, {'flex': 'one-third', 'placeholder' : 'Y (0)'}, 'watermark-shift-y flex-item');
        temp_right.appendChild(temp_input_rotate);
        temp_right.appendChild(temp_input_x);
        temp_right.appendChild(temp_input_y);

        this.fields['watermarks'][idx] = 
        {
            'text': temp_input,
            'position': temp_select_position,
            'color': temp_select_color,
            'font': temp_select_fontSize,
            'shift': {
                x: temp_input_x,
                y: temp_input_y
            },
            'rotate': temp_input_rotate
        };
        temp_input.onchange = function(e){
            this.updateWatermark(idx, temp_input.value, temp_select_position.value, temp_select_color.value, temp_select_fontSize.value, false, {x: temp_input_x.value * this.canvasObj.scale, y: temp_input_y.value * this.canvasObj.scale}, (2 * Math.PI) * temp_input_rotate.value / 360);
        }.bind(this);
        temp_select_position.onchange = function(e){
            this.checkWatermarkPosition(e.target.value, temp_label);
            this.updateWatermark(idx, temp_input.value, e.target.value, temp_select_color.value, temp_select_fontSize.value, false, {x: temp_input_x.value * this.canvasObj.scale, y: temp_input_y.value * this.canvasObj.scale}, (2 * Math.PI) * temp_input_rotate.value / 360);
        }.bind(this);
        temp_select_color.onchange = function(e){
            this.updateWatermark(idx, temp_input.value, temp_select_position.value, e.target.value, temp_select_fontSize.value, false, {x: temp_input_x.value * this.canvasObj.scale, y: temp_input_y.value * this.canvasObj.scale}, (2 * Math.PI) * temp_input_rotate.value / 360);
        }.bind(this);
        temp_select_fontSize.onchange = function(e){
            this.updateWatermark(idx, temp_input.value, temp_select_position.value, temp_select_color.value, temp_select_fontSize.value, false, {x: temp_input_x.value * this.canvasObj.scale, y: temp_input_y.value * this.canvasObj.scale}, (2 * Math.PI) * temp_input_rotate.value / 360);
        }.bind(this);
        temp_input_rotate.onchange = function(e){
            // console.log(temp_input_rotate.value);
            // console.log((2 * Math.PI) * temp_input_rotate.value / 360)
            this.updateWatermark(idx, temp_input.value, temp_select_position.value, temp_select_color.value, temp_select_fontSize.value, false, {x: temp_input_x.value * this.canvasObj.scale, y: temp_input_y.value * this.canvasObj.scale}, (2 * Math.PI) * temp_input_rotate.value / 360);
        }.bind(this);
        temp_input_x.onchange = function(e){
            this.updateWatermark(idx, temp_input.value, temp_select_position.value, temp_select_color.value, temp_select_fontSize.value, false, {x: temp_input_x.value, y: temp_input_y.value}, (2 * Math.PI) * temp_input_rotate.value / 360);
        }.bind(this);
        temp_input_y.onchange = function(e){
            this.updateWatermark(idx, temp_input.value, temp_select_position.value, temp_select_color.value, temp_select_fontSize.value, false, {x: temp_input_x.value, y: temp_input_y.value}, (2 * Math.PI) * temp_input_rotate.value / 360);
        }.bind(this);
        temp_input_x.onkeydown = e => this.updatePositionByKey(e, {x: temp_input_x, y:temp_input_y}, ()=>this.updateWatermark(idx, temp_input.value, temp_select_position.value, temp_select_color.value, temp_select_fontSize.value, false, {x: temp_input_x.value, y: temp_input_y.value}, (2 * Math.PI) * temp_input_rotate.value / 360));
        temp_input_y.onkeydown = e => this.updatePositionByKey(e, {x: temp_input_x, y:temp_input_y}, ()=>this.updateWatermark(idx, temp_input.value, temp_select_position.value, temp_select_color.value, temp_select_fontSize.value, false, {x: temp_input_x.value, y: temp_input_y.value}, (2 * Math.PI) * temp_input_rotate.value / 360));
        temp_input_x.onblur = () => {
            this.unfocusInputs([temp_input_x, temp_input_y]);
        }
        temp_input_y.onblur = () => {
            this.unfocusInputs([temp_input_x, temp_input_y]);
        }
        
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
    updatePositionByKey(e, inputs, cb){
        if(e.keyCode !== 37 && e.keyCode !== 38 && e.keyCode !== 39 && e.keyCode !== 40) return;
        e.preventDefault();
        let val = e.keyCode === 38 || e.keyCode === 37 ? -1.0 : 1.0;
        // console.log('updatePositionByKey: ' + e.keyCode);
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
        // this.updateWatermark();
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
        if(this.options.shapeOptions && this.options.shapeOptions.length > 1) {
            let shape = this.renderSelectField('shape', 'Shape', this.options.shapeOptions);
            shape.querySelector('select').classList.add('flex-item');
            this.control.appendChild(shape);
        }
        if(this.options.animationOptions && this.options.animationOptions.length > 1) {
	        this.control.appendChild(this.renderSelectField('animation', 'Animation', this.options.animationOptions));
        }
    }
    
    updateFrame(frame){
        frame = frame ? frame : this.generateFrame();
        this.frame = frame;
    }

    updateCounterpartSelectField(field, index)
    {
        if(typeof field === 'string')
            this.counterpart.fields[field].selectedIndex = index;
        else
            field.selectedIndex = index;
    }
    updateCounterpartTextField(field, value)
    {
        if(typeof field === 'string')
            this.counterpart.fields[field].value = value;
        else
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
    generateFrame()
    {
        let output = {};
        let shapeCenter = this.isThree ? {x: 0, y: 0} : {x: this.canvasObj.canvas.width / 2, y: this.canvasObj.canvas.height / 2};
        // assuming vertically stacking only
        let unit_w = this.canvasObj.canvas.width;
        let unit_h = this.canvasObj.canvas.height / (this.canvasObj.shapes.length || 1);
        if(this.shape.base == 'fill') {
            output.w = unit_w;
            output.h = unit_h;
        }
        else {
            let length = unit_w > unit_h ? unit_h : unit_w;
            output.w = length;
            output.h = length;
        }
        
        output.x = !this.isThree ? shapeCenter.x - output.w / 2 : shapeCenter.x;
        output.y = !this.isThree ? shapeCenter.y - output.h / 2 : shapeCenter.y;
        return output;
    }

}


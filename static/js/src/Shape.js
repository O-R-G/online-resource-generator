
export class Shape {
	constructor(id, canvasObj, options, control_wrapper, format, frame){
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
        this.frame = frame;
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
        this.innerPadding.x = shape.innerPadding[0];
        this.innerPadding.y = shape.innerPadding[1] ? shape.innerPadding[1] : shape.innerPadding[0];
	}
	
    updateWatermark(idx, str = false, position = false, color = false, fontSize=false, font=false){
        position = position ? position : Object.values(this.options.watermarkPositionOptions)[0].name;
        if(this.watermarks[idx] == undefined)
    	{
    		this.watermarks[idx] = {
    			'str': str,
    			'position': position,
    			'color': color,
    			'fontSize': fontSize
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
        let temp_select = this.renderSelect(id, options);
        temp_panel_section.appendChild(temp_label);
        temp_panel_section.appendChild(temp_select);
        this.fields[id] = temp_select;
        return temp_panel_section;
    }
    renderTextField(id, displayName, textPositionOptions, textColorOptions, fontOptions, content = null, extraClass='')
    {

        let temp_panel_section = document.createElement('DIV');
        temp_panel_section.className  = "panel-section float-container " + extraClass;
        let temp_label = document.createElement('LABEL');
        temp_label.setAttribute('for', id);
        temp_label.innerText = displayName;
        let temp_div = document.createElement('DIV');
        let temp_textarea = document.createElement('TEXTAREA');
        temp_textarea.className = 'field-id-' + id + ' ' + extraClass;
        temp_textarea.setAttribute('rows', 3);
        let temp_select_textPosition = this.renderSelect(id + '-position', textPositionOptions, 'flex-item typography-flex-item');
        let temp_select_textColor = this.renderSelect(id + '-color', textColorOptions, 'flex-item typography-flex-item');
        let temp_select_font = this.renderSelect(id + '-font', fontOptions, 'flex-item typography-flex-item');
        let flex_container = document.createElement('DIV');
        flex_container.className = 'flex-container typography-control';
        flex_container.appendChild(temp_textarea);
        flex_container.appendChild(temp_select_textPosition);
        flex_container.appendChild(temp_select_textColor);
        flex_container.appendChild(temp_select_font);
        temp_panel_section.appendChild(temp_label);
        temp_panel_section.appendChild(flex_container);
        this.fields[id] = temp_textarea;
        this.fields[id + '-position'] = temp_select_textPosition;
        this.fields[id + '-color'] = temp_select_textColor;
        this.fields[id + '-font'] = temp_select_font;
        return temp_panel_section;
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
        temp_right.className = 'flex-container typography-control';
        let temp_input = document.createElement('INPUT');
        temp_input.type = 'text';
        temp_input.className = 'field-id-' +id + ' watermark ' + extraClass;
        temp_right.appendChild(temp_input);

        let temp_select_position = this.renderSelect('watermark-position-' + idx, this.options.watermarkPositionOptions, 'watermark-position flex-item typography-flex-item');
        temp_right.appendChild(temp_select_position);

        let temp_select_color = this.renderSelect('watermark-color-' + idx, this.options.textColorOptions, 'watermark-color flex-item typography-flex-item');
        temp_right.appendChild(temp_select_color);

        let temp_select_fontSize = this.renderSelect('watermark-fontsize-' + idx, this.options.fontOptions, 'watermark-fontsize flex-item typography-flex-item');
        temp_right.appendChild(temp_select_fontSize);

        this.fields['watermarks'][idx] = 
            {
                'text': temp_input,
                'position': temp_select_position,
                'color': temp_select_color,
                'font': temp_select_fontSize
            };
        temp_input.onchange = function(e){
            this.updateWatermark(idx, temp_input.value, temp_select_position.value, temp_select_color.value, temp_select_fontSize.value);
            // ShapeAnimatedObj.updateWatermark(idx, e.target.value, temp_select_position.value, temp_select_color.value, temp_select_fontSize.value);
        }.bind(this);
        temp_select_position.onchange = function(e){
            this.checkWatermarkPosition(e.target.value, temp_label);
            this.updateWatermark(idx, temp_input.value, e.target.value, temp_select_color.value, temp_select_fontSize.value);
            // ShapeAnimatedObj.updateWatermark(idx, temp_input.value, e.target.value, temp_select_color.value, temp_select_fontSize.value);
        }.bind(this);
        temp_select_color.onchange = function(e){
            this.updateWatermark(idx, temp_input.value, temp_select_position.value, e.target.value, temp_select_fontSize.value);
            // ShapeAnimatedObj.updateWatermark(idx, temp_input.value, temp_select_position.value, e.target.value, temp_select_fontSize.value);
        }.bind(this);
        temp_select_fontSize.onchange = function(e){
            this.updateWatermark(idx, temp_input.value, temp_select_position.value, temp_select_color.value, e.target.value);
            // ShapeAnimatedObj.updateWatermark(idx, temp_input.value, temp_select_position.value, temp_select_color.value, e.target.value);
        }.bind(this);

        temp_panel_section.appendChild(temp_label);
        temp_panel_section.appendChild(temp_right);
        return temp_panel_section;
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
            'fontSize': Object.keys(this.options.fontOptions)[0]
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

    renderControl(isThree = false){
        this.control.appendChild(this.renderSelectField('shape', 'Shape', this.options.shapeOptions));
	    this.control.appendChild(this.renderSelectField('animation', 'Animation', this.options.animationOptions));
	    if(!isThree){
	    	this.control.appendChild(this.renderSelectField('shape-color', 'Color', this.options.colorOptions));
            if(!this.canvasObj.fields['record'])
                this.control.appendChild(this.canvasObj.renderRecordFetchingForm());
	    	this.control.appendChild(this.renderTextField('text', 'Text', this.options.textPositionOptions, this.options.textColorOptions, this.options.fontOptions, this.str));
	    }
	    else
	    {
            // this.control.appendChild(this.renderSelectField('animation', 'Animation', this.animationOptions));
	    	this.control.appendChild(this.renderSelectField('shape-front-color', 'Color (front)', this.options.colorOptions));
	    	this.control.appendChild(this.renderSelectField('shape-back-color', 'Color (back)', this.options.colorOptions));
            this.fields['shape-back-color'].selectedIndex = 1;
            if(!this.canvasObj.fields['record'])
                this.control.appendChild(this.canvasObj.renderRecordFetchingForm());
	    	this.control.appendChild(this.renderTextField('text-front', 'Text (front)', this.options.textPositionOptions, this.options.textColorOptions, this.options.fontOptions, this.frontText));
    		this.control.appendChild(this.renderTextField('text-back', 'Text (back)', this.options.textPositionOptions, this.options.textColorOptions, this.options.fontOptions, this.backText));
	    }
	    
	    // this.control_wrapper.appendChild(this.renderAddWaterMark());
    }
    
    updateFrame(frame){
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
}


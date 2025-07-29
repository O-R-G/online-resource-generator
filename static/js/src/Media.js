import {renderNumeralSection, renderSelectSection} from "./utils/render.js"
export default class Media{
    constructor(key, shape, options, values){
        this.key = key;
        this.prefix = shape.id + '-field-id-' + key;
        this.canvasObj = shape.canvasObj;
        this.options = options;
        this.control_data = [
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
            this.control_data.push({ 
                'name': 'blend-mode',
                'displayName': 'Blend mode',
                'id': id + '-blend-mode',
                'input-type': 'select',
                'attr': {'flex': 'half', 'placeholder' : 'Blend Mode'},
                'meta': {options: this.options['blendModeOptions']},
                'class': ['img-control-blend-mode', 'flex-item']
            });
        }
    }
    update(values){
        for(const prop in values) {
            if(typeof this.template[prop] === 'undefined') continue;
            this[prop] = values[prop];
        }
    }
    renderControls(id='', control_data=[]){
        let container = document.createElement('div');
        container.className = 'field-id-image-controls float-container flex-item';
        container.id = id ? id + '-field-id-image-controls' : '';
        container.setAttribute('flex', 'full');
        for(const control of control_data) {
            if(control['input-type'] === 'number') {
                let [section] = renderNumeralSection(control['id'], control['displayName'], control.meta.begin, control.meta.step, false, control['class'], ['media-control-section']);
                container.append(section);
            }else if(control['input-type'] === 'select') {
                let [section] = renderSelectSection(control['id'], control['displayName'], { options: control.meta.options}, control['class'], ['media-control-section']);
                container.append(section);
            }
            
        }
        
        return container;
    }
}
export class Record {
    constructor(container, record_url='', canvasObjs=[]){
        this.container = container;
        this.record_url = record_url;
        this.canvasObjs = canvasObjs;
        this.record_body = '';
        this.form_action = this.record_url ? 'save' : 'insert';
        this.request_url = '/online-resource-generator/static/php/recordHandler.php';
        this.elements = {
            'form': null,
            'button': null
        }
        if (this.record_url)
            this.fetchRecord(this.record_url, () => {
                setTimeout(()=>this.applySavedRecord(), 0);
            });
        this.renderElements();
        this.addListeners();
    }
    renderElements(){
        this.elements.form = document.createElement('form');
        this.elements.form.method = 'post';
        this.elements.form.id = 'record-form';
        // this.elements.form.className = 'panel-section';
        let input_action = document.createElement('input');
        input_action.type = 'hidden';
        input_action.name = 'action';
        input_action.value = this.form_action;
        let temp_flex_container = document.createElement('div');
        temp_flex_container.className = 'flex-container';

        this.elements.save_button = document.createElement('div');
        this.elements.save_button.className = 'record-form-button button-like-label flex-item';
        this.elements.save_button.setAttribute('flex', 'half');
        this.elements.save_button.id = 'save-record-button';
        this.elements.save_button.innerHTML = 'Save <img class="inline-icon" src="/online-resource-generator/media/svg/save-3-w.svg">';

        this.elements.share_button = document.createElement('div');
        this.elements.share_button.className = 'record-form-button button-like-label flex-item';
        this.elements.share_button.setAttribute('flex', 'half');
        this.elements.share_button.id = 'fetch-record-button';
        this.elements.share_button.innerHTML = 'Share <img class="inline-icon" src="/online-resource-generator/media/svg/share-3-w.svg">';
        
        temp_flex_container.appendChild(this.elements.save_button);
        temp_flex_container.appendChild(this.elements.share_button);
        this.elements.form.append(input_action);
        this.elements.form.appendChild(temp_flex_container);
        this.container.appendChild(this.elements.form);
    }
    addListeners(){
        this.elements.save_button.addEventListener('click', (event)=>{
            this.submit(event, ()=>{
                alert('Saved!');
            });
        })
        this.elements.share_button.addEventListener('click', (event)=>{
            if(!this.record_url) alert('You have to save the draft before you can share it.')
            else {

                let url = location.href;
                if(!navigator.clipboard) {
                    alert('There is some error when trying to copy the URL to your clipboard...');
                    return;
                }
                navigator.clipboard.writeText(url).then(function() {
                    alert('URL is copied to your clipboard!');
                }).catch(function(err) {
                    
                    let textArea = document.createElement("textarea");
                    textArea.value = url;

                    // Avoid scrolling to bottom
                    textArea.style.top = "0";
                    textArea.style.left = "0";
                    textArea.style.position = "fixed";

                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();

                    try {
                        var successful = document.execCommand('copy');
                        if (successful) {
                            alert('URL is copied to your clipboard!');
                        }
                        else {
                            console.error('copy clipboard fallback error...');
                        }
                        // var msg = successful ? 'successful' : 'unsuccessful';
                        // console.log('Fallback: Copying text command was ' + msg);
                        
                    } catch (err) {
                        alert('There is some error when trying to copy the URL to your clipboard...');
                        // console.error('Fallback: Oops, unable to copy', err);
                    }
                    document.body.removeChild(textArea);
                });
            }
        })
        // this.elements.fetch_button.addEventListener('click', (event) =>{
        //     event.preventDefault();
        //     if (!this.elements.input_id.value || this.elements.input_id.value == this.record_url) return;
        //     this.fetchRecord(this.elements.input_id.value, ()=>{
        //         window.location.href='?record=' + this.elements.input_id.value;
        //     });
        // })
    }
    fetchRecord(record_url='', callback=null){
        let data = new FormData();
        if (!record_url) record_url = this.record_url
        // console.log(record_url);
        let data_json = {
            'action': 'get',
            'record_url': record_url
        }
        for(let prop in data_json)
            data.append(prop, data_json[prop]);
        fetch(this.request_url, {
            method: 'POST',
            body: data
        }).then((response) => response.json()
        ).then((json) => {
            if(json['status'] == 'success') {
                this.record_body = JSON.parse(json['body']);
                // console.log(this.record_body);
                if (typeof callback == 'function') {
                    callback();
                }
            } else {
                alert('Fail to find any record');
            }
        })
    }
    applySavedRecord(){
        // let static_fields = [], animated_fields = [];
        let active_canvas_fields = [];
        // let viewingThree = false;
        let params = new URL(document.location).searchParams;
        let format = params.get("format");
        let hasSecondShape = false;
        console.log(this.record_body)
        for(let canvas_id in this.record_body) {
            let canvas_data = this.record_body[canvas_id];
            let isThree = canvas_data['isThree'];
            let active = canvas_data['active'];
            if(isThree && active) document.body.classList.add('viewing-three');
            // console.log(Object.keys(canvas_data['shape-controls']).length > 1);
            if(Object.keys(canvas_data['shape-controls']).length > 1 && !hasSecondShape) {
                hasSecondShape = true;
            }
            if(hasSecondShape && canvas_data['add_second_shape_button']) {
                // console.log(canvas_data['add_second_shape_button']);
                let btn = document.getElementById(canvas_data['add_second_shape_button']['id']);
                btn.click();
            }
                
            for(let common_control_id in canvas_data['common-controls']) {
                let data = canvas_data['common-controls'][common_control_id];
                let common_control = document.getElementById(common_control_id);
                if (!common_control) continue;
                // let isThree = data['isThree'];
                let fields = data['fields'];
                for (let field of fields) {
                    if(!field['id']) {
                        continue;
                    }
                    let field_element = common_control.querySelector('#' + field['id']);
                    if(!field_element) continue;
                    if(!field_element.classList.contains('field-id-format') || !format) { 
                        field_element.value = field['value'];
                    } else 
                        field_element.value = format;
                    

                    if (field_element.tagName.toLowerCase() == 'textarea') 
                        field_element.innerText = field['value'];
                    else if(field_element.tagName.toLowerCase() == 'select') {
                        for(let i = 0; i < field_element.options.length; i++) {
                            // console.log(field_element.options[i].value);
                            if (field_element.options[i].value === field_element.value) {
                                field_element.selectedIndex = i;
                                break;
                            }
                        }
                    }

                    if(active) active_canvas_fields.push(field_element);
                }
            }
            for(let shape_control_id in canvas_data['shape-controls']) {
                let data = canvas_data['shape-controls'][shape_control_id];
                console.log(shape_control_id);
                let shape_control = document.getElementById(shape_control_id);
                if (!shape_control) continue;
                console.log('yaya');
                // console.log(shape_control);
                // let isThree = data['isThree'];
                for(let i = 0 ; i < data['watermarks_num']; i++) {
                    for (let j = 0; j < this.canvasObjs.length; j++) {
                        for (let k = 0; k < this.canvasObjs[j].shapes.length; k++) {
                            this.canvasObjs[j].shapes[k].addWatermark();
                        }
                    }
                }
                let fields = data['fields'];
                for (let field of fields) {
                    if(!field['id']) {
                        continue;
                    }
                    
                    let field_element = shape_control.querySelector('#' + field['id']);
                    if(!field_element) continue;
                    if(shape_control_id === 'animated-shape-1-shape-control')
                        console.log(active);
                    field_element.value = field['value'];
                    if (field_element.tagName.toLowerCase() == 'textarea') 
                        field_element.innerText = field['value'];
                    else if(field_element.tagName.toLowerCase() == 'select') {
                        for(let i = 0; i < field_element.options.length; i++) {
                            if (field_element.options[i].value === field_element.value) {
                                field_element.selectedIndex = i;
                                break;
                            }
                        }
                    }
                    
                    if(active) active_canvas_fields.push(field_element);
                }
            }
        }
        for(let field_element of active_canvas_fields) {
            if(field_element.classList.contains('field-id-format') && format) continue;
            field_element.dispatchEvent(new Event('change'));
        }
            
    }
    submit(event, cb){
        event.preventDefault();
        let data = new FormData(this.elements.form);
        // let record_body = {
        //     'shape-controls': {},
        //     'common-controls': {}
        // };
        let record_body = {};
        let record_name = 'new poster';

        let containers = document.querySelectorAll('.generator-container');
        for (let container of containers) {
            let canvas_id = container.getAttribute('data-canvas-id');
            let isThree = container.getAttribute('data-is-three') == 'true';
            record_body[canvas_id] = {
                isThree: isThree,
                active: (document.body.classList.contains('viewing-three') && isThree) || (!document.body.classList.contains('viewing-three') && !isThree),
                'common-controls': {},
                'shape-controls': {},
                'this.record_body': null
            }

            let shape_controls = container.querySelectorAll('.shape-control');
            for(let shape_control of shape_controls) {
                let watermarks = shape_control.querySelectorAll('.watermark');
                let watermarks_num = 0;
                for (let watermark of watermarks) {
                    if (!watermark.value) continue;
                    watermarks_num++;
                }
                let data = {
                    'id': shape_control.id,
                    'type': 'shape_control',
                    'fields': [],
                    'watermarks_num': watermarks_num,
                    'isThree': shape_control.classList.contains('animated-shape-control')
                }
                let fields = shape_control.querySelectorAll('select, input, textarea');
                for(let field of fields) {
                    if(!field.value) continue;
                    let this_field = {
                        'id': field.id,
                        'value': field.value
                    }
                    data['fields'].push(this_field);
                    if (field.classList.contains('field-id-text'))
                        record_name = field.value;
                }
                record_body[canvas_id]['shape-controls'][shape_control['id']] = data;
            }
            let common_controls = container.querySelectorAll('.common-control');
            for(let common_control of common_controls) {
                let data = {
                    'id': common_control['id'],
                    'type': 'common_control',
                    'fields': [],
                    'isThree': common_control.classList.contains('animated-common-control'),
                    'add_second_shape_button': null
                }
                let fields = common_control.querySelectorAll('select, input, textarea');
                for(let field of fields) {
                    if(field.classList.contains('second-shape-button')) {
                        console.log('yaya');
                        console.log(field.classList);
                        record_body[canvas_id]['add_second_shape_button'] = {'id': field.id};
                        continue;
                    }
                        
                    if(!field.value) {
                        
                        
                        continue;
                    }
                    let this_field = {
                        'id': field.id,
                        'value': field.value
                    }
                    data['fields'].push(this_field);
                }
                record_body[canvas_id]['common-controls'][common_control['id']] = data;
            }
        }

        
        
        // for(let shape_control of shape_controls) {
        //     let watermarks = shape_control.querySelectorAll('.watermark');
        //     let watermarks_num = 0;
        //     for (let watermark of watermarks) {
        //         if (!watermark.value) continue;
        //         watermarks_num++;
        //     }
        //     let data = {
        //         'id': shape_control.id,
        //         'type': 'shape_control',
        //         'fields': [],
        //         'watermarks_num': watermarks_num,
        //         'isThree': shape_control.classList.contains('animated-shape-control')
        //     }
        //     let fields = shape_control.querySelectorAll('select, input, textarea');
        //     for(let field of fields) {
        //         if(!field.value) continue;
        //         let this_field = {
        //             'id': field.id,
        //             'value': field.value
        //         }
        //         data['fields'].push(this_field);
        //         if (field.classList.contains('field-id-text'))
        //             record_name = field.value;
        //     }
        //     record_body['shape-controls'][shape_control['id']] = data;
        // }
        // let common_controls = document.querySelectorAll('.common-control');
        // for(let common_control of common_controls) {
        //     let data = {
        //         'id': common_control['id'],
        //         'type': 'common_control',
        //         'fields': [],
        //         'isThree': common_control.classList.contains('animated-common-control')
        //     }
        //     let fields = common_control.querySelectorAll('select, input, textarea');
        //     for(let field of fields) {
        //         if(!field.value) continue;
        //         let this_field = {
        //             'id': field.id,
        //             'value': field.value
        //         }
        //         data['fields'].push(this_field);
        //     }
        //     record_body['common-controls'][common_control['id']] = data;
        // }
        console.log(record_body);
        record_body = JSON.stringify(record_body);
        
        data.append('record_body', record_body);
        data.append('record_name', record_name);
        data.append('record_url', this.record_url);
    // }
        fetch(this.request_url, {
            method: 'POST',
            body: data
        }).then((response) => response.json()
        ).then((json) => {
            if(json['status'] == 'success') {
                if (this.form_action == 'insert') {
                    // alert('Saved!');
                    window.location.href = json['body'];
                }
                else if(this.form_action == 'save')
                    console.log(json['body']);
            }
        }).then((json)=>{
            if (typeof cb === 'function')
                cb(json);
        })
    }
}

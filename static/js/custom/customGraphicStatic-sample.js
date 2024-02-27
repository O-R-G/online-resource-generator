console.log('customGraphicStatic');
class customGraphicStatic{
    constructor(shapeObj){
        // console.log('drawCustomGraphic')
        // this.shapeObj = shape;
        this.shapeObj = shapeObj;
        this.canvasObj = shapeObj.canvasObj;
        this.context = shapeObj.context;
        this.display = {
            'button': 'Add logo'
        }
        this.elements = {};
        this.added = false;
        this.scale = 1.0;
        this.position = {
            x: this.shapeObj.toFix(this.canvasObj.canvas.width - (120 + this.shapeObj.shape.innerPadding[0]) * this.canvasObj.scale),
            y: this.shapeObj.toFix(this.canvasObj.canvas.height - (111 + this.shapeObj.shape.innerPadding[0]) * this.canvasObj.scale)
        }
        console.log(this.position);
        this.init();
    }
    init() {
        let container = document.createElement('DIV');
        container.className = 'panel-section float-container';
        let btn = document.createElement('DIV');
        btn.className = 'btn-add btn-add-custom-graphic';
        this.addCustomGraphicButton = btn;
        btn.addEventListener('click', function(){
            this.added = true;
            btn.style.display = 'none';
            btn.nextElementSibling.style.display = 'block';
            btn.nextElementSibling.nextElementSibling.style.display = 'flex';
            this.canvasObj.draw();
        }.bind(this));
        btn.innerText = this.display.button ? this.display.button : 'Add a custom graphic';
        this.elements.scale = document.createElement('input');
        this.elements.scale.placeholder = 'scale (1.0)';
        this.elements.scale.className = 'flex-item';
        this.elements.scale.setAttribute('flex', 'one-third');
        this.elements.positionX = document.createElement('input');
        this.elements.positionX.placeholder = 'X ('+this.position.x/2+')';
        this.elements.positionX.className = 'flex-item';
        this.elements.positionX.setAttribute('flex', 'one-third');
        this.elements.positionY = document.createElement('input');
        this.elements.positionY.placeholder = 'Y ('+this.position.y/2+')';
        this.elements.positionY.className = 'flex-item';
        this.elements.positionY.setAttribute('flex', 'one-third');
        let temp_right = document.createElement('div');
        temp_right.className = 'half-right flex-container';
        temp_right.appendChild(this.elements.scale);
        temp_right.appendChild(this.elements.positionX);
        temp_right.appendChild(this.elements.positionY);
        temp_right.style.display = 'none';
        let temp_label = document.createElement('label');
        temp_label.innerText = 'Logo';
        temp_label.style.display = 'none';
        container.appendChild(btn);
        container.appendChild(temp_label);
        container.appendChild(temp_right);
        this.addListeners();
        this.addCustomGraphicButton.click();
        // return container;
    }
    
    addListeners(){
        this.elements.scale.onchange = this.updateScale.bind(this);
        this.elements.positionX.onchange = this.updatePosition.bind(this);
        this.elements.positionY.onchange = this.updatePosition.bind(this);
        this.elements.positionX.onkeydown = e => this.updatePositionByKey(e, {x: this.elements.positionX, y: this.elements.positionY}, this.updatePosition);
        this.elements.positionY.onkeydown = e => this.updatePositionByKey(e, {x: this.elements.positionX, y: this.elements.positionY}, this.updatePosition);
        this.elements.positionX.onblur = ()=>this.shapeObj.unfocusInputs([this.elements.positionX, this.elements.positionY]);
        this.elements.positionY.onblur = ()=>this.shapeObj.unfocusInputs([this.elements.positionX, this.elements.positionY]);
    }
    updateScale(e){
        this.scale = parseFloat(e.target.value);
        this.canvasObj.draw();
    }
    updatePosition(){
        this.position.x = this.elements.positionX.value ? this.shapeObj.toFix(this.elements.positionX.value) * this.canvasObj.scale : this.position.x;
        this.position.y = this.elements.positionY.value ? this.shapeObj.toFix(this.elements.positionY.value) * this.canvasObj.scale : this.position.y;
        this.canvasObj.draw();
    }
    updatePositionByKey(e){
        if(e.keyCode !== 37 && e.keyCode !== 38 && e.keyCode !== 39 && e.keyCode !== 40) return;
        e.preventDefault();
        let val = e.keyCode === 38 || e.keyCode === 37 ? -1.0 : 1.0;
        // console.log('updatePositionByKey: ' + e.keyCode);
        if(e.keyCode === 38 || e.keyCode === 40) {
            if(!this.elements.positionY.value) this.elements.positionY.value = this.shapeObj.toFix(this.position.y / this.canvasObj.scale);
            this.elements.positionY.value = this.shapeObj.toFix(this.elements.positionY.value) + val;
        } else if(e.keyCode === 37 || e.keyCode === 39) {
            if(!this.elements.positionX.value) this.elements.positionX.value = this.shapeObj.toFix(this.position.x / this.canvasObj.scale);
            this.elements.positionX.value = this.shapeObj.toFix(this.elements.positionX.value) + val;
        }
        this.elements.positionX.classList.add('pseudo-focused');
        this.elements.positionY.classList.add('pseudo-focused');

        this.updatePosition();
    }
    // shapeObj.unfocusInputs(){
    //     this.elements.positionX.classList.remove('pseudo-focused');
    //     this.elements.positionY.classList.remove('pseudo-focused');
    // }
    draw(){
        console.log('customGraphic draw()')
        this.context.save();
        this.context.fillStyle = this.shapeObj.textColor;
        this.context.translate(this.position.x, this.position.y);
        this.context.scale(this.scale, this.scale);
        let p = new Path2D("M116.44,216.36c-26.37,0-52.75.02-79.12,0-17.54-.02-31.76-10.65-36.05-27.1-.81-3.09-1.21-6.37-1.22-9.57C-.02,132.29,0,84.89,0,37.49,0,16.7,15.66.53,36.48.47c53.32-.16,106.63-.14,159.95,0,20.93.05,36.57,16.19,36.57,37.17,0,47.24,0,94.47,0,141.71,0,21.04-15.82,36.95-36.95,37.01-26.54.07-53.07.02-79.61.02ZM116.52,4.08c-26.7,0-53.39-.02-80.09.03-2.32,0-4.7.22-6.96.73C13.74,8.42,3.66,21.34,3.65,37.92c-.02,46.99-.01,93.98,0,140.97,0,2.1.02,4.23.39,6.29,2.96,16.53,16.27,27.6,33.09,27.6,52.91,0,105.82,0,158.73,0,18.89,0,33.42-14.04,33.48-32.9.15-47.64.15-95.28,0-142.92-.06-18.9-14.55-32.88-33.46-32.88-26.45,0-52.91,0-79.36,0ZM38.74,51.46c-2.1.06-3.64-1.15-4.29-3.27-1.36-4.44-1.36-8.91-.05-13.35.6-2.02,1.88-3.45,4.15-3.45,2.31,0,4.01,1.09,4.88,3.29.35.88.6,1.79.92,2.75,3.3-.45,6.44-.88,9.59-1.31-1.2-7.12-6.62-11.71-13.43-12.18-10.58-.73-15.85,5.28-17.14,11.53-.62,3.04-.78,6.28-.5,9.37.79,8.83,7.13,14.51,15.94,14.01,3.2-.18,6.33-1.7,9.8-2.7.92,1.38,2.29,3.23,5.09,2v-17.08h-14.98v6.69h5.23c-.92,2.93-3.02,3.63-5.22,3.69ZM147.54,113.43v23.95h8.88c0-4.97-.03-9.74.03-14.51.01-.81.21-1.99.76-2.35.85-.56,2.2-.97,3.07-.68.65.22,1.22,1.66,1.24,2.57.12,4.98.06,9.97.06,15h9.11c0-.95,0-1.74,0-2.53,0-4.04.07-8.09-.03-12.13-.05-2.06.93-3,2.82-3.14,2.15-.16,2.25,1.4,2.27,2.92.03,3.4.01,6.79.01,10.19,0,1.58,0,3.15,0,4.67h9.16c0-6.23.15-12.29-.05-18.34-.14-3.93-3.03-6.63-6.87-6.19-2.73.32-5.34,1.66-8.33,2.66-3.72-4.93-8.37-3.08-13.07.13-.14-.95-.24-1.58-.34-2.23h-8.72ZM125.36,97.59h8.7c.11-.34.2-.49.2-.64.02-4.04.03-8.08.05-12.12.01-2.62,1.3-3.77,3.97-3.37,1.41.21,2.78.67,4.45,1.08v-6.99c3.05,6.69,5.61,13.45,8.03,20.26.16.46-.63,1.77-1.15,1.87-1.74.35-3.55.35-5.36.48v6.25c6.8,1.37,11.45-.94,14.04-7.08,3.14-7.44,6.12-14.94,9.15-22.42.16-.4.19-.86.31-1.45-1.8,0-3.42.11-5.02-.03-1.6-.14-2.23.53-2.7,1.99-1.01,3.19-2.24,6.32-3.63,10.16-.97-2.78-1.73-4.87-2.44-6.97q-1.75-5.15-7.13-5.16c-4.17,0-8.58-1.4-12.22,2.54-.23-1.09-.36-1.74-.51-2.45h-8.74v24.02ZM29.84,104.69c-4.08,2.17-6.18,5.61-5.94,10.28.25,4.86,3.21,7.59,7.57,8.97,2.6.83,5.32,1.29,7.9,2.17.89.3,1.53,1.38,2.28,2.1-.84.67-1.6,1.79-2.52,1.94-3.21.55-6.28.04-8.79-2.3-.56-.52-1.12-1.06-1.68-1.6-2.19,1.71-4.15,3.24-6.28,4.9.65.83,1.14,1.56,1.74,2.18,4.93,5.08,11.18,5.39,17.55,4.39,2.35-.37,4.8-1.58,6.71-3.05,5.19-4.01,5.63-14.37-2.63-17.45-3.22-1.21-6.66-1.82-9.93-2.9-.72-.24-1.19-1.27-1.77-1.94.75-.5,1.44-1.29,2.25-1.43,3.15-.57,5.84.58,8.11,2.84,2.04-1.69,3.96-3.29,6-4.98-4.12-6.45-15.06-7.04-20.58-4.1ZM34.41,97.64h-10.24v-33.87c2.02,0,4.01-.02,6,0,4.68.07,9.41-.25,14.03.35,6.01.78,9.1,4.72,9.02,10.35-.07,5.61-3.34,9.26-9.39,10.14-3.01.44-6.07.5-9.43.76v12.26ZM34.62,71.02v6.93c1.92-.2,3.7-.07,5.2-.65,1.02-.4,2.04-1.7,2.35-2.8.46-1.61-.63-2.83-2.27-3.1-1.71-.27-3.46-.26-5.27-.37ZM129.19,127.38c-.12,2.47,1.17,3.62,2.93,4.23,2.35.82,4.72-.35,6.92-3.28.94.42,1.94.87,2.93,1.32,1.01.46,2.01.93,3.01,1.4-3.41,6.75-11.63,8.57-18.13,6.15-6.06-2.26-8.92-9.07-6.9-15.95,1.8-6.13,8.07-9.62,15.05-8.38,6.61,1.18,10.33,6.53,9.82,14.51h-15.64ZM129.37,121.83h6.05c-.22-2-.94-3.24-2.98-3.2-2.05.04-2.99,1.17-3.06,3.2ZM100.03,88.49c2.09.96,3.98,1.82,5.86,2.68-1.89,5.39-9.85,8.62-16.44,6.75-6.75-1.92-10.27-8.1-8.73-15.34,1.45-6.8,7.57-10.66,15.13-9.54,6.68.99,10.62,6.61,9.94,14.59h-15.68c.11,2.38,1.26,3.73,3.09,4.16,2.91.68,5.21-.49,6.83-3.31ZM90.32,82.04h6.25c-.41-1.91-1-3.26-3.09-3.21-1.96.04-2.85,1.13-3.15,3.21ZM124.75,55.78c0-4.12.01-8.24,0-12.36,0-1.99,1.41-2.65,2.95-2.88,1.85-.27,2,1.27,2.12,2.57.11,1.2.05,2.42.05,3.63,0,3.84,0,7.68,0,11.53h9.02c0-6.16.15-12.14-.05-18.11-.15-4.75-4.79-7.72-9.37-6.16-1.34.46-2.53,1.36-3.8,2.05-.2.11-.43.15-.76.26-.13-.73-.24-1.39-.34-2h-8.84v24.06h9.02c0-1.02,0-1.81,0-2.6ZM80.98,59.01c-7.6-.02-12.55-4.99-12.56-12.62-.01-7.7,5.13-12.74,12.99-12.74,7.59,0,12.78,5.22,12.74,12.8-.03,7.63-5.22,12.58-13.18,12.56ZM84.79,46.28c-.21-1.4-.12-2.91-.72-4.06-.5-.96-1.81-2.05-2.76-2.06-.96,0-2.65,1.16-2.76,1.98-.36,2.75-.36,5.6-.03,8.36.1.81,1.78,1.97,2.74,1.98.96,0,2.32-1.03,2.79-1.97.61-1.23.53-2.82.74-4.23ZM66.62,98.32c-7.79,0-12.76-4.93-12.76-12.66,0-7.69,5.16-12.72,13.03-12.7,7.57.01,12.76,5.26,12.71,12.84-.05,7.55-5.21,12.52-12.98,12.52ZM70.17,85.52c-.14-1.22-.18-2.45-.45-3.62-.36-1.53-1.23-2.61-3.02-2.59-1.79.01-2.82,1.09-2.95,2.64-.21,2.47-.22,4.99.01,7.45.14,1.51,1.15,2.58,2.98,2.57,1.84,0,2.64-1.1,2.99-2.61.29-1.25.3-2.56.44-3.84ZM153.74,59.01c-7.68-.01-12.56-4.88-12.57-12.55-.01-7.83,4.98-12.8,12.88-12.81,7.69-.01,12.9,5.27,12.78,12.99-.11,7.56-5.22,12.39-13.09,12.37ZM157.46,46.61c-.19-1.46-.05-2.97-.63-4.12-.52-1.03-1.82-2.29-2.8-2.31-.98-.02-2.73,1.27-2.85,2.16-.38,2.66-.34,5.44.02,8.11.11.83,1.75,2.01,2.71,2.03.95.02,2.3-1.01,2.81-1.95.61-1.13.53-2.64.74-3.92ZM94.6,121.12c1.69-1,3.41-2.02,5.58-3.31-1.37-1.3-2.36-2.63-3.67-3.4-3.36-1.96-7.11-2.12-10.8-1.34-4.57.96-7.23,4.36-7.13,8.52.1,3.9,2.72,6.36,7.64,7.32,2.23.44,4.43,1.03,6.86,1.61-2.31,2.84-5.93,2.22-10.04-1.39-1.74,1.12-3.52,2.26-5.25,3.38.18.46.22.63.31.75,3.86,5.36,15.65,6.69,20.66,2.33,4.27-3.72,3.36-10.34-1.81-12.59-1.61-.7-3.36-1.06-5.08-1.48-1.66-.41-3.35-.71-5.62-1.17,2.94-2.29,5.05-1.96,8.35.77ZM190,136.04c5.49,2.9,11.2,2.97,16.72.31,2.82-1.36,3.98-4.14,3.75-7.33-.22-3.07-1.88-5.17-4.72-6.12-2.42-.81-4.97-1.24-7.45-1.88-.84-.22-1.65-.55-2.73-.93,2.8-2.04,4.93-1.69,8.13,1.01,1.69-1,3.4-2.02,5.1-3.04-1.23-2.59-2.95-4.21-5.59-4.7-2.2-.41-4.47-.61-6.71-.56-4.66.09-8.46,3.58-8.74,7.76-.31,4.59,2.18,7.3,7.52,8.33,2.28.44,4.52,1.07,7.14,1.7-2.84,2.62-5.58,2.11-10.36-1.41-1.69,1.09-3.42,2.2-6.07,3.91,1.57,1.16,2.69,2.24,4.01,2.94ZM54.02,116.55c2.24,5.97,4.51,11.92,6.72,17.9.88,2.37.47,3.14-1.99,3.45-1.38.18-2.81-.09-4.24-.16v6.46c6.67,1.46,11.49-.89,14.06-6.97,3.14-7.43,6.12-14.93,9.15-22.4.17-.43.25-.89.43-1.54-1.78,0-3.4.14-4.98-.04-1.73-.19-2.38.58-2.86,2.11-1.01,3.17-2.21,6.28-3.58,10.1-1.56-4.51-2.87-8.29-4.19-12.09h-9.64c.43,1.24.76,2.23,1.12,3.2ZM119.52,89.96c-.1-3.29-.03-6.58-.03-9.97,1.41-.13,2.56-.23,3.69-.33v-6.08c-1.28-.09-2.38-.17-3.78-.27v-7.94h-7.95c-.22,2.71-.43,5.33-.65,7.98-1.36.09-2.47.16-3.71.24v6.09c1.08.09,2.02.18,3.15.28.04.96.11,1.82.12,2.68.03,3.15-.1,6.3.07,9.44.28,5.22,3.19,6.83,10.82,6.16,2.57-.22,2.76-.76,2.24-6.33,0-.07-.06-.14-.16-.35-2.86.41-3.77.08-3.82-1.6ZM114.72,105.15h-7.96c-.25,2.7-.48,5.32-.73,7.99-1.27.09-2.38.17-3.6.26v6.08c1.08.1,2.02.19,3.26.3,0,.94,0,1.8,0,2.67.01,3.32-.05,6.63.06,9.95.1,3,1.66,4.98,4.55,5.41,2.29.34,4.67.22,7,.1.55-.03,1.46-.85,1.52-1.39.2-1.7.07-3.44.07-5.17l-.69.6c-1.13-.56-3.19-1.03-3.25-1.69-.33-3.48-.15-7-.15-10.51,1.47-.11,2.56-.19,3.57-.26v-6.12c-1.26-.07-2.3-.13-3.67-.2v-8ZM113.48,33.15c-2.89,1.03-5.45,1.95-8.02,2.86-.09-.46-.22-1.12-.32-1.68h-8.83v23.98h9.02c0-4.32,0-8.5,0-12.67,0-2.77,1.31-3.92,4.06-3.47,1.33.22,2.63.66,4.1,1.04v-10.06ZM66.3,34.33h-8.82v24.06h8.82v-24.06ZM66.29,31.84v-7.22h-8.89v7.22h8.89Z");
        this.context.fill(p);
        this.context.restore();
    }
}
let s = resources_data['static-1']['canvas']['shapes'][0];
let cgs = new customGraphicStatic(s);
s.customGraphic.push(cgs);
resources_data['static-1']['canvas'].draw();
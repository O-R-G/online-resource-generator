import * as THREE from "three";
// import fontLoader from './FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Shape } from "./Shape.js";
import {Text} from 'troika-three-text';

export class ShapeAnimated extends Shape {
	constructor(prefix = '', canvasObj, options = {}, format, animated_fonts = {}, shape_index=0){
		super(prefix, canvasObj, options, format, shape_index);
		
		this.geometry_front = null;
		this.geometry_front_uvs = null;
		this.geometry_back = null;
		this.geometry_back_uvs = null;
		this.fonts = {};

		this.mesh_front = null;
		this.mesh_frontText = null;
		this.mesh_front = null;
		this.mesh_backText = null;
		this.isForward = true;
		this.animationSpeed = this.getDefaultOption(this.options.animationSpeedOptions);
		let speed_value = this.animationSpeed.value;
		this.recordingBreakPoint = speed_value * Math.PI * 2;     // aka, spins
		this.flipAngleInterval_base = 0.01;     // aka, speed
        this.spinAngleInterval_base = 0.01;
		this.rotateAngleInterval_base = 0.01;
		this.flipAngleInterval = this.flipAngleInterval_base * speed_value;     // aka, speed
        this.spinAngleInterval = this.spinAngleInterval_base * speed_value;
		this.rotateAngleInterval = this.rotateAngleInterval_base * speed_value;
		this.watermarkAngleInterval = 0.005;
		this.easeAngleInitial = 0.3;
		this.easeAngleRate = 0.98;
		this.easeAngleInterval = this.easeAngleInitial;
		
		
		let defaultFrontColor = Object.values(this.options.colorOptions)[0].color;
		if(defaultFrontColor['type'] == 'solid' || defaultFrontColor['type'] == 'transparent')
		{
			let params = this.processStaticColorData(defaultFrontColor);
			this.frontMaterial = new THREE.MeshBasicMaterial( params );
		}
		else if(defaultFrontColor['type'] == 'gradient')
		{
			this.frontMaterial = this.generateGradient(this.geometry_front, defaultFrontColor['code'], defaultFrontColor['angle']);
		}

		let defaultBackColor = Object.values(this.options.colorOptions)[1].color;
		if(defaultBackColor['type'] == 'solid' || defaultBackColor['type'] == 'transparent')
		{
			let params = this.processStaticColorData(defaultBackColor);
			this.backMaterial = new THREE.MeshBasicMaterial( params );
		}
		else if(defaultBackColor['type'] == 'gradient')
		{
			this.backMaterial = this.generateGradient(this.geometry_back, defaultBackColor['code'], defaultBackColor['angle']);
		}
		this.frontTextMaterial = this.processColor(Object.values(this.options.textColorOptions)[0].color);
		this.backTextMaterial = this.processColor(Object.values(this.options.textColorOptions)[0].color);
		
		this.frontTypography = this.getDefaultOption(this.options.typographyOptions);
		this.backTypography = this.getDefaultOption(this.options.typographyOptions);
		this.timer = null;
		this.watermarkTimer = null;
		this.animationName = this.options.animationOptions[Object.keys(this.options.animationOptions)[0]].name;
		
		this.devicePixelRatio = window.devicePixelRatio;
		this.frontTextPosition = this.getDefaultOption(this.options.typographyOptions).value;
		this.backTextPosition = this.getDefaultOption(this.options.typographyOptions).value;
		
		this.frontTextShiftX = 0;
		this.frontTextShiftY = 0;
		this.backTextShiftX = 0;
		this.backTextShiftY = 0;
		this.text = {
			front: {
				str: false,
				size: this.options.typographyOptions[Object.keys(this.options.typographyOptions)[0]].name,
				position: Object.values(this.options.textPositionOptions)[0].value,
				material: this.processColor(Object.values(this.options.textColorOptions)[0].color),
				shift: {
					x: 0,
					y: 0
				},
				rotate: 0,
				isBack: false
			},
		}

		
		this.frontIsGridColor = false;
		this.backIsGridColor = false;
		this.path = new THREE.Curve();
		this.frontWatermarkGroup = new THREE.Group();
		this.backWatermarkGroup = new THREE.Group();
		this.initRecording = false;
	}
	init(canvasObj){
		super.init(canvasObj);
		this.canvas = canvasObj.canvas;
		this.context = this.canvas.getContext("2d");
		this.updateCanvasSize();		
		this.control.classList.add('animated-shape-control');
		this.renderer = this.canvasObj.renderer;
		this.scene = this.canvasObj.scene;
		this.camera = this.canvasObj.camera;	
		// let scale = 540 / 960;
		// this.scale = Object.keys(this.canvasObj.shapes).length === 1 ? new THREE.Vector3(1, this.canvas.width / this.canvas.height, 1) : new THREE.Vector3(1, scale, 1);
		this.scale = new THREE.Vector3(1, this.canvas.width / this.canvas.height, 1)
		this.frontWatermarkGroup.scale.copy(this.scale);
		this.backWatermarkGroup.scale.copy(this.scale);

		this.group = new THREE.Group();
		this.updateGroupTranslateY();
		
		this.drawShape();
		this.renderControl();
	    this.addListeners();
		this.updateShape(this.shape, true);
	}
	updateCanvasSize(){
		this.canvasW = this.canvas.width;
		this.canvasH = this.canvas.height;
	}
	addCounterpart(obj)
	{
		super.addCounterpart(obj);
		this.setFieldCounterparts();
	}
	setFieldCounterparts(){
		this.fieldCounterparts['shape'] = 'shape';
		this.fieldCounterparts['animation'] = 'animation';
		this.fieldCounterparts['text-front'] = 'text';
		this.fieldCounterparts['text-front-position'] = 'text-position';
		this.fieldCounterparts['text-front-color'] = 'text-color';
		this.fieldCounterparts['text-front-typography'] = 'text-typography';
		this.fieldCounterparts['text-front-shift-x'] = 'text-shift-x';
		this.fieldCounterparts['text-front-shift-y'] = 'text-shift-y';
		this.fieldCounterparts['shape-front-color'] = 'shape-color';
		this.fieldCounterparts['front-background-image'] = 'background-image';
		this.fieldCounterparts['front-background-image-shift-x'] = 'background-image-shift-x';
		this.fieldCounterparts['front-background-image-shift-y'] = 'background-image-shift-y';
		this.fieldCounterparts['front-background-image-scale'] = 'background-image-scale';
	}
	updateShape(shape, silent = false){
		super.updateShape(shape);
		this.padding = this.getValueByPixelRatio(this.padding);
		for(const prop in this.innerPadding)
			this.innerPadding[prop] = this.getValueByPixelRatio(this.innerPadding[prop]);
		this.cornerRadius = this.getValueByPixelRatio(this.cornerRadius);
		this.drawShape();
		this.updateTextMeshByShape(shape);
		let sWatermark_panels = this.control.querySelectorAll('.watermarks-container .panel-section');
		[].forEach.call(sWatermark_panels, function(el, i){
			// let availables = this.options.shapeOptions[shape_name]['shape'].watermarkPositions;
			let position = el.querySelector('.watermark-position').value;
			let label = el.querySelector('label[for^="watermark"]');
			this.checkWatermarkPosition(position, label);
		}.bind(this));
		if(!silent) this.canvasObj.draw();
	}
	updateTextMeshByShape(shape){
		if(this.mesh_frontText) {
			this.mesh_frontText.maxWidth = this.maxWidth;
			if(shape.base === 'triangle') 
				this.mesh_frontText.y += this.getValueByPixelRatio( -110 );
			this.mesh_frontText.needsUpdate = true;
		}
		if(this.mesh_backText) {
			this.mesh_backText.maxWidth = this.maxWidth;
			if(shape.base === 'triangle') 
				this.mesh_backText.y += this.getValueByPixelRatio( -110 );
			this.mesh_backText.needsUpdate = true;
		}
	}
	drawHeart() {
		var path_front = new THREE.Shape();
		var path_back = new THREE.Shape();
		let arcs = [
			{
				x: -96,
				y: 71.78,
				r: 140,
				from: 5 * Math.PI / 4,
				to: Math.PI / 4
			},
			{
				x: 96,
				y: 71.78,
				r: 140,
				from: 3 * Math.PI / 4,
				to: 7 * Math.PI / 4
			}
		];
	
		path_front.arc(this.shapeCenter.x + arcs[0].x * this.canvasObj.scale, this.shapeCenter.y + arcs[0].y * this.canvasObj.scale, arcs[0].r * this.canvasObj.scale, arcs[0].from,arcs[0].to, true);
		path_front.moveTo(this.shapeCenter.x, this.shapeCenter.y);
		path_front.arc(this.shapeCenter.x + arcs[1].x * this.canvasObj.scale, this.shapeCenter.y + arcs[1].y * this.canvasObj.scale, arcs[1].r * this.canvasObj.scale, arcs[1].from,arcs[1].to, true);
		path_front.lineTo(this.shapeCenter.x, this.shapeCenter.y - 206 * this.canvasObj.scale);
		path_front.closePath();

		path_back.arc(this.shapeCenter.x + arcs[0].x * this.canvasObj.scale, this.shapeCenter.y + arcs[0].y * this.canvasObj.scale, arcs[0].r * this.canvasObj.scale, arcs[0].from,arcs[0].to, true);
		path_back.moveTo(this.shapeCenter.x, this.shapeCenter.y);
		path_back.arc(this.shapeCenter.x + arcs[1].x * this.canvasObj.scale, this.shapeCenter.y + arcs[1].y * this.canvasObj.scale, arcs[1].r * this.canvasObj.scale, arcs[1].from,arcs[1].to, true);
		path_back.lineTo(this.shapeCenter.x, this.shapeCenter.y - 206 * this.canvasObj.scale);
		path_back.closePath();

		this.geometry_front = new THREE.ShapeGeometry(path_front);
		this.geometry_back = new THREE.ShapeGeometry(path_back);
	}
	drawHexagon(){
		let this_r = this.cornerRadius;
		let this_p = this.padding;
		let this_a = (this.frame.w - this_p * 2) / 2;
		this.textBoxWidth =  (this.frame.w - this.padding * 2 - this.innerPadding.x * 2) * 0.8;

		var path_front = new THREE.Shape();
		path_front.lineTo(-this_a / 2 - 1 / (2*1.732) * this_r, 1.732 / 2 * this_a - this_r / 2);
		path_front.lineTo(-this_a / 2 + 1/1.732 * this_r, 1.732 / 2 * this_a );
		path_front.lineTo( this_a / 2 - 1/1.732 * this_r, 1.732 / 2 * this_a );
		path_front.arc( 0, -this_r, this_r, Math.PI / 2, Math.PI / 6, true);
		path_front.lineTo( this_a / 2 + 1/(2*1.732) * this_r, 1.732/2 *this_a - this_r / 2);
		path_front.lineTo( this_a - 1 / (2*1.732) * this_r,  1/2 * this_r);
		path_front.arc( -1.732/2 * this_r, -1/2*this_r, this_r, Math.PI / 6, -Math.PI / 6, true);
		path_front.lineTo( this_a - 1 / (2*1.732) * this_r, -1/2 * this_r);
		path_front.lineTo( this_a / 2 + 1 / (2*1.732) * this_r, - 1.732 / 2 * this_a + this_r / 2);
		path_front.arc( -1.732/2 * this_r, 1/2*this_r, this_r, 11*Math.PI / 6, 9*Math.PI / 6, true);
		path_front.lineTo( this_a / 2 - 1/1.732 * this_r, -1.732 / 2 * this_a );
		path_front.lineTo(-this_a / 2 + 1/1.732 * this_r, -1.732 / 2 * this_a );
		path_front.arc( 0, this_r, this_r, 9*Math.PI / 6, 7*Math.PI / 6, true);
		path_front.lineTo(-this_a / 2 - 1 / (2*1.732) * this_r, - 1.732 / 2 * this_a + this_r / 2);
		path_front.lineTo(-this_a + 1 / (2*1.732) * this_r, -1/2 * this_r);
		path_front.arc( 1.732/2 * this_r, 1/2*this_r, this_r, 7*Math.PI / 6, 5*Math.PI / 6, true);
		path_front.lineTo(-this_a + 1 / (2*1.732) * this_r, 1/2 * this_r);
		path_front.lineTo(-this_a / 2 - 1 / (2*1.732) * this_r, 1.732 / 2 * this_a - this_r / 2);
		path_front.arc( 1.732/2 * this_r, -1/2*this_r, this_r, 5*Math.PI / 6, 3*Math.PI / 6, true);
		path_front.closePath();

		var path_back = new THREE.Shape();
		path_back.lineTo(-this_a / 2 - 1 / (2*1.732) * this_r, 1.732 / 2 * this_a - this_r / 2);
		path_back.lineTo(-this_a / 2 + 1/1.732 * this_r, 1.732 / 2 * this_a );
		path_back.lineTo( this_a / 2 - 1/1.732 * this_r, 1.732 / 2 * this_a );
		path_back.arc( 0, -this_r, this_r, Math.PI / 2, Math.PI / 6, true);
		path_back.lineTo( this_a / 2 + 1/(2*1.732) * this_r, 1.732/2 *this_a - this_r / 2);
		path_back.lineTo( this_a - 1 / (2*1.732) * this_r,  1/2 * this_r);
		path_back.arc( -1.732/2 * this_r, -1/2*this_r, this_r, Math.PI / 6, -Math.PI / 6, true);
		path_back.lineTo( this_a - 1 / (2*1.732) * this_r, -1/2 * this_r);
		path_back.lineTo( this_a / 2 + 1 / (2*1.732) * this_r, - 1.732 / 2 * this_a + this_r / 2);
		path_back.arc( -1.732/2 * this_r, 1/2*this_r, this_r, 11*Math.PI / 6, 9*Math.PI / 6, true);
		path_back.lineTo( this_a / 2 - 1/1.732 * this_r, -1.732 / 2 * this_a );
		path_back.lineTo(-this_a / 2 + 1/1.732 * this_r, -1.732 / 2 * this_a );
		path_back.arc( 0, this_r, this_r, 9*Math.PI / 6, 7*Math.PI / 6, true);
		path_back.lineTo(-this_a / 2 - 1 / (2*1.732) * this_r, - 1.732 / 2 * this_a + this_r / 2);
		path_back.lineTo(-this_a + 1 / (2*1.732) * this_r, -1/2 * this_r);
		path_back.arc( 1.732/2 * this_r, 1/2*this_r, this_r, 7*Math.PI / 6, 5*Math.PI / 6, true);
		path_back.lineTo(-this_a + 1 / (2*1.732) * this_r, 1/2 * this_r);
		path_back.lineTo(-this_a / 2 - 1 / (2*1.732) * this_r, 1.732 / 2 * this_a - this_r / 2);
		path_back.arc( 1.732/2 * this_r, -1/2*this_r, this_r, 5*Math.PI / 6, 3*Math.PI / 6, true);
		path_back.closePath();

		this.geometry_front = new THREE.ShapeGeometry(path_front);
		this.geometry_back = new THREE.ShapeGeometry(path_back);
	}
	drawCircle(){
		let this_p = this.padding;
		let this_r = (this.frame.w - this_p * 2) / 2;
		this.textBoxWidth = (this.frame.w - this.padding * 2 - this.innerPadding.x * 2) * 0.8;

		this.geometry_front = new THREE.CircleGeometry( this_r, 64);
		this.geometry_back = new THREE.CircleGeometry( this_r, 64);
		this.geometry_front_uvs = this.geometry_front.attributes.uv.array;
		this.geometry_back_uvs = this.geometry_back.attributes.uv.array;
	}
	drawRectangle(){
		var path_front = new THREE.Shape();
		let this_r = this.cornerRadius;
		let this_p = this.padding;
		this.textBoxWidth = (this.frame.w - this_p * 2 - this.innerPadding.x * 2) * 0.9;
		var a = this.frame.w / 2 - this_r - this_p;
		path_front.moveTo(this.shapeCenter.x - a, 0 + a + this_r);
		path_front.lineTo(this.shapeCenter.x + a, 0 + a + this_r);
		path_front.arc( 0, -this_r, this_r, Math.PI / 2, 0, true);
		path_front.lineTo( this.shapeCenter.x + a + this_r, 0 + a);
		path_front.lineTo( this.shapeCenter.x + a + this_r, 0 - a);
		path_front.arc( -this_r, 0, this_r, 0, 3 * Math.PI / 2, true);
		path_front.lineTo(this.shapeCenter.x + a, 0 - (a + this_r));
		path_front.lineTo(this.shapeCenter.x - a, 0 - (a + this_r));
		path_front.arc( 0, this_r, this_r, 3 * Math.PI / 2, Math.PI, true);
		path_front.lineTo(this.shapeCenter.x -(a + this_r), 0 - a);
		path_front.lineTo(this.shapeCenter.x -(a + this_r), 0 + a);
		path_front.arc( this_r, 0, this_r, Math.PI, Math.PI / 2, true);
		path_front.closePath();

		var path_back = new THREE.Shape();
		path_back.moveTo(this.shapeCenter.x - a, 0 + a + this_r);
		path_back.lineTo(this.shapeCenter.x + a, 0 + a + this_r);
		path_back.arc( 0, -this_r, this_r, Math.PI / 2, 0, true);
		path_back.lineTo(this.shapeCenter.x + a + this_r, 0 + a);
		path_back.lineTo(this.shapeCenter.x + a + this_r, 0 - a);
		path_back.arc( -this_r, 0, this_r, 0, 3 * Math.PI / 2, true);
		path_back.lineTo(this.shapeCenter.x + a, 0 - (a + this_r));
		path_back.lineTo(this.shapeCenter.x - a, 0 - (a + this_r));
		path_back.arc( 0, this_r, this_r, 3 * Math.PI / 2, Math.PI, true);
		path_back.lineTo(this.shapeCenter.x - (a + this_r), 0 - a);
		path_back.lineTo(this.shapeCenter.x - (a + this_r), 0 + a);
		path_back.arc( this_r, 0, this_r, Math.PI, Math.PI / 2, true);
		path_back.closePath();

		this.geometry_front = new THREE.ShapeGeometry(path_front);
		this.geometry_back = new THREE.ShapeGeometry(path_back);
	}
	clipRectangle(ctx = null){
		ctx = ctx ? ctx : this.context;
		if(this.cornerRadius * 2 > this.frame.w - (this.padding * 2) )
            this.cornerRadius = (this.frame.w - (this.padding * 2)) / 2;
        let paddingX = this.padding;
        let paddingY = this.padding;
        let side = this.frame.w - this.padding * 2;
        this.textBoxWidth = (this.frame.w - this.padding * 2 - this.innerPadding.x * 2) * 0.9;
		// this.context.save();
        ctx.beginPath();
        ctx.arc(this.frame.x + paddingX + this.cornerRadius, this.frame.y + paddingY + this.cornerRadius, this.cornerRadius, Math.PI, 3 * Math.PI / 2);
        ctx.arc(this.frame.x + side + paddingX - this.cornerRadius, this.frame.y + paddingY + this.cornerRadius, this.cornerRadius, 3 * Math.PI / 2, 0);
        ctx.arc(this.frame.x + side + paddingX - this.cornerRadius, this.frame.y + side + paddingY - this.cornerRadius, this.cornerRadius, 0, Math.PI / 2);
        ctx.arc(this.frame.x + paddingX + this.cornerRadius, this.frame.y + side + paddingY - this.cornerRadius, this.cornerRadius, Math.PI / 2, Math.PI);
        ctx.closePath();
        ctx.clip();
		// this.context.restore();
	}
	drawTriangle(){
		var path_front = new THREE.Shape();
		let this_r = this.cornerRadius / 2;
		let this_p = this.padding;
		var dev =  this.getValueByPixelRatio( -120 );
		this.textBoxWidth = (this.frame.w - this.padding * 2 - this.innerPadding.x * 2) * 0.6;
		
		path_front.lineTo(- (this.frame.w / 2 - ( this_p + 1.732 * this_r )), - (1.732 * (this.frame.w / 2 - this_p)) / 3 + dev );
		path_front.arc( 0, this_r, this_r, 3 * Math.PI / 2, 5 / 6 * Math.PI, true);
		path_front.lineTo( - 1.732 / 2 * this_r, 2 * (1.732 * (this.frame.w / 2 - this_p)) / 3 - 3 / 2 * this_r  + dev);
		path_front.arc( 1.732 / 2 * this_r, - this_r / 2 , this_r, 5 / 6 * Math.PI, Math.PI / 6, true);
		path_front.lineTo((this.frame.w / 2 - ( this_p + 1.732 * this_r )) + 1.732 / 2 * this_r, - (1.732 * (this.frame.w / 2 - this_p)) / 3 + 3 / 2 * this_r + dev );
		path_front.arc(  - 1.732 / 2 * this_r, - this_r / 2 , this_r, Math.PI / 6, 3 / 2 * Math.PI , true);
		path_front.lineTo(- (this.frame.w / 2 - ( this_p + 1.732 * this_r )), - (1.732 * (this.frame.w / 2 - this_p)) / 3 + dev );
		path_front.closePath();

		var path_back = new THREE.Shape();
		path_back.lineTo(- (this.frame.w / 2 - ( this_p + 1.732 * this_r )), - (1.732 * (this.frame.w / 2 - this_p)) / 3 + dev );
		path_back.arc( 0, this_r, this_r, 3 * Math.PI / 2, 5 / 6 * Math.PI, true);
		path_back.lineTo( - 1.732 / 2 * this_r, 2 * (1.732 * (this.frame.w / 2 - this_p)) / 3 - 3 / 2 * this_r  + dev);
		path_back.arc( 1.732 / 2 * this_r, - this_r / 2 , this_r, 5 / 6 * Math.PI, Math.PI / 6, true);
		path_back.lineTo((this.frame.w / 2 - ( this_p + 1.732 * this_r )) + 1.732 / 2 * this_r, - (1.732 * (this.frame.w / 2 - this_p)) / 3 + 3 / 2 * this_r + dev );
		path_back.arc(  - 1.732 / 2 * this_r, - this_r / 2 , this_r, Math.PI / 6, 3 / 2 * Math.PI , true);
		path_back.lineTo(- (this.frame.w / 2 - ( this_p + 1.732 * this_r )), - (1.732 * (this.frame.w / 2 - this_p)) / 3 + dev );
		path_back.closePath();

		this.geometry_front = new THREE.ShapeGeometry(path_front);
		this.geometry_back = new THREE.ShapeGeometry(path_back);
	}
	getValueByPixelRatio(input){
		return input * (this.devicePixelRatio / 2);
	}
	write(str = '', typography=false, material, align = 'center', animationName = false, isBack = false, shift=null, rad=0, sync = false){
		if(str == '') return false;
		if(typography === false)
			typography = this.frontTypography;
		
		let fontData = this.processFontData(typography, isBack);
		shift = shift ? shift : {x: isBack ? this.backTextShiftX : this.frontTextShiftX, y: isBack ? this.backTextShiftY : this.frontTextShiftY};
		shift.x = shift.x ? shift.x : 0;
		shift.y = shift.y ? -shift.y : 0;
		rad = rad ? -rad : 0;
		let output = new Text();
		if(sync)
		{
			output.sync(function(){
				this.canvasObj.updateReadyState();
			}.bind(this));
		}
		this.applyTypographyToTextMesh(output, typography, isBack);
		output.text = str;
		output.material = material;
		output.position.z = 0.5;
		output.textAlign = align == 'align-left' ? 'left' : 'center';
		output.anchorX = 'center';
		output.anchorY = '50%';
		// console.log(output);
		output.maxWidth = this.textBoxWidth;
		let text_dev_y = this.shape.base == 'triangle' ? this.getValueByPixelRatio( -110 ) : 0;
		output.position.y += text_dev_y;
		if(animationName && animationName.indexOf('spin') !== -1) output.position.x = - output.position.x;
		if(align == 'align-left' || align == 'center') {
			output.position.x += shift.x;
			output.position.y += shift.y;
			output.sync();
			return output;
		}
		output.lineHeight = 1;
		if(this.shape.base == 'rectangle' || this.shape.base == 'fill'){
			let inner_p_x = this.innerPadding.x;
			let inner_p_y = this.innerPadding.y;
			
			let this_p = this.padding;
			let side = this.frame.w - this_p * 2;
			let x = 0;
			let y = 0;
			if(align.indexOf('left') !== -1){
				output.textAlign = align.indexOf('middle') !== -1 ? 'center' : 'left';
				output.anchorX = align.indexOf('middle') !== -1 ? 'center' : 'left';
				x = align.indexOf('middle') !== -1 ? - side / 2 + inner_p_y : - side / 2 + inner_p_x;
			}
			else if(align.indexOf('right') !== -1){
				output.textAlign = align.indexOf('middle') !== -1 ? 'center' : 'right';
				output.anchorX = align.indexOf('middle') !== -1 ? 'center' : 'right';
				x = align.indexOf('middle') !== -1 ? side / 2 - inner_p_y : side / 2 - inner_p_x;
			}
			else if(align.indexOf('center') !== -1){
				output.textAlign = 'center';
				output.anchorX = 'center';
				x = 0;
			}

			if(align.indexOf('top') !== -1){
				output.anchorY = 'top';
				y = side / 2 - inner_p_y;
			}
			else if(align.indexOf('middle') !== -1){
				output.anchorY = 'middle';
				y = 0;
				output.rotation.z = align.indexOf('left') !== -1 ? Math.PI / 2 : -Math.PI / 2;
			}
			else if(align.indexOf('bottom') !== -1){
				output.anchorY = 'bottom-baseline';
				y = - side / 2 + inner_p_y;
			}
			output.rotation.z += rad;
			output.position.x = x + shift.x;
			output.position.y = y + shift.y;
		}
		else if(this.shape.base == 'hexagon')
		{
			let inner_p_x = this.innerPadding.x;
			let inner_p_y = this.innerPadding.y;
			let this_p = this.padding;
			let a = this.frame.w / 2 - this_p;
			let x = 0;
			let y = 0;

			if(align.indexOf('left') !== -1){
				output.textAlign = 'left';
				output.anchorX = 'left';
				x = align.indexOf('middle') !== -1 ? - a + inner_p_x * 2 / 1.732 : - a / 2 + inner_p_x / 2;			
			}
			else if(align.indexOf('right') !== -1){
				output.textAlign = 'right';
				output.anchorX = 'right';
				x = align.indexOf('middle') !== -1 ? a - inner_p_x * 2 / 1.732 : a / 2 - inner_p_x / 2;
			}						
			else if(align.indexOf('center') !== -1){
				output.textAlign = 'center';
				output.anchorX = 'center';
			}

			if(align.indexOf('top') !== -1){
				output.anchorY = 'top';
				y = 1.732 * a / 2 - inner_p_y;
			}
			else if(align.indexOf('middle') !== -1){
				output.anchorY = 'middle';
				y = 0;
			}
			else if(align.indexOf('bottom') !== -1){
				output.anchorY = 'bottom-baseline';
				y = -1.732 * a / 2 + inner_p_y;
			}
			output.rotation.z += rad;
			output.position.x = x + shift.x;
			output.position.y = y + shift.y;
		}
		else if(this.shape.base == 'triangle')
		{
			if(align.indexOf('top') !== -1 || align.indexOf('middle') !== -1) return;

			let x = 0;
			let y = 0;
			let y_dev = this.getValueByPixelRatio(-120);
			let this_padding = this.padding;
			let inner_p_x = this.innerPadding.x;
			let inner_p_y = this.innerPadding.y;
	        let side = this.frame.w - this_padding * 2;
    		if(align.indexOf('left') !== -1){
    			output.textAlign = 'left';
				output.anchorX = 'left';
    			x = - side / 2 + inner_p_x;
    		}
    		else if(align.indexOf('right') !== -1){
    			output.textAlign = 'right';
				output.anchorX = 'right';
    			// mesh.position.x = innerWidth / 2 - text_width;
    			x = side / 2 - inner_p_x;
    		}
    		else if(align.indexOf('center') !== -1){
    			output.textAlign = 'center';
				output.anchorX = 'center';
    			x = 0;
    		}
    		if(align.indexOf('bottom') !== -1){
    			output.anchorY = 'bottom-baseline';
    			y = y_dev - side * 1.732 / 2 / 3 + inner_p_y;
    		}
			output.rotation.z += rad;
    		output.position.x = x + shift.x;
    		output.position.y = y + shift.y;
		}
		else if(this.shape.base == 'circle')
		{
			
			let x = 0;
			let y = 0;
			let inner_p_x = this.innerPadding.x;
			let length = this.frame.w - this.padding * 2;
    		if(align === 'surrounding') {
				let textObjs = [];
				let output = new THREE.Group();
				const radius = (this.frame.w - this.padding * 2 - this.innerPadding.x * 2) / 2;
				const spaceWidth = fontData.size * 0.35 ; // Define a fixed width for spaces
				const charWidths = [];
				let currentAngle = Math.PI / 2;
				let synced = 0;
				for (let i = 0; i < str.length; i++) {
					
					const char = str[i];
					let text = new Text();
					text.text = char;
					text.fontSize = fontData.size;
					text.material = material;
					text.position.z = 0.5;
					text.textAlign = align == 'align-left' ? 'left' : 'center';
					text.anchorX = 'center';
					text.anchorY = 'middle';
					text.font = fontData.path;
					text.lineHeight = fontData.lineHeight;
					text.letterSpacing = fontData.letterSpacing;
					textObjs[i] = text;
					text.sync(()=>{
						const charWidth = text.textRenderInfo.blockBounds[2] - text.textRenderInfo.blockBounds[0];
						charWidths[i] = charWidth;
						synced++;
						if(synced == str.length) {
							for (let j = 0; j < str.length; j++) {
								const char = str[j];
								if (char === ' ') {
									currentAngle -= spaceWidth / (2 * radius);
									currentAngle -= spaceWidth / (2 * radius);
									continue;
								}
								let txt = textObjs[j];
								const charWidth = charWidths[j];
								const angleOffset = charWidth / (2 * radius);
								currentAngle -= angleOffset;
								const x = radius * Math.cos(currentAngle);
								const y = radius * Math.sin(currentAngle);
								txt.position.x = x;
								txt.position.y = y;
								txt.rotation.z = currentAngle - Math.PI / 2;
								currentAngle -= angleOffset;
								txt.needsUpdate = true;
								txt.sync();
							}
							this.renderer.render(this.scene, this.camera);
							synced = 0;
						}
					});
					output.add(text);
				}
				return output;
			}
    		else if(align.indexOf('left') !== -1){
    			output.textAlign = 'left';
				output.anchorX = 'left';
    			x = - length / 2 + inner_p_x;
    		}
    		else if(align.indexOf('right') !== -1){
    			output.textAlign = 'right';
				output.anchorX = 'right';
    			x = length / 2 - inner_p_x;
    		}
    		output.anchorY = 'middle';
			if(align.indexOf('middle') !== -1)
				y = 0;
			output.rotation.z += rad;
			output.position.x = x + shift.x;
			output.position.y = y + shift.y;
		}
		if(animationName)
			output.position.z = 0.1;

		output.sync();
		return output;
	}
	applyTypographyToTextMesh(text_mesh, typography, isBack=false){
		if(!text_mesh) return;
		let fontData = this.processFontData(typography, isBack);
		text_mesh.fontSize = fontData.size;
		text_mesh.font = fontData.path;
		text_mesh.lineHeight = fontData.lineHeight;
		text_mesh.letterSpacing = fontData.letterSpacing;
		text_mesh.needsUpdate = true;
	}
	processFontData(typography, isBack){
		let output = {};
		let size = typography['size'];
		let fontData = this.fonts[typography['font']['animated']['name']] ? this.fonts[typography['font']['animated']['name']] : '';
		output.font = fontData['font'];
		output.path = typography['font']['animated']['path'];
		output.size = this.getValueByPixelRatio(size);
		output.lineHeight = typography['lineHeight'] / size;
		output.letterSpacing = typography['letterSpacing'] / size;
		return output;
	}
	updateFrontTypography(key, silent = false){
		this.frontTypography = this.options.typographyOptions[key];
		this.applyTypographyToTextMesh(this.mesh_frontText, this.frontTypography);
		
		if(!silent) this.canvasObj.draw();
	}
	updateBackTypography(key, silent = false){
		this.backTypography = this.options.typographyOptions[key];
		this.applyTypographyToTextMesh(this.mesh_backText, this.backTypography, true);
		if(!silent) this.canvasObj.draw();
	}
	
	updateFrontText(str, silent = false){
		this.frontText = str;
		this.fields['text-front'].value = this.frontText;
		if(this.mesh_frontText) {
			this.mesh_frontText.text = this.frontText;
			this.mesh_frontText.needsUpdate = true;
		}
		this.renderer.renderLists.dispose();
		if(!silent) this.canvasObj.draw();
	}
	updateBackText(str, silent = false){
		this.backText = str;
		this.fields['text-back'].value = this.backText;
		if(this.mesh_backText) {
			this.mesh_backText.text = this.backText;
			this.mesh_backText.needsUpdate = true;
		}
		if(!silent) this.canvasObj.draw();
	}
	updateFrontTextPosition(position, silent = false){
        this.frontTextPosition = position;
		if(this.mesh_frontText) {
			this.mesh_frontText.textAlign = position == 'align-left' ? 'left' : 'center';
			this.mesh_frontText.needsUpdate = true;
		}
        if(!silent) this.canvasObj.draw();
    }
    updateBackTextPosition(position, silent = false){
        this.backTextPosition = position;
		if(this.mesh_backText) {
			this.mesh_backText.textAlign = position == 'align-left' ? 'left' : 'center';
			this.mesh_backText.needsUpdate = true;
		}
        if(!silent) this.canvasObj.draw();
    }
	updateFrontTextShiftX(x, silent = false){
        this.frontTextShiftX = x * this.canvasObj.scale;
		this.mesh_frontText.position.x = x;
		this.mesh_frontText.needsUpdate = true;
        if(!silent) this.canvasObj.draw();
    }
	updateFrontTextShiftY(y, silent = false){
        this.frontTextShiftY = y * this.canvasObj.scale;
		this.mesh_frontText.position.y = -y;
		this.mesh_frontText.needsUpdate = true;
        if(!silent) this.canvasObj.draw();
    }
	updateBackTextShiftX(x, silent = false){
        this.backTextShiftX = x * this.canvasObj.scale;
		this.mesh_backText.position.x = x;
		this.mesh_backText.needsUpdate = true;
        if(!silent) this.canvasObj.draw();
    }
	updateBackTextShiftY(y, silent = false){
        this.backTextShiftY = y * this.canvasObj.scale;
		this.mesh_backText.position.y = y;
		this.mesh_backText.needsUpdate = true;
        if(!silent) this.canvasObj.draw();
    }
	processColor(color)
	{
		let output;
		if(color['type'] == 'solid' || color['type'] == 'transparent')
		{
			let params = this.processStaticColorData(color);
			output = new THREE.MeshBasicMaterial( params );
		}
		else if(color['type'] == 'gradient')
		{
			output = this.generateGradient(this.geometry_front, color['code'], color['angle']);
			
		}
		else if(color['type'] == 'special')
		{
			if(color['colorName'].indexOf('blue-red') !== -1 ) {
				output = this.generateGridPattern(color['code'], color['size']);
			}
			
		}

		return output;
	}
	updateFrontColor(color, silent = false){
		let sec = this.fields['shape-front-color'].parentNode.parentNode;
		if(color === 'upload') {
			sec.classList.add('viewing-background-upload');
			// this.shapeMethod = 'clip';
		} else  {
			sec.classList.remove('viewing-background-upload');
			this.shapeMethod = 'draw';
			this.frontIsGridColor = color['type'] == 'special';
			if(this.frontMaterial) this.frontMaterial.dispose();
			this.frontMaterial = this.processColor(color);
			if(this.mesh_front) {
				this.mesh_front.material = this.frontMaterial;
				this.mesh_front.needsUpdate = true;
			}
			if(!silent) this.canvasObj.draw();
		}
	}
	updateBackColor(color, silent = false){
		let sec = this.fields['shape-back-color'].parentNode.parentNode;
		if(color === 'upload') {
			sec.classList.add('viewing-background-upload');
		}  else  {
			sec.classList.remove('viewing-background-upload');
			this.shapeMethod = 'draw';
			this.backIsGridColor = color['type'] == 'special';
			if(this.backMaterial) this.backMaterial.dispose();
			this.backMaterial = this.processColor(color);
			if(this.mesh_back) {
				this.mesh_back.material = this.backMaterial;
				this.mesh_back.needsUpdate = true;
			}
			if(!silent) this.canvasObj.draw();
		}
		
		if(!silent) this.canvasObj.draw();
	}
	updateFrontTextColor(color, silent = false){
		this.frontTextMaterial = this.processColor(color);
		if(this.mesh_frontText) {
			this.mesh_frontText.material = this.frontTextMaterial;
			this.mesh_frontText.needsUpdate = true;
		}
		if(!silent) this.canvasObj.draw();
	}
	updateBackTextColor(color, silent = false){
		this.backTextMaterial = this.processColor(color);
		if(this.mesh_backText) {
			this.mesh_backText.material = this.backTextMaterial;
			this.mesh_backText.needsUpdate = true;
		}
		if(!silent) this.canvasObj.draw();
	}
	updateWatermark(idx, values_obj = {}, silent=false){
    	super.updateWatermark(idx, values_obj);
		let mesh_data = [{
				mesh: this.watermarks[idx].mesh_front,
				group: this.frontWatermarkGroup
			}, {
				mesh: this.watermarks[idx].mesh_back,
				group: this.backWatermarkGroup
			}];
		for(let key in mesh_data) {
			if(!mesh_data[key].mesh) continue;
			let mesh = mesh_data[key].mesh;
			let group = mesh_data[key].group;
			group.remove(mesh);
			if(mesh instanceof Text) {
				group.remove(mesh);
				mesh.dispose();
			} else if(mesh instanceof THREE.Group) {
				group.remove(mesh);
				this.disposeGroup(mesh);
				// mesh.children.forEach(child => {
				// 	if (child instanceof THREE.Mesh) {
				// 		child.dispose();
				// 	}
				// 	mesh.remove(child);
				// });
				// mesh.children = [];
			}
		}
		this.frontWatermarkGroup.remove(this.watermarks[idx].mesh_front);
		this.backWatermarkGroup.remove(this.watermarks[idx].mesh_back);
		this.watermarks[idx].mesh_front = false;
		this.watermarks[idx].mesh_back = false;
		
		if(!silent) this.canvasObj.draw();
	}
	disposeGroup(g){
		g.children.forEach(child => {
			if (child instanceof THREE.Mesh) {
				child.dispose();
			}
			g.remove(child);
		});
		g.children = [];
	}
	updateImg(idx, image, silent = false, isBack = false, debug=''){
		
		if(debug) {
			console.log('updateImg');
			console.log(idx, this.imgs)
		}
		// console.log(image);
		super.updateImg(idx, image, silent);
		if(!isBack) {
			this.mesh_front.remove(this.frontMaterial);
		}
		const textureLoader = new THREE.TextureLoader();
		return textureLoader.load(this.imgs[idx].img.src, (texture) => {
			// Set texture filtering
			texture.magFilter = THREE.LinearFilter;
			texture.minFilter = THREE.LinearFilter;
			texture.colorSpace = THREE.SRGBColorSpace;
			texture.wrapS = THREE.ClampToEdgeWrapping;
			texture.wrapT = THREE.ClampToEdgeWrapping;
  			let mesh = isBack ? this.mesh_back : this.mesh_front;
			if(!isBack) {
				this.frontMaterial = new THREE.MeshBasicMaterial({ map: texture });
				mesh.material = this.frontMaterial;
			} else {
				this.backMaterial = new THREE.MeshBasicMaterial({ map: texture });
				mesh.material = this.backMaterial;
			}
			mesh.needsUpdate = true;
			let geometry = isBack ? this.geometry_back : this.geometry_front;
			let original_uv_array = isBack ? this.geometry_back_uvs : this.geometry_front_uvs;
			const imageAspect = texture.image.width / texture.image.height;
			geometry.computeBoundingBox();
			const bbox = geometry.boundingBox;
			const geomWidth = bbox.max.x - bbox.min.x;
			const geomHeight = bbox.max.y - bbox.min.y;
			const geometryAspect = geomWidth / geomHeight;

			let scaleX = 1 / this.imgs[idx].scale;
			let scaleY = 1 / this.imgs[idx].scale;

			if (imageAspect > geometryAspect) {
				scaleX *= geometryAspect / imageAspect;
			} else {
				scaleY *= imageAspect / geometryAspect;
			}

			const dev_x = this.imgs[idx].shiftX ? this.imgs[idx].shiftX * scaleX / geomWidth : 0;
			const dev_y = this.imgs[idx].shiftY ? this.imgs[idx].shiftY * scaleY / geomHeight : 0;
			console.log(scaleX, scaleY);
			console.log(dev_x, dev_y);

			const uvArray = [];
			const position = geometry.attributes.position;
			const max = bbox.max;
			const min = bbox.min;
			// console.log(geometry.attributes.position)
			for (let i = 0; i < position.count; i++) {
				const x = position.getX(i);
				const y = position.getY(i);
		
				let u = (x - min.x) / (max.x - min.x);
				let v = (y - min.y) / (max.y - min.y);
				u = u * scaleX + (1 - scaleX) / 2 - dev_x;
				v = v * scaleY + (1 - scaleY) / 2 + dev_y;
				uvArray.push(u, v);
			}
		
			geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));
			geometry.attributes.uv.needsUpdate = true;

			console.log('updateImg done');
			console.log(this.imgs['front-background-image']);
			
			// this.renderer.render( this.scene, this.camera );
			if(!silent) this.canvasObj.draw();
			// return true;
		});
	}
	processStaticColorData(colorData){
		var output = {}; // params of material
		let color = '';
		if(colorData['code'].length == 4 && colorData['code'].indexOf('#') !== -1)
		{
			for(let i = 1; i <= 3; i++)
				color += colorData['code'][i] + colorData['code'][i];
			color = '#' + color;
		}
		else
			color = colorData['code'];
		output['color'] = new THREE.Color(color);
		if(colorData.type == 'transparent')
		{
			output['transparent'] = true;
			output['opacity'] = colorData.opacity;

		}
		return output;
	}
	drawShape()
	{
		if(this.geometry_front) {
			this.geometry_front.dispose();
			if(this.mesh_front) this.mesh_front.remove(this.geometry_front);
		}
		if(this.geometry_back) {
			this.geometry_back.dispose();
			if(this.mesh_back) this.mesh_back.remove(this.geometry_back);
		}
		if(this.shape.base == 'rectangle' || this.shape.base == 'fill')
			this.drawRectangle();
		else if(this.shape.base == 'circle')
			this.drawCircle();
		else if(this.shape.base == 'triangle')
			this.drawTriangle();
		else if(this.shape.base == 'hexagon')
			this.drawHexagon();
		else if(this.shape.base == 'heart')
			this.drawHeart();
		// this.geometry_front.needsUpdate = true;
		// this.geometry_back.needsUpdate = true;
		if(this.mesh_front) {
			this.mesh_front.geometry = this.geometry_front;
			this.mesh_front.needsUpdate = true;
		}
		if(this.mesh_back) {
			this.mesh_back.geometry = this.geometry_back;
			this.mesh_back.needsUpdate = true;
		}
		this.geometry_front_uvs = new Float32Array(this.geometry_front.attributes.uv.array);
		this.geometry_back_uvs = new Float32Array(this.geometry_back.attributes.uv.array);
		if( this.fields['shape-front-color'] && this.fields['shape-front-color'].value === 'upload'  ) {
			if(this.imgs['front-background-image']) {
				this.updateImg('front-background-image', this.imgs['front-background-image'].img);
			}
		}
		if(this.fields['shape-back-color'] && this.fields['shape-back-color'].value === 'upload') {
			if(this.imgs['back-background-image']) {
				this.updateImg('back-background-image', this.imgs['back-background-image'].img, false, false);
			}
		}
	}
	actualDraw (animate = true){
		let sync = !animate;
		this.scene.add( this.group );
		if(this.frontIsGridColor){
			this.mesh_front = this.frontMaterial;
		}
		else if(!this.mesh_front){
			this.mesh_front = new THREE.Mesh( this.geometry_front, this.frontMaterial );
			this.mesh_front.scale.copy(this.scale);
		} 
		
		if(this.backIsGridColor){
			this.mesh_back = this.backMaterial;
		}
		else if(!this.mesh_back){
			this.mesh_back = new THREE.Mesh( this.geometry_back, this.backMaterial );
			this.mesh_back.scale.copy(this.scale);
		} 
		if(this.frontWatermarkGroup.parent !== this.mesh_front)
			this.mesh_front.add(this.frontWatermarkGroup);
		if(this.backWatermarkGroup.parent !== this.mesh_back)
			this.mesh_back.add(this.backWatermarkGroup);
		if(!this.mesh_frontText) {
			this.mesh_frontText = this.write( this.frontText, this.frontTypography, this.frontTextMaterial, this.frontTextPosition, this.animationName, false, null, 0, sync );
			if(this.mesh_frontText)
				this.mesh_front.add(this.mesh_frontText);
		}
		if(!this.mesh_backText) {
			this.mesh_backText = this.write( this.backText, this.backTypography, this.backTextMaterial, this.backTextPosition, this.animationName, true, null, 0, sync );
			if(this.mesh_backText)
				this.mesh_back.add(this.mesh_backText);
		}
		if( this.shape.watermarkPositions !== undefined)
		{
			this.watermarks.forEach(function(el, i){
				if(el.mesh_front) {
					this.frontWatermarkGroup.remove(el.mesh_front);
					if(el.mesh_front instanceof Text)
						el.mesh_front.dispose();
					else if(el.mesh_front instanceof THREE.Group)
						this.disposeGroup(el.mesh_front);
				}
				if(el.mesh_back) {
					this.backWatermarkGroup.remove(el.mesh_back);
					if(el.mesh_back instanceof Text)
						el.mesh_back.dispose();
					else if(el.mesh_back instanceof THREE.Group)
						this.disposeGroup(el.mesh_back);
				}

				if(this.shape.watermarkPositions == 'all' || this.shape.watermarkPositions.includes(el.position))
				{
					let thisColor = this.options.watermarkColorOptions[el.color]['color'];
					let thisMaterial = new THREE.MeshBasicMaterial(this.processStaticColorData(thisColor));
					el.mesh_front = this.write(el.str, el.typography, thisMaterial, el.position, this.animationName, false, el.shift, el.rotate, sync);
					if(el.mesh_front) this.frontWatermarkGroup.add(el.mesh_front);
					el.mesh_back = this.write(el.str, el.typography, thisMaterial, el.position, this.animationName, false, el.shift, el.rotate, sync);
					if(el.mesh_back) this.backWatermarkGroup.add(el.mesh_back);
				}
			}.bind(this));
		}
		if(this.mesh_front.parent !== this.group) 
			this.group.add(this.mesh_front);
		
		if(this.animationName == 'none') return;
		let animationName = animate ? this.animationName : 'rest-front';
		this.animate(animationName);
		 
	}
	
	draw (animate = true){
		this.resetAnimation();
		this.isForward = true;
		this.actualDraw(animate);
	}
	
	// drawForRecording(){
	// 	if(this.animationName == 'none') return;
	// 	this.draw(false);
	// }
	
	generateThreeColorsGradient(uniforms, angle){
		uniforms.measure = Math.abs(uniforms.bboxMax.value.x * 2);
		let material_gradient = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: `
			uniform vec3 bboxMin;
			uniform vec3 bboxMax;

			varying vec2 vUv;

			void main() {
				vUv.y = (position.y - bboxMin.y) / (bboxMax.y - bboxMin.y) * .5;
				vUv.x = (position.x - bboxMin.x) / (bboxMax.x - bboxMin.x) * .5;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
			}
		`,
		fragmentShader: `
			uniform vec3 color1;
			uniform vec3 color2;
			uniform vec3 color3;
			uniform float measure;

			varying vec2 vUv;

			void main() {
				if( vUv.x + vUv.y < .5 )
				{
					gl_FragColor = vec4(mix(color1, color2, (vUv.x+vUv.y) * 2. ), 1.0);
				}
				else
					gl_FragColor = vec4(mix(color3, color2, (1. - (vUv.x+vUv.y)) * 2. ), 1.0);
				
			}
		`
		});
		return material_gradient;
	}
	generateTwoColorsGradient(uniforms, angle){
		if(angle == 45)
		{
			var vertexShader = `
				uniform vec3 bboxMin;
				uniform vec3 bboxMax;

				varying vec2 vUv;

				void main() {
					vUv.y = (position.y - bboxMin.y) / (bboxMax.y - bboxMin.y) / 2. ;
					vUv.x = (position.x - bboxMin.x) / (bboxMax.x - bboxMin.x) / 2. ;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
				}
			`;
			var fragmentShader = `
				uniform vec3 color1;
				uniform vec3 color2;

				varying vec2 vUv;

				void main() {
					gl_FragColor = vec4(mix(color1, color2, vUv.x+vUv.y), 1.0);
				}
			`;
		}
		else if(angle == 90)
		{
			var vertexShader = `
				uniform vec3 bboxMin;
				uniform vec3 bboxMax;

				varying vec2 vUv;

				void main() {
					vUv.y = (position.y - bboxMin.y) / (bboxMax.y - bboxMin.y) ;
					vUv.x = (position.x - bboxMin.x) / (bboxMax.x - bboxMin.x) ;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
				}
			`;
			var fragmentShader = `
				uniform vec3 color1;
				uniform vec3 color2;

				varying vec2 vUv;

				void main() {
					gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
				}
			`;
		}
		let material_gradient = new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader
		});
		return material_gradient;
	}
	generateGradient(geometry, colors, angle){
		angle = typeof angle === undefined ? 90 : angle;
		geometry.computeBoundingBox();
		let uniforms = {};

		colors.forEach(function(el, i){
			uniforms['color' + (i + 1)] = {};
			uniforms['color' + (i + 1)].value = new THREE.Color(el);
		});

		uniforms.bboxMin = {};
		uniforms.bboxMin.value = geometry.boundingBox.min;
		uniforms.bboxMax = {};
		uniforms.bboxMax.value = geometry.boundingBox.max;

		if(colors.length == 2)
			return this.generateTwoColorsGradient(uniforms, angle);
		else if(colors.length == 3)
			return this.generateThreeColorsGradient(uniforms, angle);
	}
	generateGridPattern(colors, size){
		let m = [];
		// let num = (this.canvas.width) / size;
		let num = 8;
		let g = new THREE.PlaneGeometry( 540, 540, 8, 8 );
		m.push(new THREE.MeshBasicMaterial({color: 'rgb(0,0,255)'}));
		m.push(new THREE.MeshBasicMaterial({color: 'rgb(255,0,0)'}));
		for(let i = 0; i < num; i++ ) {
			for(let j = 0; j < num; j++){
				let mIdx = i % 2 == 0 ? (j % 2 == 0 ? m[0] : m[1]) : (j % 2 == 0 ? m[1] : m[0]);
				g.addGroup(i, 1, mIdx)
			}
		}
		let output = new THREE.Mesh( g, m);
		return output;
	}
	resetAnimation(){
		if(this.isForward)
            this.group.remove( this.mesh_front );
        else
            this.group.remove( this.mesh_back );
		if(this.mesh_front) {
			this.mesh_front.rotation.x = 0;
			this.mesh_front.rotation.y = 0;
			this.mesh_front.rotation.z = 0;
		}
		if(this.mesh_back) {
			this.mesh_back.rotation.x = 0;
			this.mesh_back.rotation.y = 0;
			this.mesh_back.rotation.z = 0;
		}
        cancelAnimationFrame(this.timer);
        this.timer = null;
        this.easeAngleInterval = this.easeAngleInitial;
        this.renderer.render( this.scene, this.camera );
	}

	updateAnimation(animationData, syncing = false, silent = false, initRecording = false){
		this.animationName = animationData;
		if(!silent) this.canvasObj.draw();
		if(this.animationName !== 'none')
		{
			return;
		}
		let isAllNone = true;
		for(let shape_id in this.canvasObj.shapes) {
			let shape = this.canvasObj.shapes[shape_id];
			if(shape.animationName !== 'none'){
				isAllNone = false;
			}
		}
		if(isAllNone && !syncing) {
			if(!syncing) {
				document.body.classList.remove('viewing-three');
				this.canvasObj.sync();
			} else {
				document.body.classList.add('viewing-three');
			}
			
		}
	}
	updateAnimationSpeed(speed, silent = false){
		this.animationSpeed = this.options.animationSpeedOptions[speed];
		let value = parseFloat(this.animationSpeed.value);
		this.flipAngleInterval = this.flipAngleInterval_base * value;
        this.spinAngleInterval = this.spinAngleInterval_base * value;
		this.rotateAngleInterval = this.rotateAngleInterval_base * value;
		this.recordingBreakPoint = value * Math.PI * 2;
		if(!silent) this.canvasObj.draw();
	}
	animate(animationName, isSilent = false){
		if(this.initRecording && !this.canvasObj.isRecording) {
			isSilent = true;
			setTimeout(()=>{
				// this.initRecording = false;
				this.canvasObj.startRecording();
				setTimeout(()=>{
					console.log(this.mesh_front.rotation.z);
					this.animate(this.animationName);
				}, 200)
				
			}, 200);
			
		}
		if(animationName == 'spin'){
			this.mesh_back.rotation.y = Math.PI;
			this.backWatermarkGroup.scale.copy(this.scale);
			this.backWatermarkGroup.scale.multiply(new THREE.Vector3(-1, 1, 1));
			if(!isSilent) this.spin();
		}
		else if(animationName == 'flip'){
			this.mesh_back.rotation.x = Math.PI;
			this.backWatermarkGroup.scale.copy(this.scale);
			this.backWatermarkGroup.scale.multiply(new THREE.Vector3(1, -1, 1));
			if(!isSilent) this.flip();
		}
		else if(animationName == 'rotate'){
			if(!isSilent) this.rotate();
		}
		else if(animationName == 'rotate-counter'){
			if(!isSilent) this.rotate(true);
		}
		else if(animationName == 'spin-ease')
		{
			this.mesh_back.rotation.y = Math.PI;
			// this.mesh_back.scale.copy(this.scale);
			this.backWatermarkGroup.scale.copy(this.scale);
			this.backWatermarkGroup.scale.multiply(new THREE.Vector3(-1, 1, 1));
			if(this.mesh_backText) this.mesh_backText.rotation.y = Math.PI;
			if(!isSilent) this.spinEase();
		}
		else if(animationName == 'flip-ease')
		{
			this.mesh_back.rotation.x = Math.PI;
			this.backWatermarkGroup.scale.copy(this.scale);
			this.backWatermarkGroup.scale.multiply(new THREE.Vector3(1, -1, 1));
			if(this.mesh_backText) this.mesh_backText.rotation.x = Math.PI;
			if(!isSilent) this.flipEase();
		}
		else if(animationName.indexOf('rest') !== -1)
		{
			if(animationName == 'rest-back-spin'){
				this.isForward = false;
				this.backWatermarkGroup.scale.copy(this.scale);
				this.backWatermarkGroup.scale.multiply(new THREE.Vector3(-1, 1, 1));
				this.group.remove( this.mesh_front );
	  			this.group.add( this.mesh_back );
			}
			else if(animationName == 'rest-back-flip')
			{
				this.isForward = false;
				// this.mesh_back.scale.copy(this.scale);
				this.backWatermarkGroup.scale.copy(this.scale);
				this.backWatermarkGroup.scale.multiply(new THREE.Vector3(1, -1, 1));
				this.group.remove( this.mesh_front );
	  			this.group.add( this.mesh_back );
			}
			else {
				if(this.mesh_front.parent !== this.group) {
					this.group.add(this.mesh_front);
				}
				
				this.isForward = true;
				this.mesh_front.rotation.y += this.spinAngleInterval;
				this.rest();
			}
						
			this.renderer.render( this.scene, this.camera );
		}
		else
			this.resetAnimation();

	}
	rest(move=true){
		if(move)
			this.timer = requestAnimationFrame( ()=>{ this.rest(move) } );
		else 
			this.timer = null
		
		this.renderer.render( this.scene, this.camera );
	}
	spin(){
		this.timer = requestAnimationFrame( this.spin.bind(this) );
		if(this.initRecording) {
			this.mesh_front.rotation.y -= 2 * this.spinAngleInterval;
			this.mesh_back.rotation.y  -= 2 * this.spinAngleInterval;
			this.initRecording = false;
		}
	    this.mesh_front.rotation.y += this.spinAngleInterval;
	    this.mesh_back.rotation.y  += this.spinAngleInterval;
	    if(this.mesh_front.rotation.y % (Math.PI * 2) >= Math.PI / 2 && this.mesh_front.rotation.y % (Math.PI * 2) < 3 * Math.PI / 2)
	  	{
	  		if(this.isForward)
	  		{
	  			this.isForward = false;
	  			this.group.remove( this.mesh_front );
	  			this.group.add( this.mesh_back );
	  		}
	  	}
	    else
	  	{
	  		if(!this.isForward)
	  		{
	  			this.isForward = true;
	  			this.group.add( this.mesh_front );
	  			this.group.remove( this.mesh_back );
	  		}
	  	}
	  	// if( this.canvasObj.isRecording && this.mesh_front.rotation.y >= this.recordingBreakPoint ) this.canvasObj.saveCanvasAsVideo();
	  	if( this.canvasObj.isRecording && this.mesh_front.rotation.y > this.recordingBreakPoint ) this.canvasObj.saveCanvasAsVideo();

	    this.renderer.render( this.scene, this.camera );
	}
	spinEase(){
		this.timer = requestAnimationFrame( this.spinEase.bind(this) );
		if(this.mesh_front.rotation.y < 3.25 * Math.PI)
			this.easeAngleInterval = this.easeAngleInterval * this.easeAngleRate;
		else if(this.mesh_front.rotation.y >= 4 * Math.PI){
			cancelAnimationFrame(this.timer);
			this.mesh_front.rotation.y = 0;
			this.mesh_back.rotation.y = Math.PI;
		}
		this.mesh_front.rotation.y += this.easeAngleInterval;
	    this.mesh_back.rotation.y  += this.easeAngleInterval;
	    if(this.mesh_front.rotation.y % (Math.PI * 2) >= Math.PI / 2 && this.mesh_front.rotation.y % (Math.PI * 2) < 3 * Math.PI / 2)
	  	{
	  		if(this.isForward)
	  		{
	  			this.isForward = false;
	  			this.group.remove( this.mesh_front );
	  			this.group.add( this.mesh_back );
	  		}
	  	}
	    else
	  	{
	  		if(!this.isForward)
	  		{
	  			this.isForward = true;
	  			this.group.add( this.mesh_front );
	  			this.group.remove( this.mesh_back );
	  		}
	  	}

	    this.renderer.render( this.scene, this.camera );
	}
	flip(){
		
		this.timer = requestAnimationFrame( this.flip.bind(this) );
		if(this.initRecording) {
			this.mesh_front.rotation.x -= 2 * this.flipAngleInterval;
			this.mesh_back.rotation.x  -= 2 * this.flipAngleInterval;
			this.initRecording = false;
		}
	    this.mesh_front.rotation.x += this.flipAngleInterval;
	    this.mesh_back.rotation.x  += this.flipAngleInterval;
		
	    if(this.mesh_front.rotation.x % (Math.PI * 2) >= Math.PI / 2 && this.mesh_front.rotation.x % (Math.PI * 2) < 3 * Math.PI / 2)
	  	{
	  		if(this.isForward)
	  		{
	  			this.isForward = false;
	  			this.group.remove( this.mesh_front );
	  			this.group.add( this.mesh_back );
	  		}
	  	}
	    else
	  	{
	  		if(!this.isForward)
	  		{
	  			this.isForward = true;
	  			this.group.add( this.mesh_front );
	  			this.group.remove( this.mesh_back );
	  		}
	  	}
	  	// if( this.canvasObj.isRecording && this.mesh_front.rotation.x >= this.recordingBreakPoint) this.canvasObj.saveCanvasAsVideo();
	  	if( this.canvasObj.isRecording && this.mesh_front.rotation.x > this.recordingBreakPoint) this.canvasObj.saveCanvasAsVideo();

	    this.renderer.render( this.scene, this.camera );
	}
	flipEase(){
		this.timer = requestAnimationFrame( this.flipEase.bind(this) );
		if(this.mesh_front.rotation.x < 3.25 * Math.PI)
			this.easeAngleInterval = this.easeAngleInterval * this.easeAngleRate;
		else if(this.mesh_front.rotation.x >= 4 * Math.PI){
			cancelAnimationFrame(this.timer);
			this.mesh_front.rotation.x = 0;
			this.mesh_back.rotation.x = Math.PI;
		}
	    this.mesh_front.rotation.x += this.easeAngleInterval;
	    this.mesh_back.rotation.x  += this.easeAngleInterval;
	    if(this.mesh_front.rotation.x % (Math.PI * 2) >= Math.PI / 2 && this.mesh_front.rotation.x % (Math.PI * 2) < 3 * Math.PI / 2)
	  	{
	  		if(this.isForward)
	  		{
	  			this.isForward = false;
	  			this.group.remove( this.mesh_front );
	  			this.group.add( this.mesh_back );
	  		}
	  	}
	    else
	  	{
	  		if(!this.isForward)
	  		{
	  			this.isForward = true;
	  			this.group.add( this.mesh_front );
	  			this.group.remove( this.mesh_back );
	  		}
	  	}
	    this.renderer.render( this.scene, this.camera );
	}
	rotate (backward=false){
		this.timer = requestAnimationFrame( ()=>this.rotate(backward) );
		// if( this.canvasObj.isRecording ) console.log(this.mesh_front.rotation.z)
		if(!backward) {
			if(this.initRecording) {
				this.mesh_front.rotation.z += 2 * this.rotateAngleInterval;
	    		this.mesh_back.rotation.z  += 2 * this.rotateAngleInterval;
				this.initRecording = false;
			}
			this.mesh_front.rotation.z -= this.rotateAngleInterval;
	    	this.mesh_back.rotation.z  -= this.rotateAngleInterval;
		} else {
			if(this.initRecording) {
				this.mesh_front.rotation.z -= 2 * this.rotateAngleInterval;
	    		this.mesh_back.rotation.z  -= 2 * this.rotateAngleInterval;
				this.initRecording = false;
			}
			this.mesh_front.rotation.z += this.rotateAngleInterval;
	    	this.mesh_back.rotation.z  += this.rotateAngleInterval;
		}
		
		if( this.canvasObj.isRecording && Math.abs(this.mesh_front.rotation.z) > this.recordingBreakPoint ) this.canvasObj.saveCanvasAsVideo();

	    this.renderer.render( this.scene, this.camera );
	}
    checkWatermarkPosition(position, label){
    	super.checkWatermarkPosition(position, label);
    }
    renderControl(){
		super.renderControl();
		this.control.appendChild(this.renderSelectField('animation-speed', 'Speed', this.options.animationSpeedOptions));
		this.control.appendChild(this.renderSelectField('shape-front-color', 'Color (front)', this.options.colorOptions));
		if(this.options.colorOptions['upload']) {
			let prefix = 'front';
			let field = this.renderFileField(prefix + '-background-image', {wrapper: ['flex-item']}, {wrapper: {flex: 'full'}});
			let controls = this.renderImageControls(prefix + '-background-image');
			let section = this.renderSection('', '', [field, controls], 'background-image-section');
			this.control.appendChild(section);
		}
		this.control.appendChild(this.renderSelectField('shape-back-color', 'Color (back)', this.options.colorOptions));
		if(this.options.colorOptions['upload']) {
			let prefix = 'back';
			let field = this.renderFileField(prefix + '-background-image', {wrapper: ['flex-item']}, {wrapper: {flex: 'full'}});
			let controls = this.renderImageControls(prefix + '-background-image');
			let section = this.renderSection('', '', [field, controls], 'background-image-section');
			this.control.appendChild(section);
		}
		this.fields['shape-back-color'].selectedIndex = 1;
		this.control.appendChild(this.renderTextField('text-front', 'Text (front)', this.options.textPositionOptions, this.options.textColorOptions, this.options.typographyOptions));
		this.control.appendChild(this.renderTextField('text-back', 'Text (back)', this.options.textPositionOptions, this.options.textColorOptions, this.options.typographyOptions));
		this.control.appendChild(super.renderAddWaterMark());
		this.control_wrapper.appendChild(this.control);
	}
    addListeners(){
		if(this.fields['shape']) {
			this.fields['shape'].onchange = function(e){
				let shape_name = e.target.value;
				if(this.options.shapeOptions[shape_name]['shape']['type'] == 'static'){
					this.updateShape(shapeOptions[shape_name]['shape']);
				}
				else if(this.options.shapeOptions[shape_name]['shape']['type'] == 'animation')
				{
					console.log('threejs doesnt support this option');
				}
			}.bind(this);
		}
		
		if(this.fields['text-front']) {
			this.fields['text-front'].onchange = function(e){
				this.updateFrontText(e.target.value);
			}.bind(this);
		}
	    

	    let sText_front_typography = this.control.querySelector('.field-id-text-front-typography');
	    sText_front_typography.onchange = function(e){
	        this.updateFrontTypography(e.target.value);
	    }.bind(this);

	    let sText_front_color = this.control.querySelector('.field-id-text-front-color');
	    sText_front_color.onchange = function(e){
	        let text_color = this.options.textColorOptions[e.target.value]['color'];
	        this.updateFrontTextColor(text_color);
	    }.bind(this);
		let sText_back_color = this.control.querySelector('.field-id-text-back-color');
	    sText_back_color.onchange = function(e){
	        let text_color = this.options.textColorOptions[e.target.value]['color'];
	        this.updateBackTextColor(text_color);
	    }.bind(this);

		if(this.fields['text-front-shift-x']) {	
			this.fields['text-front-shift-x'].onchange = function(e){
				this.updateFrontTextShiftX(parseInt(e.target.value));
			}.bind(this);
			this.fields['text-front-shift-x'].onkeydown = e => this.updatePositionByKey(e, {x: this.fields['text-front-shift-x'], y:this.fields['text-front-shift-y']}, (shift)=>{
				this.updateFrontTextShiftX(shift.x)
				this.updateFrontTextShiftY(shift.y)
			});
			this.fields['text-front-shift-x'].onblur = () => {
				this.unfocusInputs([this.fields['text-front-shift-x'], this.fields['text-front-shift-y']]);
			}
		}
		if(this.fields['text-front-shift-y']) {	
			this.fields['text-front-shift-y'].onchange = function(e){
				this.updateFrontTextShiftY(parseInt(e.target.value));
			}.bind(this);
			this.fields['text-front-shift-y'].onkeydown = e => this.updatePositionByKey(e, {x: this.fields['text-front-shift-x'], y:this.fields['text-front-shift-y']}, (shift)=>{
				this.updateFrontTextShiftX(shift.x);
				this.updateFrontTextShiftY(shift.y);
			});
			this.fields['text-front-shift-y'].onblur = () => {
				this.unfocusInputs([this.fields['text-front-shift-x'], this.fields['text-front-shift-y']]);
			}
		}
		if(this.fields['text-back-shift-x']) {	
			this.fields['text-back-shift-x'].onchange = function(e){
				this.updateBackTextShiftX(parseInt(e.target.value));
			}.bind(this);
			this.fields['text-back-shift-x'].onkeydown = e => this.updatePositionByKey(e, {x: this.fields['text-back-shift-x'], y:this.fields['text-back-shift-y']}, (shift)=>{
				this.updateBackTextShiftX(shift.x)
				this.updateBackTextShiftY(shift.y)
			});
			this.fields['text-back-shift-x'].onblur = () => {
				this.unfocusInputs([this.fields['text-back-shift-x'], this.fields['text-back-shift-y']]);
			}
		}
		if(this.fields['text-back-shift-y']) {	
			this.fields['text-back-shift-y'].onchange = function(e){
				this.updateBackTextShiftY(parseInt(e.target.value));
			}.bind(this);
			this.fields['text-back-shift-y'].onkeydown = e => this.updatePositionByKey(e, {x: this.fields['text-back-shift-x'], y:this.fields['text-back-shift-y']}, (shift)=>{
				this.updateBackTextShiftX(shift.x);
				this.updateBackTextShiftY(shift.y);
			});
			this.fields['text-back-shift-y'].onblur = () => {
				this.unfocusInputs([this.fields['text-back-shift-x'], this.fields['text-back-shift-y']]);
			}
		}
	    let sText_back = this.control.querySelector('.field-id-text-back');
	    this.fields['text-back'] = sText_back;
	    sText_back.onchange = function(e){
	        this.updateBackText(e.target.value);
	    }.bind(this);

	    let sText_back_typography = this.control.querySelector('.field-id-text-back-typography');
		
	    sText_back_typography.onchange = function(e){
	        this.updateBackTypography(e.target.value);
	    }.bind(this);

	    

	    let sShape_front_color = this.control.querySelector('.field-id-shape-front-color');
		this.fields['shape-front-color'] = sShape_front_color;
	    sShape_front_color.onchange = function(e){
			// let sec = e.target.parentNode.parentNode;
	        let shape_color = e.target.value;
			if(shape_color === 'upload') {
				this.updateFrontColor('upload');
			}
	        else {
				// sec.classList.remove('viewing-background-upload');
				if( this.options.colorOptions[shape_color]['color']['type'] == 'solid' || 
					this.options.colorOptions[shape_color]['color']['type'] == 'gradient' ||
					this.options.colorOptions[shape_color]['color']['type'] == 'special')
				{
					this.updateFrontColor(this.options.colorOptions[shape_color]['color']);
					this.counterpart.updateColor(this.options.colorOptions[shape_color]['color']);
					this.updateCounterpartSelectField('shape-color', e.target.selectedIndex);
					if(this.options.colorOptions[shape_color] !== undefined){
						// this.updateCounterpartSelect(sShape_color, shape_color);
						// this.counterpart.updateColor(this.options.colorOptions[shape_color]['color']);
					}
				}
				else if(this.options.colorOptions[shape_color]['color']['type'] == 'special')
				{
					// this.updateFrontSpecialColor(this.options.colorOptions[shape_color]);
				}
			}
	            
	        // document.getElementById("background-image-controls").style.display="none";
	    }.bind(this);

	    let sShape_back_color = this.control.querySelector('.field-id-shape-back-color');
	    sShape_back_color.onchange = function(e){
	        let sec = e.target.parentNode.parentNode;
	        let shape_color = e.target.value;
			if(shape_color === 'upload') {
				sec.classList.add('viewing-background-upload');
				this.updateBackColor('upload');
			}
	        else {
				sec.classList.remove('viewing-background-upload');
				if( this.options.colorOptions[shape_color]['color']['type'] == 'solid' || 
					this.options.colorOptions[shape_color]['color']['type'] == 'gradient' ||
					this.options.colorOptions[shape_color]['color']['type'] == 'special')
				{
					this.updateBackColor(this.options.colorOptions[shape_color]['color']);
					// this.counterpart.updateColor(this.options.colorOptions[shape_color]['color']);
					// this.updateCounterpartSelectField('shape-color', e.target.selectedIndex);
					if(this.options.colorOptions[shape_color] !== undefined){
						// this.updateCounterpartSelect(sShape_color, shape_color);
						// this.counterpart.updateColor(this.options.colorOptions[shape_color]['color']);
					}
				}
				else if(this.options.colorOptions[shape_color]['color']['type'] == 'special')
				{
					// this.updateFrontSpecialColor(this.options.colorOptions[shape_color]);
				}
			}
	    }.bind(this);
	   
	    this.fields['animation'].onchange = function(e){
	        if(!document.body.classList.contains('recording'))
	        {
	            this.animation_selectedIndex = e.target.selectedIndex;
	            this.updateAnimation(e.target.value);
	        }
	        else
	        {
	            e.preventDefault();
	            e.target.selectedIndex = this.animation_selectedIndex;
	            alert("animation type can't be changed when recording");
	        }	        
	    }.bind(this);

	    this.fields['text-front-position'].onchange = function(e){
	    	let position = e.target.value;
	    	this.updateFrontTextPosition(position);
	    }.bind(this);

	    this.fields['text-back-position'].onchange = function(e){
	    	let position = e.target.value;
	    	this.updateBackTextPosition(position);
	    }.bind(this);

		for(let idx in this.fields.imgs) {
			let input = this.fields.imgs[idx];
			input.onclick = function (e) {
				e.target.value = null;
			}.bind(this);
			input.onchange = function(e){
				const file = e.target.files[0];
				if(file.type === 'video/mp4') {
					this.readVideoUploaded(e, (videoElement)=>{
						console.log(videoElement);
						const texture = new THREE.VideoTexture( videoElement );
						this.frontMaterial = new THREE.MeshBasicMaterial({ map: texture })
						this.mesh_front.material = this.frontMaterial;
						this.mesh_front.needsUpdate = true;
						console.log(texture);
						console.log(this.frontMaterial);
					});
				} else {
					this.readImageUploaded(e, (idx, image)=> {
						let isBack = idx.indexOf('back-') !== -1;
						this.updateImg(idx, image, false, isBack)
					});
				}
			}.bind(this);
			input.addEventListener('applySavedFile', (e)=>{
				console.log('applySavedFile');
				let idx = input.getAttribute('image-idx');
				let src = input.getAttribute('data-file-src');
				this.readImage(idx, src, (idx, image, silent)=>{
					let isBack = idx.indexOf('back-') !== -1;
					this.updateImg(idx, image, silent, isBack, 'applySavedFile');
				});
				// this.updateImg();
			});
			let scale_input = input.parentNode.parentNode.querySelector('.img-control-scale');
			if(scale_input) {
				scale_input.oninput = function(e){
				    e.preventDefault();
				    let scale = e.target.value >= 1 ? e.target.value : 1;
					console.log(scale_input.id + ', scale = ', scale);
				    this.updateImgScale(scale, idx);
				}.bind(this);
				scale_input.addEventListener('initImg', ()=>{
					this.initImg(idx);
				});
			}	
			let shift_x_input = input.parentNode.parentNode.querySelector('.img-control-shift-x');
			shift_x_input.oninput = function(e){
				this.updateImgPositionX(e.target.value, idx);
			}.bind(this);
			shift_x_input.addEventListener('initImg', ()=>{
				this.initImg(idx);
			});
			let shift_y_input = input.parentNode.parentNode.querySelector('.img-control-shift-y');
			shift_y_input.oninput = function(e){
				this.updateImgPositionY(e.target.value, idx);
			}.bind(this);
			shift_y_input.addEventListener('initImg', ()=>{
				this.initImg(idx);
			});
		}

		let sAnimation_speed = this.control.querySelector('.field-id-animation-speed');
		if(sAnimation_speed) {
			this.fields['animation_speed'] = sAnimation_speed;
			sAnimation_speed.onchange = function(e){
				this.updateAnimationSpeed(e.target.value);  
			}.bind(this);
		}

	}
	initImg(idx){
		if(!this.imgs[idx]) this.imgs[idx] = {
			img: null,
			x: 0,
			y: 0,				
			shiftY: 0,
			shiftX: 0,
			scale: 1
		};
	}
    updateFrame(frame=null, silent = false)
    {
		frame = frame ? frame : this.generateFrame();
    	super.updateFrame(frame);
		if(this.group) {
			this.group.remove(this.mesh_front);
			this.group.remove(this.mesh_back);
			this.scene.remove(this.group);
			this.group = new THREE.Group();
			this.updateGroupTranslateY();
		}
		
    	if(!silent) this.canvasObj.draw();
    }
	updateGroupTranslateY(){
		if(Object.keys(this.canvasObj.shapes).length === 1) {
			this.group.translateY(0);
		} else {
			this.group.translateY(this.frame.y * this.scale.y);
		}
	}
	generateShapeCenter(){
		let output = {x: 0, y: 0};
		let shape_num = Object.keys(this.canvasObj.shapes).length;
		
		if(shape_num === 1) {
			return output;
		} else if(shape_num === 2) {
			let canvas_h = this.canvasObj.canvas.height;
			output.x = 0;
			output.y = this.shape_index == 0 ? canvas_h / 4 : - canvas_h / 4;
		}
		
		return output;
	}
	generateFrame(){
		// super.generateFrame();
		let output = {};
        let unit_w = this.canvasObj.canvas.width;
        let unit_h = this.canvasObj.canvas.height / (Object.keys(this.canvasObj.shapes).length || 1);
        if(this.shape.base == 'fill') {
            output.w = unit_w;
            output.h = unit_h;
        }
        else {
            let length = unit_w > unit_h ? unit_h : unit_w;
            output.w = length;
            output.h = length;
        }
        this.shapeCenter = this.generateShapeCenter();
        output.x = this.shapeCenter.x;
        output.y = this.shapeCenter.y;
		return output;
	}
    sync(){
		if(!this.counterpart) return;
    	let isSilent = true;
		super.sync();
        super.updateCounterpartWatermarks(isSilent);

        this.canvasObj.counterpart.draw();
    }
	syncImgs(){
		super.syncImgs();
		if(this.frontMaterial.map instanceof THREE.Texture && this.imgs['front-background-image']) {
			let idx = this.fieldCounterparts['front-background-image'];
			this.counterpart.updateImg(idx, this.imgs['front-background-image'].img);
		}
	}
	async readVideoUploaded(event, cb){
		const file = event.target.files[0];
		const videoURL = URL.createObjectURL(file);

		// Create video element
		const videoElement = document.createElement('video');
		videoElement.src = videoURL;
		videoElement.loop = true;
		// videoElement.controls = true;
		// videoElement.width = 600; // Adjust width as needed

		// Append video element to body
		document.body.appendChild(videoElement);

		// Load and play video
		videoElement.load();
		await videoElement.play();
		if(typeof cb === 'function')
			cb(videoElement);
	}
}


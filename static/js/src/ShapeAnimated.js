import * as THREE from "three";
// import fontLoader from './FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Shape } from "./Shape.js";
import {Text} from 'troika-three-text';

export class ShapeAnimated extends Shape {
	constructor(prefix = '', canvasObj, options = {}, format, animated_fonts = {}, shape_index=0){
		super(prefix, canvasObj, options, format, shape_index);
		
		this.geometry_front = null;
		this.geometry_back = null;
		this.fonts = {};

		// this.loader_image = new THREE.TextureLoader();
		// this.clearMaterial = this.material_black;
		// this.material_black = new THREE.MeshBasicMaterial( { color: new THREE.Color("rgb(0, 0, 0)") } );
		// this.material_white = new THREE.MeshBasicMaterial( { color: new THREE.Color("rgb(255, 255, 255)") } );
		this.mesh_front = null;
		this.mesh_frontText = null;
		this.mesh_front = null;
		this.mesh_backText = null;
		this.isForward = true;
		this.flipAngleInterval = 0.020;     // aka, speed
        this.spinAngleInterval = 0.020;
		this.easeAngleInitial = 0.3;
		this.easeAngleRate = 0.98;
		this.easeAngleInterval = this.easeAngleInitial;
		this.recordingBreakPoint = 1 * Math.PI * 2;     // aka, spins
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
		
		this.frontTypography = this.getDefaultOption(this.options.typographyOptions);
		this.backTypography = this.getDefaultOption(this.options.typographyOptions);
		this.timer = null;
		this.animationName = this.options.animationOptions[Object.keys(this.options.animationOptions)[0]].name;
		
		this.devicePixelRatio = window.devicePixelRatio;
		this.frontTextPosition = Object.values(this.options.textPositionOptions)[0].value;
		this.backTextPosition = Object.values(this.options.textPositionOptions)[0].value;
		
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
		// this.scale = new THREE.Vector3(1, 1, 1);
		this.group = new THREE.Group();
		this.updateGroupTranslateY();
		
		this.drawShape();
		this.renderControl();
	    this.addListeners();
		this.updateShape(this.shape, true);
	}
	// async initFonts(){
	// 	try {
    //         const data = await fontLoader.loadThreeFonts();
	// 		for (let font_data of data) {
	// 			this.fonts[font_data['name']] = { 'font': font_data['font'], 'path': font_data['path']};
	// 		}
	// 		// console.log(this.fonts);
    //     } catch (error) {
	// 		console.log('no?');
    //         console.error('Error loading data:', error);
    //     }
	// }
	updateCanvasSize(){
		this.canvasW = this.canvas.width;
		this.canvasH = this.canvas.height;
	}
	addCounterpart(obj)
	{
		super.addCounterpart(obj);
	}
	updateShape(shape, silent = false){
		super.updateShape(shape);
		this.padding = this.getValueByPixelRatio(this.padding);
		for(const prop in this.innerPadding)
			this.innerPadding[prop] = this.getValueByPixelRatio(this.innerPadding[prop]);
		this.cornerRadius = this.getValueByPixelRatio(this.cornerRadius);
		if(!silent) this.canvasObj.draw();
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
		this.fontSetting = {
			font: fontData.font,
			size: fontData.size,
			height: 0.5,
			curveSegments: 2,
			bevelEnabled: false,
			bevelThickness: 0,
			bevelSize: 0,
			bevelOffset: 0,
			bevelSegments: 0
		};
		let output = new Text();
		if(sync)
		{
			output.sync(function(){
				this.canvasObj.updateReadyState();
			}.bind(this));
		}
		output.text = str;
		output.fontSize = fontData.size;
		output.material = material;
		output.position.z = 0.5;
		output.textAlign = align == 'align-left' ? 'left' : 'center';
		output.anchorX = 'center';
		output.anchorY = '50%';
		output.font = fontData.path;
		output.lineHeight = fontData.lineHeight;
		output.letterSpacing = fontData.letterSpacing;
		output.maxWidth = this.textBoxWidth;
		let text_dev_y = this.shape.base == 'triangle' ? this.getValueByPixelRatio( -110 ) : 0;
		output.position.y += text_dev_y;
		// let lines = str.split('\n');
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
			if(align.indexOf('middle') == -1) return;
			let x = 0;
			let y = 0;
			let inner_p_x = this.innerPadding.x;
			// let this_p = this.padding;
			let length = this.frame.w - this.padding * 2;
    		// let innerWidth = this.frame.w - (this_p + inner_p_x) * 2;

    		if(align.indexOf('left') !== -1){
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

	// breakStrByWidth(str, width)
    // {
    // 	let arr_by_linebreak = str.split("\n");
    	
    // 	let line = '';
    // 	let output = '';
    // 	for(var i = 0; i < arr_by_linebreak.length; i++)
    // 	{ 
    // 		let arr_by_space = arr_by_linebreak[i].split(' ');

    // 		for(var j = 0; j < arr_by_space.length; j++)
    // 		{
    // 			let temp = (i + j) !== 0 ? line + ' ' + arr_by_space[j] : arr_by_space[j];
	//     		// let m = this.context.measureText(temp);
	// 			// console.log('??');
	//     		let g = new TextGeometry( temp, this.fontSetting );
	//     		g.computeBoundingBox();
	//     		let w = g.boundingBox.max.x - g.boundingBox.min.x;
	//     		if( w <= width) { 
	//     			line = temp;
	//     			continue;
	//     		}
	//     		output += line + '\n';
	//     		line =  arr_by_space[j];
	//     		// output += line;
    // 		}
    // 		output += i != arr_by_linebreak.length - 1 ? line + '\n' : line;
    // 		line = '';
    // 	}
    // 	output = output.split('\n');
    // 	return output;
    // }

	// breakStrByWidthAndWrite(str, boxWidth, material, lineHeight, align)
    // {
    // 	let current_y = 0;
    // 	let arr_by_linebreak = str.split("\n");
    // 	let line = '';
    // 	let geometry_arr = [];
    // 	let geometry_temp = false;
    // 	let text_width_temp = 0;
    // 	let output = new THREE.Mesh();
    // 	let text_height = 0;

    // 	for(var i = 0; i < arr_by_linebreak.length; i++)
    // 	{

    // 		let arr_by_space = arr_by_linebreak[i].split(' ');
    // 		for(var j = 0; j < arr_by_space.length; j++)
    // 		{
    // 			let temp = (i + j) !== 0 && line !== '' ? line + ' ' + arr_by_space[j] : arr_by_space[j];
    // 			let geometry_text = new TextGeometry( temp, this.fontSetting );
    // 			geometry_text.computeBoundingBox();
    // 			geometry_temp = geometry_temp === '' ? geometry_text : geometry_temp;
    // 			let text_width = geometry_text.boundingBox.max.x - geometry_text.boundingBox.min.x;
    // 			if(geometry_temp === '')
    // 			{
    // 				geometry_temp = geometry_text;
    // 				text_width_temp = text_width;
    // 			}
    // 			if(text_height === 0) text_height = (geometry_text.boundingBox.max.y - geometry_text.boundingBox.min.y);
	//     		if( text_width <= boxWidth) { 
	//     			line = temp;
	//     			geometry_temp = geometry_text;
	//     			text_width_temp = text_width;
	//     			continue;
	//     		}
	//     		let m = new THREE.Mesh(geometry_temp, material);
	//     		output.add(m);
	//     		let x = align == 'center' ? -text_width_temp / 2 : 0;
	//     		geometry_temp.translate(x, text_height / 2 - (Object.keys(output.children).length * line_height), 0);
	    		
	//     		line = arr_by_space[j];
	//     		geometry_temp = j === arr_by_space.length - 1 && j !== 0 ? new TextGeometry( line, this.fontSetting ) : '';
    // 		}
    // 		if(geometry_temp == '') continue;

    // 		geometry_temp.computeBoundingBox();
    // 		if(text_height === 0) text_height = (geometry_temp.boundingBox.max.y - geometry_temp.boundingBox.min.y);
    // 		let text_width = geometry_temp.boundingBox.max.x - geometry_temp.boundingBox.min.x;
    // 		let text_h = geometry_temp.boundingBox.max.y - geometry_temp.boundingBox.min.y;

    // 		let m = new THREE.Mesh(geometry_temp, material);
    // 		let x = align == 'center' ? -text_width / 2 : 0;
    // 		geometry_temp.translate( x, -current_y, 0);
    // 		current_y += lineHeight;
    // 		line = '';
    // 		geometry_temp = '';
    // 	}
 
    // 	return output;
    // }
    
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
		if(!silent) this.canvasObj.draw();
	}
	updateBackTypography(key, silent = false){
		this.backTypography = this.options.typographyOptions[key];
		if(!silent) this.canvasObj.draw();
	}
	updateFrontText(str, silent = false){
		this.frontText = str;
		this.fields['text-front'].value = this.frontText;
		this.scene.remove( this.mesh_frontText );
		this.renderer.renderLists.dispose();
		if(!silent) this.canvasObj.draw();
	}
	updateBackText(str, silent = false){
		this.backText = str;
		this.fields['text-back'].value = this.backText;
		// this.scene.remove( this.mesh_backText );
		// this.renderer.renderLists.dispose();
		if(!silent) this.canvasObj.draw();
	}
	updateFrontTextPosition(position, silent = false){
        this.frontTextPosition = position;
        if(!silent) this.canvasObj.draw();
    }
    updateBackTextPosition(position, silent = false){
        this.backTextPosition = position;
        if(!silent) this.canvasObj.draw();
    }
	updateFrontTextShiftX(x, silent = false){
        this.frontTextShiftX = x * this.canvasObj.scale;
        if(!silent) this.canvasObj.draw();
    }
	updateFrontTextShiftY(y, silent = false){
        this.frontTextShiftY = y * this.canvasObj.scale;
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
		// if(color['type'] == )
		console.log('update front color');
		console.log(color);
		if(color === 'upload') {
			this.shapeMethod = 'clip';
		} else  {
			console.log('draw');
			this.shapeMethod = 'draw';
			this.frontIsGridColor = color['type'] == 'special';
			if(this.frontMaterial) this.frontMaterial.dispose();
			this.frontMaterial = this.processColor(color);
			if(!silent) this.canvasObj.draw();
		}
	}
	updateBackColor(color, silent = false){
		this.backMaterial = this.processColor(color);
		if(!silent) this.canvasObj.draw();
	}
	updateFrontTextColor(color, silent = false){
		this.frontTextMaterial = this.processColor(color);
		if(!silent) this.canvasObj.draw();
	}
	updateBackTextColor(color, silent = false){
		this.backTextMaterial = this.processColor(color);
		if(!silent) this.canvasObj.draw();
	}
	updateWatermark(idx, str = false, position = false, color = false, typography=false, font=false, shift=null, rad=0, silent = false){
    	super.updateWatermark(idx, str, position, color, typography, font, shift, rad);
    	if(this.watermarks[idx].mesh_front != undefined)
 			this.mesh_front.remove( this.watermarks[idx].mesh_front );
 		if(this.watermarks[idx].mesh_back != undefined)
 			this.mesh_back.remove( this.watermarks[idx].mesh_back );
		if(!silent) this.canvasObj.draw();
	}
	updateFrontSpecialColor(color, silent = false){
		var texture_loader = new THREE.TextureLoader()
		texture_loader.load( '/media/00001.jpg', function(texture){
			this.texture = texture;
			this.frontMaterial = new THREE.MeshBasicMaterial( { map:texture });
			if(!silent) this.canvasObj.draw();
		}.bind(this), undefined, function(err){console.log(err);});
		
	}

	updateImg(idx, params, silent = false){
		super.updateImg(idx, params, silent);
        // let imageUrl = evnt.target.result;

		let temp = document.createElement('canvas');
		let temp_ctx = temp.getContext('2d');
		// if(this.timer_color != null)
		// {
		// 	clearInterval(this.timer_color);
		// 	this.timer_color = null;
		// }
		// temp.width = this.canvasW;
		// temp.height = this.canvasH;
		
		// let length = this.frame.w - this.padding * 2;
			
		// let temp_scale = 1;
		// let temp_scaledW = this.imgs[idx].img.width * temp_scale;
		// let temp_scaledH = this.imgs[idx].img.height * temp_scale;
		
		// if(this.imgs[idx].img.width > this.imgs[idx].img.height)
		// {
		// 	temp_scale = length / this.imgs[idx].img.height * this.imgs[idx].scale;
		// 	temp_scaledW = this.imgs[idx].img.width * temp_scale;
		// 	temp_scaledH = this.imgs[idx].img.height * temp_scale;
		// }
		// else
		// {
		// 	temp_scale = length / this.imgs[idx].img.width * this.imgs[idx].scale;
		// 	temp_scaledW = this.imgs[idx].img.width * temp_scale;
		// 	temp_scaledH = this.imgs[idx].img.height * temp_scale;
		// }

		// this.imgs[idx].x = temp.width / 2 - temp_scaledW / 2 + this.imgs[idx].shiftX;
		// this.imgs[idx].y = this.frame.h / 2 - temp_scaledH / 2 + this.imgs[idx].shiftY + this.frame.y;
		// temp_ctx.clearRect(0, 0, temp.width, temp.height)
		// this.clipRectangle(temp_ctx);
		// temp_ctx.drawImage(this.imgs[idx].img, this.imgs[idx].x, this.imgs[idx].y, temp_scaledW, temp_scaledH);
		// console.log(this.imgs[idx].img.width);
		// temp_ctx.drawImage(this.imgs[idx].img, 0, 0, this.imgs[idx].img.width, this.imgs[idx].img.height, 0, 0, this.imgs[idx].img.width, this.imgs[idx].img.height);
		// console.log(this.imgs[idx].img.width, this.imgs[idx].img.height)
		// console.log(this.canvasW, this.canvasH)
		// temp_ctx.drawImage(this.imgs[idx].img, 0, 0, this.canvasW, this.canvasH);

		// this.color = this.context.createPattern(temp, "no-repeat");
		// console.log(temp_ctx)
		// let texture = new THREE.Texture(temp);
		// let texture = new THREE.Texture({image: this.imgs[idx].img});
		const textureLoader = new THREE.TextureLoader();
		// console.log(params['event'].target);
		textureLoader.load(params['event'].target.result, (texture) => {
			console.log(texture);
			// this.frontMaterial.color = new THREE.Color('#ffffff');
			this.frontMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
			// this.frontMaterial.blendColor = new THREE.Color('#ffffff');
			this.frontMaterial.map = texture;
			this.frontMaterial.needsUpdate = true;
			if(!silent) this.canvasObj.draw();
		});
		console.log(this.frontMaterial);
		// this.frontMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
		
		
		// let texture = new THREE.Texture(this.imgs[idx].img);
		// console.log(texture)
		// texture.needsUpdate = true;
		// this.frontMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
		// this.frontMaterial.map = texture;
		// this.frontMaterial.map = texture;
		
		
	}
	processStaticColorData(colorData){
		console.log('processStaticColorData');
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
		console.log(output);
		return output;
	}
	drawShape()
	{
		if(this.geometry_front) this.geometry_front.dispose();
		if(this.geometry_back) this.geometry_back.dispose();
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
		this.geometry_front.needsUpdate = true;
		this.geometry_back.needsUpdate = true;
	}
	actualDraw(animate = true){
		// console.log('actualDraw()');
		let sync = !animate;
		this.scene.add( this.group );
		this.drawShape();
		if(this.mesh_frontText)
			this.mesh_frontText.dispose();
		this.mesh_frontText = this.write( this.frontText, this.frontTypography, this.frontTextMaterial, this.frontTextPosition, this.animationName, false, null, 0, sync );
		if(this.mesh_backText)
			this.mesh_backText.dispose();
		this.mesh_backText = this.write( this.backText, this.backTypography, this.backTextMaterial, this.backTextPosition, this.animationName, true, null, 0, sync );
	
		if(this.frontIsGridColor){
			this.mesh_front = this.frontMaterial;
		}
		else if(!this.mesh_front){
			this.mesh_front = new THREE.Mesh( this.geometry_front, this.frontMaterial );
			// console.log('creating new mesh_front');
			// console.log(this.geometry_front)
			console.log(this.frontMaterial)
		} 
		else {
			this.mesh_front.geometry = this.geometry_front;
			this.mesh_front.material = this.frontMaterial;
			this.mesh_front.needsUpdate = true;
			console.log(this.frontMaterial);
		}
		// console.log(this.geometry_front.needsUpdate);
		
		this.mesh_back = new THREE.Mesh( this.geometry_back, this.backMaterial );

		if(this.mesh_frontText && this.mesh_frontText.parent !== this.mesh_front) 
			this.mesh_front.add(this.mesh_frontText);
		if(this.mesh_backText && this.mesh_backText.parent !== this.mesh_back) 
			this.mesh_back.add(this.mesh_backText);
		
		if( this.shape.watermarkPositions !== undefined)
		{
			this.watermarks.forEach(function(el, i){
				let thisColor = this.options.watermarkColorOptions[el.color]['color'];
				var thisMaterial = new THREE.MeshBasicMaterial(this.processStaticColorData(thisColor));
				if(this.shape.watermarkPositions == 'all' || this.shape.watermarkPositions.includes(el.position))
				{
					let typography = this.options.watermarkTypographyOptions[el.typography];
					if(this.mesh_front) {
						el.mesh_front = this.write(el.str, typography, thisMaterial, el.position, this.animationName, false, el.shift, el.rotate, sync);
						this.mesh_front.add(el.mesh_front);
					}
					if(this.mesh_back) {
						el.mesh_back = this.write(el.str, typography, thisMaterial, el.position, this.animationName, false, el.shift, el.rotate, sync);
						this.mesh_front.add(el.mesh_front);
					}
				}
			}.bind(this));
		}
		if(this.mesh_front.parent !== this.group) 
			this.group.add(this.mesh_front);
		this.mesh_front.scale.multiply(this.scale);
		this.mesh_back.scale.multiply(this.scale);
		if(this.animationName == 'none') return;
		let animationName = animate ? this.animationName : 'rest-front';
		this.animate(animationName);
		 
	}
	
	draw(animate = true){
		this.resetAnimation();
		this.isForward = true;
		this.actualDraw(animate);
	}
	
	drawForRecording(){
		if(this.animationName == 'none') return;
		this.draw(false);
	}
	
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
		// console.log('generateGridPattern');
		// let output = new THREE.Group();
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

	updateAnimation(animationData, syncing = false, silent = false){
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
		// console.log('syncing?');
		// console.log(isAllNone);
		// console.log(syncing);
		if(isAllNone && !syncing) {
			if(!syncing) {
				document.body.classList.remove('viewing-three');
				this.canvasObj.sync();
			} else {
				document.body.classList.add('viewing-three');
			}
			
		}
	}
	animate(animationName){
		if(animationName == 'spin'){
			this.mesh_back.rotation.y = Math.PI;
			this.mesh_back.scale.multiply(new THREE.Vector3(-1, 1, 1));
			if(this.mesh_backText) this.mesh_backText.rotation.y = Math.PI;
			this.spin();
		}
		else if(animationName == 'flip'){
			this.mesh_back.rotation.x = Math.PI;
			this.mesh_back.scale.multiply(new THREE.Vector3(1, -1, 1));
			if(this.mesh_backText) this.mesh_backText.rotation.x = Math.PI;
			this.flip();
		}
		else if(animationName == 'rotate'){
			this.mesh_back.rotation.z = Math.PI;
			this.mesh_back.scale.multiply(new THREE.Vector3(1, 1, -1));
			if(this.mesh_backText) this.mesh_backText.rotation.z = Math.PI;
			this.rotate();
		}
		else if(animationName == 'rotate-counter'){
			this.mesh_back.rotation.z = Math.PI;
			this.mesh_back.scale.multiply(new THREE.Vector3(1, 1, -1));
			if(this.mesh_backText) this.mesh_backText.rotation.z = Math.PI;
			this.rotate(true);
		}
		else if(animationName == 'spin-ease')
		{
			this.mesh_back.rotation.y = Math.PI;
			this.mesh_back.scale.multiply(new THREE.Vector3(-1, 1, 1));
			if(this.mesh_backText) this.mesh_backText.rotation.y = Math.PI;
			this.spinEase();
		}
		else if(animationName == 'flip-ease')
		{
			this.mesh_back.rotation.x = Math.PI;
			this.mesh_back.scale.multiply(new THREE.Vector3(1, -1, 1));
			if(this.mesh_backText) this.mesh_backText.rotation.x = Math.PI;
			this.flipEase();
		}
		else if(animationName.indexOf('rest') !== -1)
		{
			if(animationName == 'rest-back-spin'){
				this.isForward = false;
				this.mesh_back.scale.multiply(new THREE.Vector3(-1, 1, 1));
				if(this.mesh_backText) this.mesh_backText.rotation.y = Math.PI;
				this.group.remove( this.mesh_front );
	  			this.group.add( this.mesh_back );
			}
			else if(animationName == 'rest-back-flip')
			{
				this.isForward = false;
				this.mesh_back.scale.multiply(new THREE.Vector3(1, -1, 1));
				if(this.mesh_backText) this.mesh_backText.rotation.x = Math.PI;
				this.group.remove( this.mesh_front );
	  			this.group.add( this.mesh_back );
			}
			else {
				if(this.mesh_front.parent !== this.group) {
					console.log('add--');
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
			this.timer = requestAnimationFrame( ()=>{ this.rest() } );
		else 
			this.timer = null
		// this.mesh_front.rotation.y += this.spinAngleInterval;
		this.renderer.render( this.scene, this.camera );
	}
	spin(){
		this.timer = requestAnimationFrame( this.spin.bind(this) );
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
		// console.log(this.mesh_frontText);
		this.timer = requestAnimationFrame( this.flip.bind(this) );
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
	rotate(backward=false){
		this.timer = requestAnimationFrame( ()=>this.rotate(backward) );
		if(!backward) {
			this.mesh_front.rotation.z -= this.spinAngleInterval;
	    	this.mesh_back.rotation.z  -= this.spinAngleInterval;
		} else {
			this.mesh_front.rotation.z += this.spinAngleInterval;
	    	this.mesh_back.rotation.z  += this.spinAngleInterval;
		}
	    
	    // if(this.mesh_front.rotation.z % (Math.PI * 2) >= Math.PI / 2 && this.mesh_front.rotation.z % (Math.PI * 2) < 3 * Math.PI / 2)
	  	// {
	  	// 	if(this.isForward)
	  	// 	{
	  	// 		this.isForward = false;
	  	// 		this.group.remove( this.mesh_front );
	  	// 		this.group.add( this.mesh_back );
	  	// 	}
	  	// }
	    // else
	  	// {
	  	// 	if(!this.isForward)
	  	// 	{
	  	// 		this.isForward = true;
	  	// 		this.group.add( this.mesh_front );
	  	// 		this.group.remove( this.mesh_back );
	  	// 	}
	  	// }
	  	// if( this.canvasObj.isRecording && this.mesh_front.rotation.z >= this.recordingBreakPoint ) this.canvasObj.saveCanvasAsVideo();
	  	if( this.canvasObj.isRecording && this.mesh_front.rotation.z > this.recordingBreakPoint ) this.canvasObj.saveCanvasAsVideo();

	    this.renderer.render( this.scene, this.camera );
	}
    checkWatermarkPosition(position, label){
    	super.checkWatermarkPosition(position, label);
    }
    renderControl(){
		super.renderControl();
		this.control.appendChild(this.renderSelectField('shape-front-color', 'Color (front)', this.options.colorOptions));
		if(this.options.colorOptions['upload']) 
			this.control.appendChild(this.renderFileField('background-image-front', 'background-image background-image-front', ''));
		this.control.appendChild(this.renderSelectField('shape-back-color', 'Color (back)', this.options.colorOptions));
		if(this.options.colorOptions['upload']) 
			this.control.appendChild(this.renderFileField('background-image-back', 'background-image background-image-back', ''));
		this.fields['shape-back-color'].selectedIndex = 1;
		this.control.appendChild(this.renderTextField('text-front', 'Text (front)', this.options.textPositionOptions, this.options.textColorOptions, this.options.typographyOptions));
		this.control.appendChild(this.renderTextField('text-back', 'Text (back)', this.options.textPositionOptions, this.options.textColorOptions, this.options.typographyOptions));
		this.control.appendChild(super.renderAddWaterMark());
		this.control_wrapper.appendChild(this.control);
	}
    addListeners(){
		// let sShape = this.control.querySelector('.field-id-shape');
		// console.log(this.fields);
		if(this.fields['shape']) {
			this.fields['shape'].onchange = function(e){
				let shape_name = e.target.value;
				if(this.options.shapeOptions[shape_name]['shape']['type'] == 'static'){
					// this.counterpart.updateShape(shapeOptions[shape_name]['shape']);
					this.updateShape(shapeOptions[shape_name]['shape']);
				}
				else if(this.options.shapeOptions[shape_name]['shape']['type'] == 'animation')
				{
					// if(this.options.shapeOptions[shape_name]['shape']['animation-type'] == 'corner')
					//     this.initCornerAnimation(this.options.shapeOptions[shape_name]['shape']);
					console.log('threejs doesnt support this option');
				}
				let sWatermark_panels = this.control.querySelectorAll('.watermarks-container .panel-section');
				[].forEach.call(sWatermark_panels, function(el, i){
					let availables = this.options.shapeOptions[shape_name]['shape'].watermarkPositions;
					let position = el.querySelector('.watermark-position').value;
					let label = el.querySelector('label[for^="watermark"]');
					this.checkWatermarkPosition(position, label);
				}.bind(this));
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
	        // this.counterpart.updateTextColor(text_color);
	        // this.updateCounterpartSelectField('text-color', e.target.selectedIndex);
	    }.bind(this);

		if(this.fields['text-front-shift-x']) {	
			this.fields['text-front-shift-x'].onchange = function(e){
				this.updateFrontTextShiftX(parseInt(e.target.value));
			}.bind(this);
			this.fields['text-front-shift-x'].onkeydown = e => this.updatePositionByKey(e, {x: this.fields['text-front-shift-x'], y:this.fields['text-shift-y']}, (shift)=>{
				this.updateFrontTextShiftX(shift.x)
				this.updateFrontTextShiftY(shift.y)
			});
			this.fields['text-front-shift-x'].onblur = () => {
				this.unfocusInputs([this.fields['text-front-shift-x'], this.fields['text-shift-y']]);
			}
		}
		if(this.fields['text-front-shift-y']) {	
			this.fields['text-front-shift-y'].onchange = function(e){
				this.updateFrontTextShiftY(parseInt(e.target.value));
			}.bind(this);
			this.fields['text-front-shift-y'].onkeydown = e => this.updatePositionByKey(e, {x: this.fields['text-front-shift-x'], y:this.fields['text-front-shift-y']}, (shift)=>{
				this.updateFrontTextShiftX(shift.x);
				this.updateFrontTextShiftY(-shift.y);
			});
			this.fields['text-front-shift-y'].onblur = () => {
				this.unfocusInputs([this.fields['text-front-shift-x'], this.fields['text-front-shift-y']]);
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

	    let sText_back_color = this.control.querySelector('.field-id-text-back-color');
	    sText_back_color.onchange = function(e){
	        let text_color = this.options.textColorOptions[e.target.value]['color'];
	        this.updateBackTextColor(text_color);
	    }.bind(this);

	    let sShape_front_color = this.control.querySelector('.field-id-shape-front-color');
	    sShape_front_color.onchange = function(e){
			let sec = e.target.parentNode.parentNode;
	        let shape_color = e.target.value;
			if(shape_color === 'upload') {
				sec.classList.add('viewing-background-upload');
				this.updateFrontColor('upload');
			}
	        else {
				sec.classList.remove('viewing-background-upload');
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
	        let shape_color = e.target.value;
	        if( this.options.colorOptions[shape_color]['color']['type'] == 'solid' || 
	            this.options.colorOptions[shape_color]['color']['type'] == 'gradient')
	            this.updateBackColor(this.options.colorOptions[shape_color]['color']);

	        // document.getElementById("background-image-controls").style.display="none";
	    }.bind(this);
	   
	    this.fields['animation'].onchange = function(e){
	        if(!document.body.classList.contains('recording'))
	        {
	            this.animation_selectedIndex = e.target.selectedIndex;
	            // this.counterpart.fields['animation'].selectedIndex = this.animation_selectedIndex;
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
				this.readImage(e, this.updateImg.bind(this));
			}.bind(this);
			// let scale_input = input.parentNode.querySelector('.img-control-scale');
			// if(scale_input) {
			// 	scale_input.oninput = function(e){
			// 	    e.preventDefault();
			// 	    let scale = e.target.value >= 1 ? e.target.value : 1;
			// 	    this.updateImgScale(scale, idx);
			// 	}.bind(this);
			// }	
			// let shift_x_input = input.parentNode.querySelector('.img-control-shift-x');
			// shift_x_input.oninput = function(e){
			// 	this.updateImgPositionX(e.target.value, idx);
			// }.bind(this);
			// let shift_y_input = input.parentNode.querySelector('.img-control-shift-y');
			// shift_y_input.oninput = function(e){
			// 	this.updateImgPositionY(e.target.value, idx);
			// }.bind(this);
		}

	}
	// updateShapeCenter(shapeCenter){
    // 	super.updateShapeCenter(shapeCenter);
    // 	this.group.remove(this.mesh_front);
    // 	this.group.remove(this.mesh_back);
    // 	this.scene.remove(this.group);
    // 	this.group = new THREE.Group();
    // 	this.group.translateY(this.frame.y * this.scale.y);
    // 	this.canvasObj.draw();
    // }
    updateFrame(frame=null, silent = false)
    {
		frame = frame ? frame : this.generateFrame();
    	super.updateFrame(frame);
		// console.log(this.frame);
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
		// console.log('animatedShape gFrame');
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
		// console.log(output);
		return output;
	}
    sync(){
		if(!this.counterpart) return;
    	let isSilent = true;
    	this.updateCounterpartSelectField('shape', this.fields['shape'].selectedIndex);
        this.counterpart.updateShape(this.options.shapeOptions[this.fields['shape'].value]['shape'], isSilent);

        this.updateCounterpartSelectField('animation', this.fields['animation'].selectedIndex);

    	super.updateCounterpartTextField('text', this.fields['text-front'].value);
    	this.counterpart.updateText(this.fields['text-front'].value, isSilent);
        
        this.updateCounterpartSelectField('text-typography', this.fields['text-front-typography'].selectedIndex);
        this.counterpart.updatetypography(this.fields['text-front-typography'].value, isSilent);

        this.updateCounterpartSelectField('text-color', this.fields['text-front-color'].selectedIndex);
        this.counterpart.updateTextColor(this.options.textColorOptions[this.fields['text-front-color'].value]['color'], isSilent);
        

        if( this.options.colorOptions[this.fields['shape-front-color'].value]['color']['type'] == 'solid' || 
            this.options.colorOptions[this.fields['shape-front-color'].value]['color']['type'] == 'gradient')
        {
        	this.updateCounterpartSelectField('shape-color', this.fields['shape-front-color'].selectedIndex);
            this.counterpart.updateColor(this.options.colorOptions[this.fields['shape-front-color'].value]['color'], isSilent);
        }
        super.updateCounterpartWatermarks(isSilent);

        this.canvasObj.counterpart.draw();
    }
}


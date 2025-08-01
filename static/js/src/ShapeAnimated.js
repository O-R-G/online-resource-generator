import * as THREE from "three";
import Shape from "./Shape.js";
import {Text} from 'troika-three-text';
import MediaAnimated from './MediaAnimated.js'
import { generateFieldId, getValueByPixelRatio } from './utils/lib.js';

export default class ShapeAnimated extends Shape {
	constructor(prefix = '', canvasObj, options = {}, format, animated_fonts = {}, shape_index=0){
		super(prefix, canvasObj, options, format, shape_index);
		this.group_front = this.createGroup('group_front');
		this.mesh_front = this.createMesh('mesh_front');
		this.mesh_front.material = this.processColor(Object.values(this.options.colorOptions)[0].color);
		this.mesh_front.initialized = true;
		this.group_front.add(this.mesh_front);
		this.secondary_mesh_front = null;
		this.geometry_front = null;
		
		this.shapes_mesh_front = {};
		this.shapes_geometry_front = {};
		this.shapes_material_front = {};
		this.mesh_front_text = null;
		this.material_front_text = this.processColor(Object.values(this.options.textColorOptions)[0].color);
		this.frontTypography = this.getDefaultOption(this.options.typographyOptions);
		this.frontFont = this.getDefaultOption(this.options.fontOptions);
		this.frontTextPosition = this.getDefaultOption(this.options.textPositionOptions).value;
		
		this.group_back = this.createGroup('group_back');
		this.mesh_back = this.createMesh('mesh_back');
		this.mesh_back.material = this.processColor(Object.values(this.options.colorOptions)[1].color);
		this.mesh_back.initialized = true;
		this.group_back.add(this.mesh_back);
		this.mesh_arr_back = [];
		this.geometry_back_uvs = null;
		this.mesh_back_text = null;
		this.shapes_mesh_back = {};
		this.shapes_geometry_back = {};
		this.shapes_geometry_back_uvs = {};
		this.shapes_material_back = {};
		this.material_back_text = this.processColor(Object.values(this.options.textColorOptions)[0].color);
		this.backTypography = this.getDefaultOption(this.options.typographyOptions);
		this.backFont = this.getDefaultOption(this.options.fontOptions);
		this.backTextPosition = this.getDefaultOption(this.options.textPositionOptions).value;

		this.isForward = true;
		this.animationSpeed = parseFloat(this.getDefaultOption(this.options.animationSpeedOptions).value);		
		this.flipAngleInterval_base = 0.005;     // aka, speed
        this.spinAngleInterval_base = 0.005;
		this.rotateAngleInterval_base = 0.005;
		this.flipAngleInterval = this.flipAngleInterval_base * this.animationSpeed;     // aka, speed
        this.spinAngleInterval = this.spinAngleInterval_base * this.animationSpeed;
		this.rotateAngleInterval = this.rotateAngleInterval_base * this.animationSpeed;
		// suppose speed 3 / 5000ms be the default
		this.animationDurationBase = 15000; 

		/* 
			durations of fade effects have nothing to do with animationDurationBase 
			they use their own durationBase and delayBase to calculate animationDuration 
		*/
		this.fadeInDurationBase = 2000;
		this.fadeInDelayBase = 5000;
		this.fadeOutDurationBase = 1000;
		this.fadeOutDelayBase = 1000;
		
		this.watermarkAngleInterval = 0.005;
		this.easeAngleInitial = 0.3;
		this.easeAngleRate = 0.98;
		this.easeAngleInterval = this.easeAngleInitial;
		this.timer = null;
		this.timer_delaySaveVideo = null;
		this.watermarkTimer = null;
		this.animationName = this.options.animationOptions[Object.keys(this.options.animationOptions)[0]].name;
		
		this.shapeShiftX = 0;
		this.shapeShiftY = 0;
		
		this.fonts = {};
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
		this.frontTextShiftX = 0;
		this.frontTextShiftY = 0;
		this.backTextShiftX = 0;
		this.backTextShiftY = 0;
		
		this.frontIsGridColor = false;
		this.backIsGridColor = false;
		this.path = new THREE.Curve();
		this.frontWatermarkGroup = new THREE.Group();
		this.backWatermarkGroup = new THREE.Group();
		this.startTime = null;
		this.media['front-background-image'] = this.initMedia('front-background-image', {mesh: {front: this.mesh_front, back: null}, isShapeColor: true, fit: 'cover'});
		this.media['back-background-image'] = this.initMedia('back-background-image', {mesh: {front: null, back: this.mesh_back}, isShapeColor: true, fit: 'cover'});
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
		// this.scale = new THREE.Vector3(1, this.canvas.width / this.canvas.height, 1);
		this.scale = new THREE.Vector3(1, 1, 1);
		this.group = new THREE.Group();
		this.setGroupPosition();
		this.drawShape();
		this.renderControl();
	    this.addListeners();
		this.updateShape(this.shape, true);
	}
	updateCanvasSize(){
		this.context = this.canvas.getContext("2d");
		this.renderer = this.canvasObj.renderer;
		this.scene = this.canvasObj.scene;
		this.camera = this.canvasObj.camera;
	}
	addCounterpart(obj)
	{
		super.addCounterpart(obj);
		this.setFieldCounterparts();
	}
	setFieldCounterparts(){
		this.fieldCounterparts['shape'] = 'shape';
		this.fieldCounterparts['shape-shift-x'] = 'shape-shift-x';
		this.fieldCounterparts['shape-shift-y'] = 'shape-shift-y';
		this.fieldCounterparts['animation'] = 'animation';
		this.fieldCounterparts['text-front'] = 'text';
		this.fieldCounterparts['text-front-position'] = 'text-position';
		this.fieldCounterparts['text-front-font'] = 'text-font';
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
		this.resetExtraShapes();
		this.padding = getValueByPixelRatio(this.padding);
		for(const prop in this.innerPadding)
			this.innerPadding[prop] = getValueByPixelRatio(this.innerPadding[prop]);
		this.cornerRadius = getValueByPixelRatio(this.cornerRadius);
		this.drawShape();
		this.updateTextMeshByShape(shape);
		let sWatermark_panels = this.control.querySelectorAll('.watermarks-container .panel-section');
		[].forEach.call(sWatermark_panels, function(el, i){
			let position = el.querySelector('.watermark-position').value;
			let label = el.querySelector('label[for^="watermark"]');
			this.checkWatermarkPosition(position, label);
		}.bind(this));
		if(!silent) this.canvasObj.draw();
		
	}
	updateTextMeshByShape(shape){
		if(this.mesh_front_text) {
			this.mesh_front_text.maxWidth = this.maxWidth;
			if(shape.base === 'triangle') 
				this.mesh_front_text.y += getValueByPixelRatio( -110 );
			this.mesh_front_text.needsUpdate = true;
		}
		if(this.mesh_back_text) {
			this.mesh_back_text.maxWidth = this.maxWidth;
			if(shape.base === 'triangle') 
				this.mesh_back_text.y += getValueByPixelRatio( -110 );
			this.mesh_back_text.needsUpdate = true;
		}
	}
	drawHeart() {
		var path_front = new THREE.Shape();
		var path_back = new THREE.Shape();
		let this_padding = this.padding;
		let side = Math.min(this.frame.w, this.frame.h) - this_padding * 2;
		let arcs = [
			{
				x: -192,
				y: 143.56,
				r: 280,
				from: 5 * Math.PI / 4,
				to: Math.PI / 4
			},
			{
				x: 192,
				y: 143.56,
				r: 280,
				from: 3 * Math.PI / 4,
				to: 7 * Math.PI / 4
			}
		];
		for(let arc of arcs) {
			for(let prop in arc) {
				if(prop === 'from' || prop === 'to') continue;
				arc[prop] = getValueByPixelRatio(arc[prop]);
			}
		}
		let m = side / ((Math.abs(arcs[0]['x']) + arcs[0]['r']) * 2);
		let dev_y = getValueByPixelRatio(412) * m;
		path_front.arc(this.shapeCenter.x + arcs[0].x * m, this.shapeCenter.y + arcs[0].y * m, arcs[0].r * m, arcs[0].from,arcs[0].to, true);
		path_front.moveTo(this.shapeCenter.x, this.shapeCenter.y);
		path_front.arc(this.shapeCenter.x + arcs[1].x * m, this.shapeCenter.y + arcs[1].y * m, arcs[1].r * m, arcs[1].from,arcs[1].to, true);
		path_front.lineTo(this.shapeCenter.x, this.shapeCenter.y - dev_y);
		path_front.closePath();

		path_back.arc(this.shapeCenter.x + arcs[0].x, this.shapeCenter.y + arcs[0].y, arcs[0].r, arcs[0].from,arcs[0].to, true);
		path_back.moveTo(this.shapeCenter.x, this.shapeCenter.y);
		path_back.arc(this.shapeCenter.x + arcs[1].x, this.shapeCenter.y + arcs[1].y, arcs[1].r, arcs[1].from,arcs[1].to, true);
		path_back.lineTo(this.shapeCenter.x, this.shapeCenter.y - dev_y);
		path_back.closePath();

		this.mesh_front.geometry = new THREE.ShapeGeometry(path_front);
		this.mesh_back.geometry = new THREE.ShapeGeometry(path_back);
	}
	drawHexagon(){
		let this_r = this.cornerRadius;
		let this_p = this.padding;
		let this_a = (Math.min(this.frame.w, this.frame.h) - this_p * 2) / 2;
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

		this.mesh_front.geometry = new THREE.ShapeGeometry(path_front);
		this.mesh_back.geometry = new THREE.ShapeGeometry(path_back);
	}
	drawCircle(){
		let this_r = (Math.min(this.frame.w, this.frame.h) - (this.padding * 2))/2;
		this.textBoxWidth = (this.frame.w - this.padding * 2 - this.innerPadding.x * 2) * 0.8;
		this.mesh_front.geometry = new THREE.CircleGeometry( this_r, 64);
		this.mesh_back.geometry = new THREE.CircleGeometry( this_r, 64);
		// this.mesh_front.geometry_uvs = this.mesh_front.geometry.attributes.uv.array;
		// this.geometry_back_uvs = this.geometry_back.attributes.uv.array;
	}
	drawRectangle(){
		let this_r = this.cornerRadius;
		let this_p = this.padding;
		this.textBoxWidth = (this.frame.w - this_p * 2 - this.innerPadding.x * 2);
		let w, h;
		
		if(this.shape.base === 'fill') {
			w = this.frame.w;
			h = this.frame.h;
		} else {
			let side = Math.min(this.frame.w, this.frame.h);
			w = side - this_p * 2 - this_r * 2;
			h = side - this_p * 2 - this_r * 2;
		}
		let path_front = this.drawRectanglePath();
		let path_back = this.drawRectanglePath();

		this.mesh_front.geometry = new THREE.ShapeGeometry(path_front);
		this.mesh_back.geometry = new THREE.ShapeGeometry(path_back);
		
		this.updateSize(w + this_r * 2, h + this_r * 2);
	}
	drawRectanglePath(){
		const output = new THREE.Shape();
		let this_r = this.cornerRadius;
		let this_p = this.padding;
		this.textBoxWidth = (this.frame.w - this_p * 2 - this.innerPadding.x * 2);

		let w, h;
		if(this.shape.base === 'fill') {
			w = this.frame.w;
			h = this.frame.h;
		} else {
			let side = Math.min(this.frame.w, this.frame.h);
			w = side - this_p * 2 - this_r * 2;
			h = side - this_p * 2 - this_r * 2;
		}
		output.moveTo(this.shapeCenter.x - w / 2, 0 + h / 2 + this_r);
		output.lineTo(this.shapeCenter.x + w / 2, 0 + h / 2 + this_r);
		output.arc( 0, -this_r, this_r, Math.PI / 2, 0, true);
		output.lineTo( this.shapeCenter.x + w / 2 + this_r, 0 + h / 2);
		output.lineTo( this.shapeCenter.x + w / 2 + this_r, 0 - h / 2);
		output.arc( -this_r, 0, this_r, 0, 3 * Math.PI / 2, true);
		output.lineTo(this.shapeCenter.x + w / 2, 0 - (h / 2 + this_r));
		output.lineTo(this.shapeCenter.x - w / 2, 0 - (h / 2 + this_r));
		output.arc( 0, this_r, this_r, 3 * Math.PI / 2, Math.PI, true);
		output.lineTo(this.shapeCenter.x -(w / 2 + this_r), 0 - h / 2);
		output.lineTo(this.shapeCenter.x -(w / 2 + this_r), 0 + h / 2);
		output.arc( this_r, 0, this_r, Math.PI, Math.PI / 2, true);
		output.closePath();

		return output;
	}
	drawTriangle(){
		let path_front = this.drawTrianglePath();
		let path_back = this.drawTrianglePath();
		this.mesh_front.geometry = new THREE.ShapeGeometry(path_front);
		this.mesh_back.geometry = new THREE.ShapeGeometry(path_back);
	}
	drawTrianglePath(){
		const output = new THREE.Shape();
		let this_r = this.cornerRadius / 2;
		let this_p = this.padding;
		const w = Math.min(this.frame.w, this.frame.h);
		
		var dev =  - ((w - this_p * 2) * 1.732 / 2) / 8; // h / 12
		this.textBoxWidth = (w - this.padding * 2 - this.innerPadding.x * 2) * 0.6;
		output.lineTo(- (w / 2 - ( this_p + 1.732 * this_r )), - (1.732 * (w / 2 - this_p)) / 3 + dev );
		output.arc( 0, this_r, this_r, 3 * Math.PI / 2, 5 / 6 * Math.PI, true);
		output.lineTo( - 1.732 / 2 * this_r, 2 * (1.732 * (w / 2 - this_p)) / 3 - 3 / 2 * this_r  + dev);
		output.arc( 1.732 / 2 * this_r, - this_r / 2 , this_r, 5 / 6 * Math.PI, Math.PI / 6, true);
		output.lineTo((w / 2 - ( this_p + 1.732 * this_r )) + 1.732 / 2 * this_r, - (1.732 * (w / 2 - this_p)) / 3 + 3 / 2 * this_r + dev );
		output.arc(  - 1.732 / 2 * this_r, - this_r / 2 , this_r, Math.PI / 6, 3 / 2 * Math.PI , true);
		output.lineTo(- (w / 2 - ( this_p + 1.732 * this_r )), - (1.732 * (w / 2 - this_p)) / 3 + dev );
		output.closePath();

		return output;
	}
	drawDiamond(){
		let this_r = this.cornerRadius;
		let this_p = this.padding;
		this.textBoxWidth = (this.frame.w - this_p * 2 - this.innerPadding.x * 2);
		let w, h;
		
		let side = Math.min(this.frame.w, this.frame.h);
		w = side - this_p * 2;
		h = side - this_p * 2;

		let path_front = this.drawDiamondPath();
		let path_back = this.drawDiamondPath();

		this.mesh_front.geometry = new THREE.ShapeGeometry(path_front);
		this.mesh_back.geometry = new THREE.ShapeGeometry(path_back);
		this.updateSize(w + this_r * 2, h + this_r * 2);
	}
	drawDiamondPath(){
		const output = new THREE.Shape();
		// const angleRad = this.rotate;
		const angleRad = 45 * Math.PI / 180;
		const sqrt2 = Math.sqrt(2);
		let side = Math.min(this.frame.w, this.frame.h);
		const w = (side - this.padding * 2) / sqrt2;
		const h = (side - this.padding * 2) / sqrt2;

		const hw = w / 2;
		const hh = h / 2;
		const cx = this.shapeCenter.x;
		const cy = this.shapeCenter.y;

		// Unrotated corner centers
		const corners = [
			{ x: cx - hw + this.cornerRadius, y: cy - hh + this.cornerRadius }, // top-left
			{ x: cx + hw - this.cornerRadius, y: cy - hh + this.cornerRadius }, // top-right
			{ x: cx + hw - this.cornerRadius, y: cy + hh - this.cornerRadius }, // bottom-right
			{ x: cx - hw + this.cornerRadius, y: cy + hh - this.cornerRadius }  // bottom-left
		];

		// Directions: [start angle, end angle] in radians
		const angles = [
			[Math.PI, 1.5 * Math.PI],     // top-left
			[1.5 * Math.PI, 0],           // top-right
			[0, 0.5 * Math.PI],           // bottom-right
			[0.5 * Math.PI, Math.PI],     // bottom-left
		];

		// Start point: first arc start
		let first = this.rotatePoint(corners[0].x + Math.cos(angles[0][0]) * this.cornerRadius, corners[0].y + Math.sin(angles[0][0]) * this.cornerRadius, cx, cy, angleRad);
		output.moveTo(first.x, first.y);

		// Draw all corners
		for (let i = 0; i < 4; i++) {
			const corner = corners[i];
			const rotated = this.rotatePoint(corner.x, corner.y, cx, cy, angleRad);
			const start = angles[i][0] + angleRad;
			const end = angles[i][1] + angleRad;

			output.absarc(rotated.x, rotated.y, this.cornerRadius, start, end, false);
		}

		output.closePath();
		return output;
	}
	drawAngolo(){
		let path_front = this.drawAngoloPath();
		let path_back = this.drawAngoloPath();
		let path_corner_front = this.drawAngoloCornerPath();
		let path_corner_back = this.drawAngoloCornerPath();
		this.mesh_front.geometry = new THREE.ShapeGeometry(path_front);
		this.mesh_back.geometry = new THREE.ShapeGeometry(path_back);
		const key = 'angolo-corner';
		const material = this.processColor( this.options.colorOptions['white'].color);
		this.shapes_geometry_front[key] = new THREE.ShapeGeometry(path_corner_front);
		this.shapes_geometry_back[key] = new THREE.ShapeGeometry(path_corner_back);
		this.shapes_material_front[key] = material;
		this.shapes_material_back[key] = material;
		this.updateSize(this.frame.w, this.frame.h);
	}
	drawAngoloPath() {
		// Outer rectangle
		const paddingX = this.padding;
		const paddingY = this.padding;
		const thicknessX = getValueByPixelRatio(this.shape.thickness[0]),
		thicknessY = getValueByPixelRatio(this.shape.thickness[1]);
		const w = this.frame.w - paddingX * 2;
		const h = this.frame.h - paddingY * 2;
		const inner_w = w - thicknessX * 2;
		const inner_h = h - thicknessY * 2;
		

		// Outer shape
		const outer = new THREE.Shape();
		outer.moveTo(paddingX - w / 2, paddingY - h/2);
		outer.lineTo(paddingX + w / 2, paddingY - h/2);
		outer.lineTo(paddingX + w / 2, paddingY + h/2);
		outer.lineTo(paddingX - w / 2, paddingY + h/2);
		outer.lineTo(paddingX - w / 2, paddingY - h/2);

		// Inner "hole"
		const hole = new THREE.Path();
		hole.moveTo(paddingX + thicknessX - w / 2, paddingY + thicknessY - h/2);
		hole.lineTo(paddingX + thicknessX - w / 2 + inner_w, paddingY + thicknessY - h/2);
		hole.lineTo(paddingX + thicknessX - w / 2 + inner_w, paddingY + thicknessY + inner_h - h/2);
		hole.lineTo(paddingX + thicknessX - w / 2, paddingY + thicknessY + inner_h - h/2);
		hole.lineTo(paddingX + thicknessX - w / 2, paddingY + thicknessY - h/2);

		outer.holes.push(hole);

		return outer;
	}

drawAngoloCornerPath() {
    const paddingX = this.padding;
    const paddingY = this.padding;
	const thicknessX = getValueByPixelRatio(this.shape.thickness[0]),
		thicknessY = getValueByPixelRatio(this.shape.thickness[1]);
    const w = this.frame.w - paddingX * 2;
    const h = this.frame.h - paddingY * 2;
    const size = Math.min(w, h) / 3;


    // Top left corner (Three.js: origin at center, +y is up)
    const x0 = paddingX - w / 2;
    const y0 = h / 2 - paddingY;

    // Outer shape (top left)
    const outer = new THREE.Shape();
    outer.moveTo(x0, y0);
	outer.lineTo(x0 + size, y0);
    outer.lineTo(x0 + size, y0 - size);
    outer.lineTo(x0, y0 - size);
	outer.lineTo(x0, y0);

    // Inner "hole" (extended down)
	const x_inner = x0 + thicknessX;
    const y_inner = y0 - thicknessY;
	// const hole = new THREE.Shape();
    const hole = new THREE.Path();
    hole.moveTo(x_inner, y_inner);
	hole.lineTo(x_inner, y_inner - (size - thicknessY));
	hole.lineTo(x_inner + (size - thicknessX), y_inner - (size - thicknessY));
	hole.lineTo(x_inner + (size - thicknessX), y_inner);
    hole.lineTo(x_inner, y_inner);

    outer.holes.push(hole);

    return outer;
}
drawNone(){
	this.mesh_front.geometry.dispose();
	this.mesh_front.material.dispose();
	this.mesh_back.geometry.dispose();
	this.mesh_back.material.dispose();
}
	rotatePoint(x, y, cx, cy, angleRad) {
		const cos = Math.cos(angleRad);
		const sin = Math.sin(angleRad);
		const dx = x - cx;
		const dy = y - cy;
		return {
			x: cx + dx * cos - dy * sin,
			y: cy + dx * sin + dy * cos
		};
	}
	
	
	write(str = '', typography=false, material, align = 'center', animationName = false, isBack = false, shift=null, font=null, rad=0, sync = false, renderOrder=0){
		if(str == '') return false;
		if(typography === false)
			typography = this.frontTypography;
		shift = shift ? { ...shift } : {x: isBack ? this.backTextShiftX : this.frontTextShiftX, y: isBack ? this.backTextShiftY : this.frontTextShiftY};
		shift.x = shift.x ? getValueByPixelRatio(shift.x) : 0;
		shift.y = shift.y ? getValueByPixelRatio(shift.y) : 0;
		let lineHeight = getValueByPixelRatio(parseFloat(typography['lineHeight']));
		let line_num = str.split("\n").length;
		rad = rad ? -rad : 0;
		let output = new Text();
		if(sync)
		{
			output.sync(function(){
				this.canvasObj.updateReadyState();
			}.bind(this));
		}
		this.applyTypographyAndFontToTextMesh(output, typography, font, isBack);
		output.text = str.replaceAll(' ', '\u00A0');
		output.material = material;
		output.material.depthTest = false;
		if(renderOrder) output.renderOrder = renderOrder;
		output.position.z = 0.5;
		output.textAlign = align == 'align-left' ? 'left' : 'center';
		output.anchorX = align == 'align-left' ? 'left' : 'center';
		output.anchorY = 'middle';
		output.maxWidth = this.textBoxWidth;
		let text_dev_y = 0;
		if(this.shape.base === 'triangle') {
			let w = Math.min(this.frame.w, this.frame.h) - this.padding * 2;
			let h = w * 1.732 / 2 ;
			text_dev_y += h / 8;
		}
		
		output.position.y -= text_dev_y;
		output.position.x = align === 'align-left' ? - this.frame.w / 2 + this.padding + this.innerPadding.x : 0;

		if(animationName && animationName.indexOf('spin') !== -1) output.position.x = - output.position.x;
		if(align == 'align-left' || align == 'center') {
			output.position.x += shift.x;
			output.position.y += shift.y;
			output.sync();
			return output;
		}
		output.lineHeight = parseFloat(typography['lineHeight']) / parseFloat(typography['size']);
		if(this.shape.base == 'rectangle' || this.shape.base == 'fill' || this.shape.base == 'angolo' || this.shape.base == 'none'){
			let inner_p_x = this.innerPadding.x;
			let inner_p_y = this.innerPadding.y;
			let w, h;
			if(this.shape.base == 'angolo') {
				w = this.size.width;
				h = this.size.height;
			} else {
				w = Math.min(this.size.width, this.size.height);
				h = w;
			}
			let x = 0;
			let y = 0;
			if(align.indexOf('left') !== -1){
				output.textAlign = align.indexOf('middle') !== -1 ? 'center' : 'left';
				output.anchorX = align.indexOf('middle') !== -1 ? 'center' : 'left';
				x = align.indexOf('middle') !== -1 ? - w / 2 + inner_p_y : - w / 2 + inner_p_x;
			}
			else if(align.indexOf('right') !== -1){
				output.textAlign = align.indexOf('middle') !== -1 ? 'center' : 'right';
				output.anchorX = align.indexOf('middle') !== -1 ? 'center' : 'right';
				x = align.indexOf('middle') !== -1 ? w / 2 - inner_p_y : w / 2 - inner_p_x;
			}
			else if(align.indexOf('center') !== -1){
				output.textAlign = 'center';
				output.anchorX = 'center';
				x = 0;
			}

			if(align.indexOf('top') !== -1){
				y = h / 2 - inner_p_y;
			} else if (align.indexOf('middle') !== -1){
				output.rotation.z = align.indexOf('left') !== -1 ? Math.PI / 2 : -Math.PI / 2;
			} else if (align.indexOf('bottom') !== -1){
				y = - h / 2 + inner_p_y;
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
			let a = Math.min(this.frame.w, this.frame.h) / 2 - this_p;
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
				y = 1.732 * a / 2 - inner_p_y;
			}
			else if(align.indexOf('middle') !== -1){
				y = 0;
			}
			else if(align.indexOf('bottom') !== -1){
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
			let y_dev = getValueByPixelRatio(-120);
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
    			// output.anchorY = 'bottom-baseline';
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
			let length = Math.min(this.frame.w, this.frame.h) - this.padding * 2;
    		if(align === 'surrounding') {
				let textObjs = [];
				let output = new THREE.Group();
				const radius = (this.frame.w - this.padding * 2 - this.innerPadding.x * 2) / 2;
				const spaceWidth = typography.size * 0.35 ; // Define a fixed width for spaces
				const charWidths = [];
				let currentAngle = Math.PI / 2;
				let synced = 0;
				for (let i = 0; i < str.length; i++) {
					
					const char = str[i];
					
					let text = new Text();
					this.applyTypographyAndFontToTextMesh(text, typography, font, isBack);
					text.text = char;
					// text.fontSize = typography.size;
					text.material = material;
					text.position.z = 0.5;
					text.textAlign = align == 'align-left' ? 'left' : 'center';
					text.anchorX = 'center';
					text.anchorY = 'middle';
					// text.font = fontData.path;
					// text.lineHeight = fontData.lineHeight;
					// text.letterSpacing = fontData.letterSpacing;
					textObjs[i] = text;
					text.sync(()=>{
						const charWidth = text.textRenderInfo.blockBounds[2] - text.textRenderInfo.blockBounds[0];
						charWidths[i] = charWidth;
						synced++;
						text.material.depthTest = false;
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
			if(align.indexOf('middle') !== -1)
				y = 0;
			output.rotation.z += rad;
			output.position.x = x + shift.x;
			output.position.y = y + shift.y;
		} else if(this.shape.base === 'diamond') {
			let x = 0;
			let y = 0;
			let this_padding = this.padding;
    		let inner_p_x = this.innerPadding.x;
    		let inner_p_y = this.innerPadding.y;
			let side = Math.min(this.frame.w, this.frame.h);
			let a = (side - this_padding * 2) / 2;
			const sqrt2 = Math.sqrt(2);
			if(align.indexOf('left') !== -1){
    			x = this.shapeCenter.x - a / 2 + inner_p_x / sqrt2;
       		}
    		else if(align.indexOf('right') !== -1){
    			x = this.shapeCenter.x + a / 2 - inner_p_x / sqrt2;
    		}
    		
			if(align.indexOf('top') !== -1){
				y = this.shapeCenter.y + a / 2 - inner_p_y / sqrt2;
				output.rotation.z = rad + (align.indexOf('left') !== -1 ? 45 * Math.PI / 180 : -45 * Math.PI / 180);
       		}
    		else if(align.indexOf('bottom') !== -1){
    			y = this.shapeCenter.y - a / 2 + inner_p_y / sqrt2;
				y += (lineHeight - getValueByPixelRatio(parseFloat(typography['size'])));
				output.rotation.z = rad + (align.indexOf('left') !== -1 ? 135 * Math.PI / 180 : 225 * Math.PI / 180);
    		}
			output.position.x = x + shift.x;
			output.position.y = y + shift.y;
		}
		if(align.indexOf('top') !== -1)
			output.position.y -= line_num / 2 * lineHeight;
		else if(align.indexOf('bottom') !== -1)
			output.position.y += (line_num / 2 * lineHeight - (lineHeight - getValueByPixelRatio(parseFloat(typography['size']))));
		if(animationName)
			output.position.z = 0.1;
		output.sync();
		return output;
	}
	initMedia(key, props={}, onUpload=null){
		if(!key) return null;
		const prefix = generateFieldId(this.id, key);
		if(!props['mesh']) {
			let mesh = {
				front: this.createMesh(key),
				back: this.createMesh(key)
			};
			props['mesh'] = mesh;
		}
		return new MediaAnimated(key, prefix, this.canvasObj.draw.bind(this.canvasObj), onUpload, this.mediaOptions, props);
	}
	applyTypographyAndFontToTextMesh(text_mesh, typography, font, isBack=false){
		if(!text_mesh) return;
		let fontData = this.processFontData(typography, font, isBack);
		text_mesh.fontSize = fontData.size;
		text_mesh.font = fontData.path;
		text_mesh.lineHeight = fontData.lineHeight;
		text_mesh.letterSpacing = fontData.letterSpacing;
		text_mesh.needsUpdate = true;
	}
	processFontData(typography, font, isBack){
		let output = {};
		let size = typography['size'];
		font = font ? font['animated'] : typography['font']['animated'];
		typography = typography ? typography : (isBack ? this.backTypography : this.frontTypography);
		let fontData = this.fonts[font['name']] ? this.fonts[font['name']] : '';
		output.font = fontData['font'];
		output.path = font['path'];
		output.size = getValueByPixelRatio(size);
		output.lineHeight = typography['lineHeight'] / size;
		output.letterSpacing = typography['letterSpacing'] / size;
		return output;
	}
	updateFrontTypography(key, silent = false){
		this.frontTypography = this.options.typographyOptions[key];
		this.applyTypographyAndFontToTextMesh(this.mesh_front_text, this.frontTypography, this.frontFont);
		
		if(!silent) this.canvasObj.draw();
	}
	updateBackTypography(key, silent = false){
		this.backTypography = this.options.typographyOptions[key];
		this.applyTypographyAndFontToTextMesh(this.mesh_back_text, this.backTypography, this.backFont, true);
		if(!silent) this.canvasObj.draw();
	}
	updateFrontFont(key, silent = false){
		this.frontFont = this.options.fontOptions[key];
		this.applyTypographyAndFontToTextMesh(this.mesh_front_text, this.frontTypography, this.frontFont);
		if(!silent) this.canvasObj.draw();
	}
	updateBackFont(key, silent = false){
		this.backFont = this.options.fontOptions[key];
		this.applyTypographyAndFontToTextMesh(this.mesh_back_text, this.backTypography, this.backFont, true);
		if(!silent) this.canvasObj.draw();
	}
	updateFrontText(str, silent = false){
		this.frontText = str;
		this.fields['text-front'].value = this.frontText;
		if(this.mesh_front_text) {
			this.mesh_front_text.text = this.frontText;
			this.mesh_front_text.needsUpdate = true;
		}
		this.renderer.renderLists.dispose();
		if(!silent) this.canvasObj.draw();
	}
	updateBackText(str, silent = false){
		this.backText = str;
		this.fields['text-back'].value = this.backText;
		if(this.mesh_back_text) {
			this.mesh_back_text.text = this.backText;
			this.mesh_back_text.needsUpdate = true;
		}
		this.renderer.renderLists.dispose();
		if(!silent) this.canvasObj.draw();
	}
	updateFrontTextPosition(position, silent = false){
        this.frontTextPosition = position;
		if(this.mesh_front_text) {
			this.mesh_front_text.textAlign = position == 'align-left' ? 'left' : 'center';
			this.mesh_front_text.anchorX = position == 'align-left' ? 'left' : 'center';
			this.updateFrontTextPositionX(silent);
		}
    }
    updateBackTextPosition(position, silent = false){
        this.backTextPosition = position;
		if(this.mesh_back_text) {
			this.mesh_back_text.textAlign = position == 'align-left' ? 'left' : 'center';
			this.mesh_back_text.anchorX = position == 'align-left' ? 'left' : 'center';
			this.updateBackTextPositionX(silent);
		}
    }
	
	updateFrontTextShiftX(x, silent = false){
		x = x === '' ? 0 : parseFloat(x);
		if(isNaN(x)) return;
        this.frontTextShiftX = x;
		this.updateFrontTextPositionX(silent);
    }
	updateFrontTextShiftY(y, silent = false){
		y = y === '' ? 0 : parseFloat(y);
		if(isNaN(y)) return;
        this.frontTextShiftY = y;
		if(this.mesh_front_text)
			this.updateFrontTextPositionY(silent);
    }
	updateBackTextShiftX(x, silent = false){
		x = x === '' ? 0 : parseFloat(x);
		if(isNaN(x)) return;
        this.backTextShiftX = x;
		this.updateBackTextPositionX(silent);
    }
	updateBackTextShiftY(y, silent = false){
		y = y === '' ? 0 : parseFloat(y);
		if(isNaN(y)) return;
		this.backTextShiftY = y;
		this.updateBackTextPositionY(silent);
    }
	updateFrontTextPositionX(silent=false){
		if(!this.mesh_front_text) return;
		// let dev = getValueByPixelRatio(-3);
		let x = this.frontTextPosition === 'align-left' ? - this.frame.w / 2 + this.padding + this.innerPadding.x : 0;
		x += parseFloat(getValueByPixelRatio(this.frontTextShiftX)) ? parseFloat(getValueByPixelRatio(this.frontTextShiftX)) : 0;

		this.mesh_front_text.position.x = x;
		this.mesh_front_text.needsUpdate = true;
		if(!silent) this.canvasObj.draw();
	}
	updateFrontTextPositionY(silent=false){
		let y = parseFloat(this.frontTextShiftY) ? parseFloat(this.frontTextShiftY) : 0;
		this.mesh_front_text.position.y = getValueByPixelRatio(y);
		this.mesh_front_text.needsUpdate = true;
		if(!silent) this.canvasObj.draw();
	}
	updateBackTextPositionX(silent=false){
		if(!this.mesh_back_text) return;
		let dev = getValueByPixelRatio(-3);
		let x = this.backTextPosition === 'align-left' ? - this.textBoxWidth / 2 + dev : 0;
		x += parseFloat(getValueByPixelRatio(this.backTextShiftX)) ? parseFloat(getValueByPixelRatio(this.backTextShiftX)) : 0;
		this.mesh_back_text.position.x = x;
		this.mesh_back_text.needsUpdate = true;
		if(!silent) this.canvasObj.draw();
	}
	updateBackTextPositionY(silent=false){
		let y = parseFloat(this.backTextShiftY) ? parseFloat(this.backTextShiftY) : 0;
		this.mesh_back_text.position.y = getValueByPixelRatio(-y);
		this.mesh_back_text.needsUpdate = true;
		if(!silent) this.canvasObj.draw();
	}
	updateShapeShiftX(x, silent = false){
		x = x === '' ? 0 : parseFloat(x);
		if(isNaN(x)) return;
		this.shapeShiftX = x;
		this.setGroupPosition();
        if(!silent) this.canvasObj.draw();
    }
	updateShapeShiftY(y, silent = false){
		y = y === '' ? 0 : parseFloat(y);
		if(isNaN(y)) return;
		// y = getValueByPixelRatio(y);
		this.shapeShiftY = y;
		this.setGroupPosition();
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
			output = this.generateGradient(this.mesh_front.geometry, color['code'], color['angle']);
			
		}
		else if(color['type'] == 'special')
		{
			if(color['colorName'].indexOf('blue-red') !== -1 ) {
				output = this.generateGridPattern(color['code'], color['size']);
			}
			
		}

		return output;
	}
	updateFrontColor(color, silent = false, transparent=false){
		let sec = this.fields['shape-front-color'].parentNode.parentNode;
		if(color === 'upload') {
			sec.classList.add('viewing-shape-image-section');
		} else  {
			sec.classList.remove('viewing-shape-image-section');
			this.shapeMethod = 'draw';
			// this.frontIsGridColor = color['type'] == 'special';
			if(color['type'] == 'special') {
				this.mesh_front = this.processColor(color);
			} else  {
				if(this.mesh_front.material) 
					this.mesh_front.material.dispose();
				this.mesh_front.material = this.processColor(color);
				this.mesh_front.material.needsUpdate = true;
			}
			
			if(!silent) this.canvasObj.draw();
		}
	}
	updateBackColor(color, silent = false){
		let sec = this.fields['shape-back-color'].parentNode.parentNode;
		if(color === 'upload') {
			sec.classList.add('viewing-shape-image-section');
		}  else  {
			sec.classList.remove('viewing-shape-image-section');
			this.shapeMethod = 'draw';
			if(color['type'] == 'special') {
				this.mesh_back = this.processColor(color);
			} else {
				if(this.mesh_back.material) 
					this.mesh_back.material.dispose();
				this.mesh_back.material = this.processColor(color);
				this.mesh_back.material.needsUpdate = true;
			}
			if(!silent) this.canvasObj.draw();
		}
		
		
	}
	updateFrontTextColor(color, silent = false){
		this.material_front_text = this.processColor(color);
		if(this.mesh_front_text) {
			if(this.mesh_front_text.material)
				this.mesh_front_text.material.dispose();
			this.mesh_front_text.material = this.material_front_text;
			this.mesh_front_text.needsUpdate = true;
		}
		if(!silent) this.canvasObj.draw();
	}
	updateBackTextColor(color, silent = false){
		this.material_back_text = this.processColor(color);
		if(this.mesh_back_text) {
			if(this.mesh_back_text.material)
				this.mesh_back_text.material.dispose();
			this.mesh_back_text.material = this.material_back_text;
			this.mesh_back_text.needsUpdate = true;
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
	applyVideoAsMaterial(idx, silent=false, isBack=false){
		let videoElement = this.media[idx].obj;
		const texture = new THREE.VideoTexture( videoElement );
		let mesh = isBack ? this.mesh_back : this.mesh_front;
		let material = new THREE.MeshBasicMaterial({ map: texture })
		mesh.material = material;

		const videoAspect = videoElement.videoWidth / videoElement.videoHeight;
		let geometry = mesh.geometry;
		geometry.computeBoundingBox();
		const bbox = geometry.boundingBox;
		const geomWidth = bbox.max.x - bbox.min.x;
		const geomHeight = bbox.max.y - bbox.min.y;
		const geometryAspect = geomWidth / geomHeight;
		// Adjust the UV coordinates to match the aspect ratio
		let offsetX = 0, offsetY = 0, repeatX = 1, repeatY = 1;
		if (videoAspect > geometryAspect) {
			// Video is wider than geometry, scale UV coordinates horizontally
			repeatX = geometryAspect / videoAspect;
			offsetX = (1 - repeatX) / 2;  // Center the video horizontally
		} else {
			// Video is taller than geometry, scale UV coordinates vertically
			repeatY = videoAspect / geometryAspect;
			offsetY = (1 - repeatY) / 2;  // Center the video vertically
		}
		
		// Set the UV transformation on the texture
		texture.wrapS = THREE.ClampToEdgeWrapping;
		texture.wrapT = THREE.ClampToEdgeWrapping;
		texture.offset.set(offsetX, offsetY);
		texture.repeat.set(repeatX, repeatY);
	}
	createMesh(name=''){
		const output = new THREE.Mesh();
		if(name) output.name = name;
		output.initialized = false;
		return output;
	}
	createGroup(name=''){
		const output = new THREE.Group();
		if(name) output.name = name;
		return output;
	}
	// async updateMedia(key, values, silent = false, isBack = false, isVideo = false){
	// 	super.updateMedia(key, values, silent);
	// 	if(isVideo) {
	// 		this.applyVideoAsMaterial(key, silent, isBack)
	// 	}
	// 	else {
	// 		await this.applyImageAsMaterial(key)
	// 		if(!silent) this.canvasObj.draw();
	// 	}
	// }
	async applyImageAsMaterial(key){
		const media = this.media[key];
		const textureLoader = new THREE.TextureLoader();
		return new Promise((resolve, reject) => {
			try{
				textureLoader.load(media.obj.src, (texture) => {
					texture.magFilter = THREE.LinearFilter;
					texture.minFilter = THREE.LinearFilter;
					texture.colorSpace = THREE.SRGBColorSpace;
					const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
						imageWidth = texture.image.width,
						imageHeight = texture.image.height;
					if(media.isShapeColor) {
						/* when media is the shape color, the size/position of the mesh can't be updated  */
						const imageAspect = imageWidth / imageHeight;
						for(const key in media.mesh){
							const mesh = media.mesh[key];
							if(!mesh) continue;
							let scaleX = 1 / media.scale,
								scaleY = 1 / media.scale,
								uvArray = [],
								geometry = mesh.geometry;
							geometry.computeBoundingBox();
							let bbox = geometry.boundingBox;
							const geomWidth = bbox.max.x - bbox.min.x,
								geomHeight = bbox.max.y - bbox.min.y;
							const geometryAspect = geomWidth / geomHeight;
							
							if (imageAspect > geometryAspect) {
								scaleX *= geometryAspect / imageAspect;
							} else {
								scaleY *= imageAspect / geometryAspect;
							}
							const dev_x = media['shift-x'] ? getValueByPixelRatio(media['shift-x']) * scaleX / geomWidth : 0;
							const dev_y = media['shift-y'] ? - getValueByPixelRatio(media['shift-y']) * scaleY / geomHeight : 0;
							const position = geometry.attributes.position;
							const max = bbox.max;
							const min = bbox.min;

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
							mesh.material = material;
						}
					} else {
						for(const key in media.mesh){
							const mesh = media.mesh[key];
							if(!mesh) continue;
							let scaleX = 1, 
								scaleY = 1, 
								scale = media.scale,
								width = getValueByPixelRatio(imageWidth) * scale, 
								height = getValueByPixelRatio(imageHeight) * scale,
								geometry = new THREE.PlaneGeometry(width, height),
								uvArray = [];
							mesh.geometry = geometry;
							geometry.computeBoundingBox();
							let bbox = geometry.boundingBox;
							
							const dev_x = media['shift-x'] ? getValueByPixelRatio(media['shift-x']) * scaleX : 0;
							const dev_y = media['shift-y'] ? - getValueByPixelRatio(media['shift-y']) * scaleY : 0;
							
							const position = geometry.attributes.position;
							const max = bbox.max;
							const min = bbox.min;

							for (let i = 0; i < position.count; i++) {
								const x = position.getX(i);
								const y = position.getY(i);
						
								let u = (x - min.x) / (max.x - min.x);
								let v = (y - min.y) / (max.y - min.y);
								u = u * scaleX + (1 - scaleX) / 2;
								v = v * scaleY + (1 - scaleY) / 2;
								uvArray.push(u, v);
							}
							geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));
							geometry.attributes.uv.needsUpdate = true;
						
							mesh.material = material;
							if(!mesh.initialized) {
								mesh.initialized = true;
								mesh.position.z = 0.5;
							}
							const x = (width - getValueByPixelRatio(this.canvas.width)) / 2 + dev_x,
							y  = - (height - getValueByPixelRatio(this.canvas.height)) / 2 - dev_y;
							mesh.position.x = x;
							mesh.position.y = y;
						}
					}							
					resolve();
				});
			} catch(err) {
				console.log(key, this.media);
			}
			
		})
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
		else if(this.shape.base == 'diamond')
			this.drawDiamond();
		else if(this.shape.base == 'angolo')
			this.drawAngolo();
		else if(this.shape.base == 'none') {
			this.drawNone();
		}
			
		
		if( this.fields['shape-front-color'] && this.fields['shape-front-color'].value === 'upload'  ) {
			if(this.media['front-background-image']) {
				this.media['front-background-image'].draw();
			}
		}
		if(this.fields['shape-back-color'] && this.fields['shape-back-color'].value === 'upload') {
			if(this.media['back-background-image']) {
				this.media['back-background-image'].draw();
				// this.updateMedia('back-background-image', { obj: this.media['back-background-image'].obj}, false, false);
			}
		}
	}
	actualDraw (animate = true){
		let sync = !animate;
		this.scene.add( this.group );
		
		this.addExtraShapeMeshes(this.group_front, this.shapes_geometry_front, this.shapes_material_front);
		this.addExtraShapeMeshes(this.group_back, this.shapes_geometry_back, this.shapes_material_back, true);

		// if(this.frontWatermarkGroup.parent !== this.mesh_front) {
		// 	this.mesh_front.add(this.frontWatermarkGroup);
		// }
		if(this.frontWatermarkGroup.parent !== this.group_front) {
			this.group_front.add(this.frontWatermarkGroup);
		}
			
		if(this.backWatermarkGroup.parent !== this.group_back)
			this.group_back.add(this.backWatermarkGroup);
		this.mesh_front_text = this.write( this.frontText, this.frontTypography, this.material_front_text, this.frontTextPosition, this.animationName, false, null, this.frontFont, 0, sync );
		if(this.mesh_front_text) {
			this.group_front.add(this.mesh_front_text)
		}
		this.mesh_back_text = this.write( this.backText, this.backTypography, this.material_back_text, this.backTextPosition, this.animationName, true, null, this.backFont, 0, sync );
		if(this.mesh_back_text) {
			this.group_back.add(this.mesh_back_text);
		}
		if( this.shape.watermarkPositions !== undefined)
		{
			this.frontWatermarkGroup.clear();
			this.backWatermarkGroup.clear();
			this.watermarks.forEach(function(el, i){

				if(this.shape.watermarkPositions == 'all' || this.shape.watermarkPositions.includes(el.position))
				{
					let thisColor = this.options.watermarkColorOptions[el.color]['color'];
					let thisMaterial = new THREE.MeshBasicMaterial(this.processStaticColorData(thisColor));
					let shift = el.shift ? el.shift : {x: 0, y: 0};
					let renderOrder = i;
					el.mesh_front = this.write(el.str, el.typography, thisMaterial, el.position, this.animationName, false, shift, el.font, el.rotate, sync, renderOrder);
					if(el.mesh_front) this.frontWatermarkGroup.add(el.mesh_front);
					el.mesh_back = this.write(el.str, el.typography, thisMaterial, el.position, this.animationName, false, el.shift, el.font, el.rotate, sync, renderOrder);
					if(el.mesh_back) this.backWatermarkGroup.add(el.mesh_back);
				}
			}.bind(this));
		}
		
		
		if(this.animationName == 'none') return;
		let animationName = animate ? this.animationName : 'rest-front';
		if(animationName.indexOf('rest') !== -1 && animationName.indexOf('back') !== -1 && this.mesh_back.parent !== this.group_back) {
			if(this.group_back.parent !== this.group)
				this.group.add(this.group_back);
			
		}
		else  {
			if(this.group_front.parent !== this.group)
				this.group.add(this.group_front);
			
		}
		if(this.shape.base !== 'none') {
			if(this.mesh_back.parent !== this.group_back)
				this.group_back.add(this.mesh_back);
			if(this.mesh_front.parent !== this.group_front)
				this.group_front.add(this.mesh_front);
		}
		
		
		this.drawImages();
		for(const key in this.media) {
			if(this.media[key].isShapeColor) continue;
			if(this.media[key].mesh.front)
				this.group_front.add(this.media[key].mesh.front);
			if(this.media[key].mesh.back)
				this.group_back.add(this.media[key].mesh.back);
		}
		this.initAnimate(animationName);
		 
	}
	
	draw (animate = true){
		this.resetGroups();
		this.resetAnimation();
		this.isForward = true;
		this.actualDraw(animate);
	}
	addExtraShapeMeshes(main_mesh, geometry_arr, metarial_arr, isBack = false){
		if(Object.keys(geometry_arr).length > 0) {
			for(const key in geometry_arr) {
				const material = metarial_arr[key];
				
				if(!material) continue;
				// const mesh = new THREE.Mesh( geometry_arr[key], material );
				const mesh = this.createMesh(`extra-shape-${key}-${isBack ? 'back' : 'front'}`);
				mesh.material = material;
				mesh.geometry = geometry_arr[key];
				mesh.position.z = 0.5;
				main_mesh.add(mesh);
			}
		}
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
		cancelAnimationFrame(this.timer);
		this.timer = null;
		this.startTime = null;
		this.timer_delaySaveVideo = null;
        this.easeAngleInterval = this.easeAngleInitial;
        this.renderer.render( this.scene, this.camera );
	}
	resetGroups(){
		// this.disposeHierarchy(this.group);
		// this.disposeHierarchy(this.group_front);
		// this.disposeHierarchy(this.mesh_front);
		// this.mesh_front.material.dispose();
		// this.mesh_front.geometry.dispose();
		this.disposeHierarchy(this.group_front);
		this.group_front.rotation.x = 0;
		this.group_front.rotation.y = 0;
		this.group_front.rotation.z = 0;
		// this.disposeHierarchy(this.group_back);
		// this.disposeHierarchy(this.mesh_back);
		// this.mesh_front.material.dispose();
		// this.mesh_front.geometry.dispose();
		this.disposeHierarchy(this.group_back);
		this.group_back.rotation.x = 0;
		this.group_back.rotation.y = 0;
		this.group_back.rotation.z = 0;
		
		
	}
	resetExtraShapes(){
		for(const key in this.shapes_geometry_front) {
			const g = this.shapes_geometry_front[key];
			if(!g) continue;
			this.dump(g);
		}
		this.shapes_geometry_front = {};
		// this.shapes_geometry_front_uvs = {};
		for(const key in this.shapes_material_front) {
			const m = this.shapes_material_front[key];
			if(!m) continue;
			this.dump(m);
		}
		this.shapes_material_front = {};
		for(const key in this.shapes_geometry_back) {
			const g = this.shapes_geometry_back[key];
			if(!g) continue;
			this.dump(g);
		}
		this.shapes_geometry_back = {};
		// this.shapes_geometry_back_uvs = {};
		for(const key in this.shapes_material_back) {
			const m = this.shapes_material_back[key];
			this.dump(m);
		}
		this.shapes_material_back = {};
	}
	resetMaterials(){
		if(this.mesh_front.material) {
			if(this.mesh_front.material.opacity !== 1) {
				this.mesh_front.material.opacity = 1;
				this.mesh_front.material.needsUpdate = true;
			}
		}
		if(this.material_front_text) {
			if(this.material_front_text.opacity !== 1) {
				this.material_front_text.opacity = 1;
				this.material_front_text.needsUpdate = true;
			}
			
		}
		if(this.frontWatermarkGroup && this.frontWatermarkGroup.length) {
			this.frontWatermarkGroup.traverse((child) => {
				if (child.isMesh && child.material && child.material.opacity !== 1) {
					child.material.opacity = 1;
					child.needsUpdate = true;
				}
			});
		}
		if(this.mesh_back.material) {
			if(this.mesh_back.material.opacity !== 1) {
				this.mesh_back.material.opacity = 1;
				this.mesh_back.material.needsUpdate = true;
			}
		}
		if(this.material_back_text) {
			if(this.material_back_text.opacity !== 1) {
				this.material_back_text.opacity = 1;
				this.material_back_text.needsUpdate = true;
			}
			
		}
		if(this.backWatermarkGroup && this.backWatermarkGroup.length) {
			this.backWatermarkGroup.traverse((child) => {
				if (child.isMesh && child.material && child.material.opacity !== 1) {
					child.material.opacity = 1;
					child.needsUpdate = true;
				}
			});
		}
		
	}
	disposeHierarchy(node) {
		/* remove all the children of node */
		const children = [...node.children]; // clone the array to avoid modification issues

		for (const child of children) {
			this.disposeHierarchy(child); // Recursively dispose first

			if (child.geometry) {
				child.geometry.dispose();
			}

			if (child.material) {
				if (Array.isArray(child.material)) {
				child.material.forEach(mat => {
					if (mat.map) mat.map.dispose();
					mat.dispose();
				});
				} else {
					if (child.material.map) child.material.map.dispose();
					child.material.dispose();
				}
			}

			node.remove(child); // Safely remove after disposal
		}
	}
	dump(trash){
		/* dispose only works on materials and geometries */
		trash.dispose();
		if(trash.parent)
			trash.parent.remove(trash);
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
		this.animationSpeed = parseFloat(this.options.animationSpeedOptions[speed].value);
		// this.flipAngleInterval = this.flipAngleInterval_base * this.animationSpeed;
        // this.spinAngleInterval = this.spinAngleInterval_base * this.animationSpeed;
		// this.rotateAngleInterval = this.rotateAngleInterval_base * this.animationSpeed;
		if(!silent) this.canvasObj.draw();
	}
	
	initAnimate(animationName, isSilent = false){
		this.resetAnimation();
		this.resetMaterials();
		if(!animationName) animationName = this.animationName;
		this.animationDuration = this.animationDurationBase / this.animationSpeed;
		if(animationName == 'spin'){
			// this.mesh_front.rotation.y = 0;
			// this.mesh_back.rotation.y  = Math.PI;
			// this.group.remove( this.mesh_back );
			// this.group.add( this.mesh_front );
			this.group_front.rotation.y = 0;
			this.group_back.rotation.y  = Math.PI;
			this.group.remove( this.group_back );
			this.group.add( this.group_front );
			this.backWatermarkGroup.scale.copy(new THREE.Vector3(-1, 1, 1));
		}
		else if(animationName == 'flip'){
			this.group_front.rotation.x = 0;
			this.group_back.rotation.x = Math.PI;
			this.group.remove( this.group_back );
			this.group.add( this.group_front );
			this.backWatermarkGroup.scale.copy(new THREE.Vector3(1, -1, 1));
		}
		else if(animationName == 'rotate'){
			// this.mesh_front.rotation.y = 0;
			// this.mesh_front.rotation.x = 0;
			// this.group.remove( this.mesh_back );
			// this.group.add( this.mesh_front );
		}
		else if(animationName == 'rotateEaseOut' || animationName == 'rotateBackwardEaseOut'){

		}
		else if(animationName == 'rotateBackward'){
		}
		// else if(animationName == 'spin-ease')
		// {
		// 	this.mesh_back.rotation.y = Math.PI;
		// 	// this.mesh_back.scale.copy(this.scale);
		// 	this.backWatermarkGroup.scale.copy(this.scale);
		// 	this.backWatermarkGroup.scale.multiply(new THREE.Vector3(-1, 1, 1));
		// 	if(this.mesh_back_text) this.mesh_back_text.rotation.y = Math.PI;
		// 	if(!isSilent) this.spinEase();
		// }
		// else if(animationName == 'flip-ease')
		// {
		// 	this.mesh_back.rotation.x = Math.PI;
		// 	this.backWatermarkGroup.scale.copy(this.scale);
		// 	this.backWatermarkGroup.scale.multiply(new THREE.Vector3(1, -1, 1));
		// 	if(this.mesh_back_text) this.mesh_back_text.rotation.x = Math.PI;
		// 	if(!isSilent) this.flipEase();
		// }
		else if(animationName.indexOf('rest') !== -1)
		{
			if(animationName == 'restBackSpin'){
				this.isForward = false;
				// this.backWatermarkGroup.scale.copy(this.scale);
				this.backWatermarkGroup.scale.multiply(new THREE.Vector3(-1, 1, 1));
				this.group.remove( this.group_front );
	  			this.group.add( this.group_back );
			}
			else if(animationName == 'restBackFlip')
			{
				this.isForward = false;
				this.backWatermarkGroup.scale.multiply(new THREE.Vector3(1, -1, 1));
				this.group.remove( this.group_front );
	  			this.group.add( this.group_back );
			}
			else {
				if(this.group_front.parent !== this.group) {
					this.group.add(this.group_front);
				}
				
				this.isForward = true;
				this.group_front.rotation.y += this.spinAngleInterval;
			}
			this.animationName = 'rest';
			
		}
		else if(animationName == 'fadeIn'){
			// if(this.fadeInDelay > this.animationDurationBase) {
			// 	alert('fade-in delay cannot be greater than animationDurationBase ('+this.animationDurationBase+')');
			// 	return;
			// }
			this.mesh_front.material.transparent = true;
			this.mesh_front.material.opacity = 0;
			this.mesh_front.material.needsUpdate = true;
			this.material_front_text.opacity = 0;
			this.material_front_text.needsUpdate = true;
			this.frontWatermarkGroup.traverse((child) => {
				if (child.isMesh && child.material) {
					child.material.opacity = 0;
					child.material.transparent = true;
				}
			});

			this.animationDuration = (this.fadeInDurationBase + this.fadeInDelayBase) / this.animationSpeed;
			this.mesh_front.material.needsUpdate = true;
			
		} else if(animationName == 'fadeOut'){
			this.mesh_front.material.transparent = true;
			this.mesh_front.material.opacity = 1;
			this.mesh_front.material.needsUpdate = true;
			this.material_front_text.opacity = 1;
			this.material_front_text.needsUpdate = true;
			this.frontWatermarkGroup.traverse((child) => {
				if (child.isMesh && child.material) {
					child.material.opacity = 1;
					child.material.transparent = true;
				}
			});
			this.animationDuration = (this.fadeOutDurationBase + this.fadeOutDelayBase) / this.animationSpeed;
		} else {
			this.resetGroups();
		}
		this.renderer.render( this.scene, this.camera );
		if(!isSilent) this.animate(performance.now());
	}
	animate(timestamp){
		if(!this.startTime) {
			this.startTime = timestamp;
		}
		let fn = this[this.animationName].bind(this);
		const progress = ((timestamp - this.startTime) / this.animationDuration );
		fn( progress );
		this.timer = requestAnimationFrame( this.animate.bind(this) );
		if(this.canvasObj.isRecording && ((timestamp - this.startTime) / this.animationDuration >= 1)) {
			setTimeout(()=>{
				this.canvasObj.stopRecording();
			}, 0)
		}
	}
	rest(progress){
		this.renderer.render( this.scene, this.camera );
	}
	spin(progress){
		this.group_front.rotation.y = progress * Math.PI * 2;
		this.group_back.rotation.y  = progress * Math.PI * 2 + Math.PI;
		if(this.group_front.rotation.y % (Math.PI * 2) >= Math.PI / 2 && this.group_front.rotation.y % (Math.PI * 2) < 3 * Math.PI / 2)
	  	{
	  		if(this.isForward)
	  		{
	  			this.isForward = false;
	  			this.group.remove( this.group_front );
	  			this.group.add( this.group_back );
	  		}
	  	}
	    else
	  	{
	  		if(!this.isForward)
	  		{
	  			this.isForward = true;
	  			this.group.add( this.group_front );
	  			this.group.remove( this.group_back );
	  		}
	  	}

		this.renderer.render( this.scene, this.camera );
	}
	// spinEase(){
	// 	this.timer = requestAnimationFrame( this.spinEase.bind(this) );
	// 	if(this.mesh_front.rotation.y < 3.25 * Math.PI)
	// 		this.easeAngleInterval = this.easeAngleInterval * this.easeAngleRate;
	// 	else if(this.mesh_front.rotation.y >= 4 * Math.PI){
	// 		cancelAnimationFrame(this.timer);
	// 		this.mesh_front.rotation.y = 0;
	// 		this.mesh_back.rotation.y = Math.PI;
	// 	}
	// 	this.mesh_front.rotation.y += this.easeAngleInterval;
	//     this.mesh_back.rotation.y  += this.easeAngleInterval;
	//     if(this.mesh_front.rotation.y % (Math.PI * 2) >= Math.PI / 2 && this.mesh_front.rotation.y % (Math.PI * 2) < 3 * Math.PI / 2)
	//   	{
	//   		if(this.isForward)
	//   		{
	//   			this.isForward = false;
	//   			this.group.remove( this.mesh_front );
	//   			this.group.add( this.mesh_back );
	//   		}
	//   	}
	//     else
	//   	{
	//   		if(!this.isForward)
	//   		{
	//   			this.isForward = true;
	//   			this.group.add( this.mesh_front );
	//   			this.group.remove( this.mesh_back );
	//   		}
	//   	}

	//     this.renderer.render( this.scene, this.camera );
	// }
	flip(progress){
		this.group_front.rotation.x = progress * Math.PI * 2;
		this.group_back.rotation.x  = progress * Math.PI * 2 + Math.PI;
		
	    if(this.group_front.rotation.x % (Math.PI * 2) >= Math.PI / 2 && this.group_front.rotation.x % (Math.PI * 2) < 3 * Math.PI / 2)
	  	{
	  		if(this.isForward)
	  		{
	  			this.isForward = false;
	  			this.group.remove( this.group_front );
	  			this.group.add( this.group_back );
	  		}
	  	}
	    else
	  	{
	  		if(!this.isForward)
	  		{
	  			this.isForward = true;
	  			this.group.add( this.group_front );
	  			this.group.remove( this.group_back );
	  		}
	  	}
		this.renderer.render( this.scene, this.camera );
	}
	flipEase(){
		this.timer = requestAnimationFrame( this.flipEase.bind(this) );
		if(this.group_front.rotation.x < 3.25 * Math.PI)
			this.easeAngleInterval = this.easeAngleInterval * this.easeAngleRate;
		else if(this.group_front.rotation.x >= 4 * Math.PI){
			cancelAnimationFrame(this.timer);
			this.group_front.rotation.x = 0;
			this.group_back.rotation.x = Math.PI;
		}
	    this.group_front.rotation.x += this.easeAngleInterval;
	    this.group_back.rotation.x  += this.easeAngleInterval;
	    if(this.mesh_front.rotation.x % (Math.PI * 2) >= Math.PI / 2 && this.group_front.rotation.x % (Math.PI * 2) < 3 * Math.PI / 2)
	  	{
	  		if(this.isForward)
	  		{
	  			this.isForward = false;
	  			this.group.remove( this.group_front );
	  			this.group.add( this.group_back );
	  		}
	  	}
	    else
	  	{
	  		if(!this.isForward)
	  		{
	  			this.isForward = true;
	  			this.group.add( this.group_front );
	  			this.group.remove( this.group_back );
	  		}
	  	}
	    this.renderer.render( this.scene, this.camera );
	}
	rotate(progress){
		this.group_front.rotation.z = -progress * Math.PI * 2;
		this.group_back.rotation.z  = -progress * Math.PI * 2;
		this.mesh_front.rotation.z = -progress * Math.PI * 2;
		this.mesh_back.rotation.z  = -progress * Math.PI * 2;
		this.renderer.render( this.scene, this.camera );
	}
	rotateEaseOut(progress){
		if(progress >= 1) {
			if( this.canvasObj.isRecording && this.timer_delaySaveVideo === null ) {
				this.timer_delaySaveVideo = setTimeout(()=>{ 
					this.canvasObj.saveCanvasAsVideo(); 
					this.initAnimate();
				}, 0);
			} 
			else {
				this.initAnimate();
			}
		} else {
			const easedProgress = this.easeOutQuart(progress);
			const angle = -easedProgress * Math.PI * 2 * 4; // `this.rounds` = number of full spins
			this.group_front.rotation.z = angle;
			this.group_back.rotation.z = angle;
		}

		this.renderer.render( this.scene, this.camera );
	}
	easeOutCubic(t){
		return 1 - Math.pow(1 - t, 3);
	}
	easeOutQuart(t) {
		return 1 - Math.pow(1 - t, 5);
	}
	rotateBackward(progress){
		this.group_front.rotation.z = progress * Math.PI * 2;
		this.group_back.rotation.z  = progress * Math.PI * 2;
		this.renderer.render( this.scene, this.camera );
	}
	rotateBackwardEaseOut(progress){
		if(progress >= 1) {
			if( this.canvasObj.isRecording && this.timer_delaySaveVideo === null ) {
				this.timer_delaySaveVideo = setTimeout(()=>{ 
					this.canvasObj.saveCanvasAsVideo(); 
					this.initAnimate();
				}, 0);
			} 
			else {
				this.initAnimate();
			}
		} else {
			const easedProgress = this.easeOutQuart(progress);
			const angle = easedProgress * Math.PI * 2 * 4; // `this.rounds` = number of full spins
			this.group_front.rotation.z = angle;
			this.group_back.rotation.z = angle;
		}

		this.renderer.render( this.scene, this.camera );
	}
	fadeIn(progress){
		// let fade_finish = this.fadeInDelay / this.animationSpeed / this.animationDuration;
		if(progress >= 1) {
			if( this.canvasObj.isRecording && this.timer_delaySaveVideo === null ) {
				this.timer_delaySaveVideo = setTimeout(()=>{ 
					this.canvasObj.saveCanvasAsVideo(); 
					this.initAnimate();
				}, 0);
			} 
			else {
				this.initAnimate();
			}
		} else {
			let opacity = progress / (this.fadeInDurationBase / this.animationSpeed / this.animationDuration);
			this.mesh_front.material.opacity = opacity;
			this.mesh_front.material.needsUpdate = true;
			this.material_front_text.opacity = opacity;
			this.material_front_text.needsUpdate = true;
			this.frontWatermarkGroup.traverse((child) => {
				if (child.isMesh && child.material) {
					child.material.opacity = opacity;
					child.material.transparent = true;
				}
			});
		}
		this.renderer.render( this.scene, this.camera );
	}
	fadeOut(progress){
		let delay_progress = this.fadeOutDelayBase / this.animationSpeed / this.animationDuration;
		if(progress >= 1) {
			if( this.canvasObj.isRecording && this.timer_delaySaveVideo === null ) {
				this.canvasObj.saveCanvasAsVideo(); 
			} 
			this.initAnimate();
		} else if(progress > delay_progress){
			let opacity = (1 - progress)  / (1 - delay_progress);
			this.mesh_front.material.opacity = opacity;
			this.mesh_front.material.needsUpdate = true;
			this.material_front_text.opacity = 1 - (progress - delay_progress)  / (1 - delay_progress);
			this.material_front_text.needsUpdate = true;
			this.frontWatermarkGroup.traverse((child) => {
				if (child.isMesh && child.material) {
					child.material.opacity = 1 - (progress - delay_progress)  / (1 - delay_progress);
					child.material.transparent = true;
				}
			});
		}
		this.renderer.render( this.scene, this.camera );
	}
    checkWatermarkPosition(position, label){
    	super.checkWatermarkPosition(position, label);
    }
    renderControl(){
		super.renderControl();
		const [speed_section] = this.renderSelectSection('animation-speed', 'Speed', { options: this.options.animationSpeedOptions });
		const [front_color_section] = this.renderSelectSection('shape-front-color', 'Color (front)', { options: this.options.colorOptions });
		const [back_color_section] = this.renderSelectSection('shape-back-color', 'Color (back)', { options: this.options.colorOptions });
		this.control.appendChild(speed_section);
		this.control.appendChild(front_color_section);
		if(this.options.colorOptions['upload']) {
			let prefix = 'front';
			const [section] = this.renderMediaSection(prefix + '-background-image', '', ['shape-image-section'])
			this.control.appendChild(section);
		}
		this.control.appendChild(back_color_section);
		if(this.options.colorOptions['upload']) {
			let prefix = 'back';
			const [section] = this.renderMediaSection(prefix + '-background-image', '', ['shape-image-section'])
			this.control.appendChild(section);
		}
		this.fields['shape-back-color'].selectedIndex = 1;
		this.control.appendChild(this.renderTextSection('text-front', 'Main Text (front)'));
		this.control.appendChild(this.renderTextSection('text-back', 'Main Text (back)'));
		this.control.appendChild(super.renderAddWaterMark());
		this.control.appendChild(super.renderAddMedia());
		this.control_wrapper.appendChild(this.control);
	}
    addListeners(){
		if(this.fields['shape']) {
			this.fields['shape'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				
				let shape_name = e.target.value;
				if(this.options.shapeOptions[shape_name]['shape']['type'] == 'static'){
					this.updateShape(shapeOptions[shape_name]['shape'], isSilent);
				}
				else if(this.options.shapeOptions[shape_name]['shape']['type'] == 'animation')
				{
					console.log('threejs doesnt support this option');
				}
			}.bind(this);
		}
		
		if(this.fields['text-front']) {
			this.fields['text-front'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				this.updateFrontText(e.target.value, isSilent);
			}.bind(this);
		}
	    if(this.fields['text-front-font']) {
			this.fields['text-front-font'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				this.updateFrontFont(e.target.value, isSilent);
			}.bind(this);
		}
		if(this.fields['text-back-font']) {
			this.fields['text-back-font'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				this.updateBackFont(e.target.value, isSilent);
			}.bind(this);
		}

	    let sText_front_typography = this.control.querySelector('.field-id-text-front-typography');
	    sText_front_typography.onchange = function(e){
			let isSilent = e && e.detail ? e.detail.isSilent : false;
	        this.updateFrontTypography(e.target.value, isSilent);
	    }.bind(this);

	    let sText_front_color = this.control.querySelector('.field-id-text-front-color');
	    sText_front_color.onchange = function(e){
			let isSilent = e && e.detail ? e.detail.isSilent : false;
			let text_color = this.options.textColorOptions[e.target.value]['color'];
	        this.updateFrontTextColor(text_color, isSilent);
	    }.bind(this);
		let sText_back_color = this.control.querySelector('.field-id-text-back-color');
	    sText_back_color.onchange = function(e){
			let isSilent = e && e.detail ? e.detail.isSilent : false;
	        let text_color = this.options.textColorOptions[e.target.value]['color'];
	        this.updateBackTextColor(text_color, isSilent);
	    }.bind(this);

		if(this.fields['text-front-shift-x']) {	
			this.fields['text-front-shift-x'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				this.updateFrontTextShiftX(parseInt(e.target.value), isSilent);
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
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				this.updateFrontTextShiftY(parseInt(e.target.value), isSilent);
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
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				this.updateBackTextShiftX(parseInt(e.target.value), isSilent);
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
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				this.updateBackTextShiftY(parseInt(e.target.value), isSilent);
			}.bind(this);
			this.fields['text-back-shift-y'].onkeydown = e => this.updatePositionByKey(e, {x: this.fields['text-back-shift-x'], y:this.fields['text-back-shift-y']}, (shift)=>{
				this.updateBackTextShiftX(shift.x);
				this.updateBackTextShiftY(shift.y);
			});
			this.fields['text-back-shift-y'].onblur = () => {
				this.unfocusInputs([this.fields['text-back-shift-x'], this.fields['text-back-shift-y']]);
			}
		}
		if(this.fields['shape-shift-x']) {
			this.fields['shape-shift-x'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				this.updateShapeShiftX(parseInt(e.target.value), isSilent);
			}.bind(this);
			this.fields['shape-shift-x'].onkeydown = e => this.updatePositionByKey(e, {x: this.fields['shape-shift-x'], y:this.fields['shape-shift-y']}, (shift)=>{
				this.updateShapeShiftX(shift.x)
				this.updateShapeShiftY(shift.y)
			});
			this.fields['shape-shift-x'].onblur = () => {
				this.unfocusInputs([this.fields['shape-shift-x'], this.fields['shape-shift-y']]);
			}
		}
		if(this.fields['shape-shift-y']) {
			this.fields['shape-shift-y'].onchange = function(e){
				let isSilent = e && e.detail ? e.detail.isSilent : false;
				this.updateShapeShiftY(parseInt(e.target.value), isSilent);
			}.bind(this);
			this.fields['shape-shift-y'].onkeydown = e => this.updatePositionByKey(e, {x: this.fields['shape-shift-x'], y:this.fields['shape-shift-y']}, (shift)=>{
				this.updateShapeShiftX(shift.x)
				this.updateShapeShiftY(shift.y)
			});
			this.fields['shape-shift-y'].onblur = () => {
				this.unfocusInputs([this.fields['shape-shift-x'], this.fields['shape-shift-y']]);
			}
		}

	    let sText_back = this.control.querySelector('.field-id-text-back');
	    this.fields['text-back'] = sText_back;
	    sText_back.onchange = function(e){
			let isSilent = e && e.detail ? e.detail.isSilent : false;
			this.updateBackText(e.target.value, isSilent);
	    }.bind(this);

	    let sText_back_typography = this.control.querySelector('.field-id-text-back-typography');
		
	    sText_back_typography.onchange = function(e){
			let isSilent = e && e.detail ? e.detail.isSilent : false;
			this.updateBackTypography(e.target.value, isSilent);
	    }.bind(this);

	    

	    // let sShape_front_color = this.control.querySelector('.field-id-shape-front-color');
		// console.log(this.control);
	    this.fields['shape-front-color'].onchange = function(e){
			// let sec = e.target.parentNode.parentNode;
	        let shape_color = e.target.value;
			if(shape_color === 'upload') {
				this.updateFrontColor('upload');
			}
	        else {
				// sec.classList.remove('viewing-shape-image-section');
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

	    this.fields['shape-back-color'].onchange = function(e){
	        let sec = e.target.parentNode.parentNode;
	        let shape_color = e.target.value;
			if(shape_color === 'upload') {
				sec.classList.add('viewing-shape-image-section');
				this.updateBackColor('upload');
			}
	        else {
				sec.classList.remove('viewing-shape-image-section');
				if( this.options.colorOptions[shape_color]['color']['type'] == 'solid' || 
					this.options.colorOptions[shape_color]['color']['type'] == 'gradient' ||
					this.options.colorOptions[shape_color]['color']['type'] == 'special')
				{
					this.updateBackColor(this.options.colorOptions[shape_color]['color']);
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
			let isSilent = e && e.detail ? e.detail.isSilent : false;
			let isSyncing = e && e.detail ? e.detail.isSyncing : false;
	        if(!document.body.classList.contains('recording'))
	        {
	            this.animation_selectedIndex = e.target.selectedIndex;
	            this.updateAnimation(e.target.value, isSyncing, isSilent);
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


		let sAnimation_speed = this.control.querySelector('.field-id-animation-speed');
		if(sAnimation_speed) {
			this.fields['animation_speed'] = sAnimation_speed;
			sAnimation_speed.onchange = function(e){
				this.updateAnimationSpeed(e.target.value);  
			}.bind(this);
		}
		// for(let key in this.fields.media) {
		// 	this.addMediaListener(key);
		// }
	}
	// addMediaListener(key){
	// 	if(!key || !this.media[key]) return;
	// 	let input = this.fields.media[key];
	// 	if(!input) console.error('media field doesnt exist: ', key);
	// 	input.onclick = function (e) {
	// 		e.target.value = null;
	// 	}.bind(this);
	// 	input.onchange = function(e){
	// 		this.readImageUploaded(e, (key, image)=>{
	// 			this.updateMedia(key, {obj: image})
	// 		});
	// 	}.bind(this);
	// 	input.addEventListener('applySavedFile', (e)=>{
			
	// 		let idx = input.getAttribute('image-idx');
	// 		let src = input.getAttribute('data-file-src');
	// 		this.readImage(idx, src, (idx, image)=>{
	// 			input.classList.add('not-empty');
	// 			this.updateMedia(idx, { obj: image});
	// 		});
	// 	});
	// 	let scale_input = input.parentNode.parentNode.querySelector('.img-control-scale');
	// 	if(scale_input) {
	// 		scale_input.oninput = function(e){
	// 			let isSilent = e && e.detail ? e.detail.isSilent : false;
	// 			e.preventDefault();
	// 			// let scale = e.target.value >= 1 ? e.target.value : 1;
	// 			let scale = e.target.value;
	// 			this.updateMediaScale(scale, key, isSilent);
	// 		}.bind(this);
	// 	}	
	// 	let shift_x_input = input.parentNode.parentNode.querySelector('.img-control-shift-x');
	// 	let shift_y_input = input.parentNode.parentNode.querySelector('.img-control-shift-y');
	// 	if(shift_x_input) {
	// 		shift_x_input.oninput = function(e){
	// 			let isSilent = e && e.detail ? e.detail.isSilent : false;
	// 			this.updateMediaPositionX(e.target.value, key, isSilent);
	// 		}.bind(this);
	// 		shift_x_input.onkeydown = e => this.updatePositionByKey(e, {x: shift_x_input, y:shift_y_input}, (shift)=>{
	// 			let isSilent = e && e.detail ? e.detail.isSilent : false;
	// 			this.updateMediaPositionX(shift.x, key, isSilent)
	// 			this.updateMediaPositionY(shift.y, key, isSilent)
	// 		});
	// 	}
	// 	if(shift_y_input) {
	// 		shift_y_input.oninput = function(e){
	// 			let isSilent = e && e.detail ? e.detail.isSilent : false;
	// 			this.updateMediaPositionY(e.target.value, key, isSilent);
	// 		}.bind(this);
	// 		shift_y_input.onkeydown = e => this.updatePositionByKey(e, {x: shift_x_input, y:shift_y_input}, (shift)=>{
	// 			let isSilent = e && e.detail ? e.detail.isSilent : false;
	// 			this.updateMediaPositionX(shift.x, key, isSilent)
	// 			this.updateMediaPositionY(shift.y, key, isSilent)
	// 		});
	// 	}
	// 	let blend_mode_input = input.parentNode.parentNode.querySelector('.img-control-blend-mode');
	// 	if(blend_mode_input) {
	// 		blend_mode_input.onchange = function(e){
	// 			let isSilent = e && e.detail ? e.detail.isSilent : false;
	// 			this.updateMediaBlendMode(e.target.value, key, isSilent);
	// 		}.bind(this);
	// 	}
	// }
    updateFrame(frame=null, silent = false)
    {
		silent = false;
		this.updateCanvasSize();
		frame = frame ? frame : this.generateFrame();
    	super.updateFrame(frame);
		if(this.group) {
			this.group.remove(this.group_front);
			this.group.remove(this.group_back);
			this.scene.remove(this.group);
			this.group = this.createGroup('main-group');
			this.setGroupPosition();
		}
    	if(!silent) this.canvasObj.draw();
    }
	setGroupPosition(){
		this.group.position.x = getValueByPixelRatio(this.shapeShiftX);
		if(Object.keys(this.canvasObj.shapes).length === 1) {
			// this.group.position.y = getValueByPixelRatio(-this.shapeShiftY * this.scale.y);
			this.group.position.y = getValueByPixelRatio(-this.shapeShiftY);
		} else {
			// this.group.position.y = getValueByPixelRatio(-this.shapeShiftY + this.frame.y * this.scale.y);
			this.group.position.y = getValueByPixelRatio(-this.shapeShiftY + this.frame.y);
		}
	}
	generateShapeCenter(){
		let output = {x: 0, y: 0};
		let shape_num = Object.keys(this.canvasObj.shapes).length;
		
		if(shape_num === 1) {
			return output;
		} else if(shape_num === 2) {
			let canvas_h = this.canvasObj.canvas.height;
			output.y = this.shape_index == 0 ? getValueByPixelRatio(canvas_h / 4 + this.shapeShiftY) : getValueByPixelRatio(- canvas_h / 4 + this.shapeShiftY);
		}
		
		return output;
	}
	generateFrame(){
		let output = {};
        let unit_w = getValueByPixelRatio(this.canvasObj.canvas.width);
		let unit_h = getValueByPixelRatio(this.canvasObj.canvas.height) / (Object.keys(this.canvasObj.shapes).length || 1);
		// console.log('generateFrame', this.canvasObj.canvas.width, unit_w);
		output.w = unit_w;
		output.h = unit_h;
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
	drawImages(){
		for(let key in this.media) {
			const m = this.media[key];
			// if(m.isShapeColor) continue;
			m.draw();
		}
		// this.context.globalCompositeOperation = 'normal';
	}
	// syncImgs(){
	// 	super.syncImgs();
	// 	if(this.mesh_front.material.map instanceof THREE.Texture && this.media['front-background-image']) {
	// 		let idx = this.fieldCounterparts['front-background-image'];
	// 		this.counterpart.updateMedia(idx, {obj: this.media['front-background-image'].obj});
	// 	}
	// }
	// updateMediaScale(scale, key, isSilent) {
	// 	super.updateMediaScale(scale, key, isSilent);
	// 	const m = this.media[key];
	// 	for(const mesh_key in m.mesh){
	// 		const mesh = m.mesh[mesh_key];
	// 		mesh.geometry.width;
	// 	}
	// }
	async readVideoUploaded(event, cb){
		const file = event.target.files[0];
		const videoURL = URL.createObjectURL(file);

		// Create video element
		const videoElement = document.createElement('video');
		videoElement.className = 'hidden';
		videoElement.src = videoURL;
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
			cb(videoElement);
	}
}


import {
	vec2,
	vec3,
	quad,
	rgba,
	mat4,
	isVec2,
	isVec3,
	isColor,
	isMat4,
} from "./math";

import {
	deepEq,
} from "./utils";

type GfxCtx = {
	vbuf: WebGLBuffer,
	ibuf: WebGLBuffer,
	vqueue: number[],
	iqueue: number[],
	clearColor: Color,
	defProg: GfxProgram,
	curProg: GfxProgram,
	defTex: GfxTexture,
	curTex: GfxTexture,
	bgTex: GfxTexture,
	curUniform: Uniform,
	transform: Mat4,
	transformStack: Mat4[],
	drawCalls: number,
	lastDrawCalls: number,
};

type GfxConf = {
	clearColor?: Color,
	scale?: number,
	texFilter?: TexFilter,
};

type Gfx = {
	width(): number,
	height(): number,
	scale(): number,
	clearColor(): Color,
	makeTex(data: GfxTextureData): GfxTexture,
	makeProgram(vert: string, frag: string): GfxProgram,
	makeFont(
		tex: GfxTexture,
		gw: number,
		gh: number,
		chars: string,
	): GfxFont,
	drawTexture(
		tex: GfxTexture,
		conf?: DrawTextureConf,
	): void,
	drawText(
		txt: string,
		font: GfxFont,
		conf?: DrawTextConf,
	): void,
	drawFmtText(ftext: FormattedText): void,
	fmtText(
		txt: string,
		font: GfxFont,
		conf?: DrawTextConf,
	): FormattedText,
	drawRect(
		pos: Vec2,
		w: number,
		h: number,
		conf?: DrawRectConf,
	): void,
	drawRectStroke(
		pos: Vec2,
		w: number,
		h: number,
		conf?: DrawRectStrokeConf,
	): void,
	drawLine(
		p1: Vec2,
		p2: Vec2,
		conf?: DrawLineConf,
	): void,
	frameStart(): void,
	frameEnd(): void,
	pushTransform(): void,
	popTransform(): void,
	pushMatrix(m: Mat4): void,
	drawCalls(): number,
};

const DEF_ORIGIN = "topleft";
const STRIDE = 9;
const QUEUE_COUNT = 65536;
const BG_GRID_SIZE = 64;

const VERT_TEMPLATE = `
attribute vec3 a_pos;
attribute vec2 a_uv;
attribute vec4 a_color;

varying vec3 v_pos;
varying vec2 v_uv;
varying vec4 v_color;

vec4 def_vert() {
	return vec4(a_pos, 1.0);
}

{{user}}

void main() {
	vec4 pos = vert(a_pos, a_uv, a_color);
	v_pos = a_pos;
	v_uv = a_uv;
	v_color = a_color;
	gl_Position = pos;
}
`;

const FRAG_TEMPLATE = `
precision mediump float;

varying vec3 v_pos;
varying vec2 v_uv;
varying vec4 v_color;

uniform sampler2D u_tex;

vec4 def_frag() {
	return v_color * texture2D(u_tex, v_uv);
}

{{user}}

void main() {
	gl_FragColor = frag(v_pos, v_uv, v_color, u_tex);
	if (gl_FragColor.a == 0.0) {
		discard;
	}
}
`;

const DEF_VERT = `
vec4 vert(vec3 pos, vec2 uv, vec4 color) {
	return def_vert();
}
`;

const DEF_FRAG = `
vec4 frag(vec3 pos, vec2 uv, vec4 color, sampler2D tex) {
	return def_frag();
}
`;

function originPt(orig: Origin | Vec2): Vec2 {
	switch (orig) {
		case "topleft": return vec2(-1, -1);
		case "top": return vec2(0, -1);
		case "topright": return vec2(1, -1);
		case "left": return vec2(-1, 0);
		case "center": return vec2(0, 0);
		case "right": return vec2(1, 0);
		case "botleft": return vec2(-1, 1);
		case "bot": return vec2(0, 1);
		case "botright": return vec2(1, 1);
		default: return orig;
	}
}

function gfxInit(gl: WebGLRenderingContext, gconf: GfxConf): Gfx {

	const texFilter = (() => {
		switch (gconf.texFilter) {
			case "linear": return gl.LINEAR;
			case "nearest": return gl.NEAREST;
			default: return gl.NEAREST;
		}
	})();

	const gfx: GfxCtx = (() => {

		const defProg = makeProgram(DEF_VERT, DEF_FRAG);
		const emptyTex = makeTex(
			new ImageData(new Uint8ClampedArray([ 255, 255, 255, 255, ]), 1, 1)
		);

		const c = gconf.clearColor ?? rgba(0, 0, 0, 1);

		gl.clearColor(c.r, c.g, c.b, c.a);
		gl.enable(gl.BLEND);
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

		const vbuf = gl.createBuffer();

		gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
		gl.bufferData(gl.ARRAY_BUFFER, QUEUE_COUNT * 4, gl.DYNAMIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		const ibuf = gl.createBuffer();

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, QUEUE_COUNT * 2, gl.DYNAMIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

		const bgTex = makeTex(
			new ImageData(new Uint8ClampedArray([
				128, 128, 128, 255,
				190, 190, 190, 255,
				190, 190, 190, 255,
				128, 128, 128, 255,
			]), 2, 2)
		);

		return {
			drawCalls: 0,
			lastDrawCalls: 0,
			defProg: defProg,
			curProg: defProg,
			defTex: emptyTex,
			curTex: emptyTex,
			curUniform: {},
			vbuf: vbuf,
			ibuf: ibuf,
			vqueue: [],
			iqueue: [],
			transform: mat4(),
			transformStack: [],
			clearColor: c,
			bgTex: bgTex,
		};

	})();

	frameStart();
	frameEnd();

	function powerOfTwo(n) {
		return (Math.log(n) / Math.log(2)) % 1 === 0;
	}

	function makeTex(data: GfxTextureData): GfxTexture {

		const id = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, id);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texFilter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, texFilter);

		const wrap = (() => {
			if (powerOfTwo(data.width) && powerOfTwo(data.height)) {
				return gl.REPEAT;
			} else {
				return gl.CLAMP_TO_EDGE;
			}
		})();

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
		gl.bindTexture(gl.TEXTURE_2D, null);

		return {
			width: data.width,
			height: data.height,
			bind() {
				gl.bindTexture(gl.TEXTURE_2D, id);
			},
			unbind() {
				gl.bindTexture(gl.TEXTURE_2D, null);
			},
		};

	}

	function makeProgram(
		vertSrc: string | null = DEF_VERT,
		fragSrc: string | null = DEF_FRAG,
	): GfxProgram {

		let msg;
		const vcode = VERT_TEMPLATE.replace("{{user}}", vertSrc ?? DEF_VERT);
		const fcode = FRAG_TEMPLATE.replace("{{user}}", fragSrc ?? DEF_FRAG);
		const vertShader = gl.createShader(gl.VERTEX_SHADER);
		const fragShader = gl.createShader(gl.FRAGMENT_SHADER);

		gl.shaderSource(vertShader, vcode);
		gl.shaderSource(fragShader, fcode);
		gl.compileShader(vertShader);
		gl.compileShader(fragShader);

		if ((msg = gl.getShaderInfoLog(vertShader))) {
			throw new Error(msg);
		}

		if ((msg = gl.getShaderInfoLog(fragShader))) {
			throw new Error(msg);
		}

		const id = gl.createProgram();

		gl.attachShader(id, vertShader);
		gl.attachShader(id, fragShader);

		gl.bindAttribLocation(id, 0, "a_pos");
		gl.bindAttribLocation(id, 1, "a_uv");
		gl.bindAttribLocation(id, 2, "a_color");

		gl.linkProgram(id);

		if ((msg = gl.getProgramInfoLog(id))) {
			// for some reason on safari it always has a "\n" msg
			if (msg !== "\n") {
				throw new Error(msg);
			}
		}

		return {

			bind() {
				gl.useProgram(id);
			},

			unbind() {
				gl.useProgram(null);
			},

			bindAttribs() {
				gl.vertexAttribPointer(0, 3, gl.FLOAT, false, STRIDE * 4, 0);
				gl.enableVertexAttribArray(0);
				gl.vertexAttribPointer(1, 2, gl.FLOAT, false, STRIDE * 4, 12);
				gl.enableVertexAttribArray(1);
				gl.vertexAttribPointer(2, 4, gl.FLOAT, false, STRIDE * 4, 20);
				gl.enableVertexAttribArray(2);
			},

			send(uniform: Uniform) {
				this.bind();
				// TODO: slow for vec2
				for (const name in uniform) {
					const val = uniform[name];
					const loc = gl.getUniformLocation(id, name);
					if (typeof val === "number") {
						gl.uniform1f(loc, val);
					} else if (isMat4(val)) {
						// @ts-ignore
						gl.uniformMatrix4fv(loc, false, new Float32Array(val.m));
					} else if (isColor(val)) {
						// @ts-ignore
						gl.uniform4f(loc, val.r, val.g, val.b, val.a);
					} else if (isVec3(val)) {
						// @ts-ignore
						gl.uniform3f(loc, val.x, val.y, val.z);
					} else if (isVec2(val)) {
						// @ts-ignore
						gl.uniform2f(loc, val.x, val.y);
					}
				}
				this.unbind();
			},

		};

	}

	function makeFont(
		tex: GfxTexture,
		gw: number,
		gh: number,
		chars: string,
	): GfxFont {

		const cols = tex.width / gw;
		const rows = tex.height / gh;
		const qw = 1.0 / cols;
		const qh = 1.0 / rows;
		const map: Record<string, Vec2> = {};
		const charMap = chars.split("").entries();

		for (const [i, ch] of charMap) {
			map[ch] = vec2(
				(i % cols) * qw,
				Math.floor(i / cols) * qh,
			);
		}

		return {
			tex: tex,
			map: map,
			qw: qw,
			qh: qh,
		};

	}

	// TODO: expose
	function drawRaw(
		verts: Vertex[],
		indices: number[],
		tex: GfxTexture = gfx.defTex,
		prog: GfxProgram = gfx.defProg,
		uniform: Uniform = {},
	) {

		tex = tex ?? gfx.defTex;
		prog = prog ?? gfx.defProg;

		// flush on texture / shader change and overflow
		if (
			tex !== gfx.curTex
			|| prog !== gfx.curProg
			|| !deepEq(gfx.curUniform, uniform)
			|| gfx.vqueue.length + verts.length * STRIDE > QUEUE_COUNT
			|| gfx.iqueue.length + indices.length > QUEUE_COUNT
		) {
			flush();
		}

		gfx.curTex = tex;
		gfx.curProg = prog;
		gfx.curUniform = uniform;

		const nIndices = indices
			.map((i) => {
				return i + gfx.vqueue.length / STRIDE;
			});

		const nVerts = verts
			.map((v) => {
				const pt = toNDC(gfx.transform.multVec2(v.pos.xy()));
				return [
					pt.x, pt.y, v.pos.z,
					v.uv.x, v.uv.y,
					v.color.r, v.color.g, v.color.b, v.color.a
				];
			})
			.flat();

		nIndices.forEach((i) => gfx.iqueue.push(i));
		nVerts.forEach((v) => gfx.vqueue.push(v));

	}

	function flush() {

		if (
			!gfx.curTex
			|| !gfx.curProg
			|| gfx.vqueue.length === 0
			|| gfx.iqueue.length === 0
		) {
			return;
		}

		gfx.curProg.send(gfx.curUniform);

		gl.bindBuffer(gl.ARRAY_BUFFER, gfx.vbuf);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(gfx.vqueue));
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gfx.ibuf);
		gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, new Uint16Array(gfx.iqueue));
		gfx.curProg.bind();
		gfx.curProg.bindAttribs();
		gfx.curTex.bind();
		gl.drawElements(gl.TRIANGLES, gfx.iqueue.length, gl.UNSIGNED_SHORT, 0);
		gfx.curTex.unbind();
		gfx.curProg.unbind();
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

		gfx.iqueue = [];
		gfx.vqueue = [];

		gfx.drawCalls++;

	}

	function frameStart() {

		gl.clear(gl.COLOR_BUFFER_BIT);

		if (!gconf.clearColor) {
			drawQuad({
				width: width(),
				height: height(),
				quad: quad(
					0,
					0,
					width() * scale() / BG_GRID_SIZE,
					height() * scale() / BG_GRID_SIZE,
				),
				tex: gfx.bgTex,
			})
		}

		gfx.drawCalls = 0;
		gfx.transformStack = [];
		gfx.transform = mat4();

	}

	function frameEnd() {
		flush();
		gfx.lastDrawCalls = gfx.drawCalls;
	}

	function drawCalls() {
		return gfx.lastDrawCalls;
	}

	function toNDC(pt: Vec2): Vec2 {
		return vec2(
			pt.x / width() * 2 - 1,
			-pt.y / height() * 2 + 1,
		);
	}

	// TODO: don't use push as prefix for these
	function pushMatrix(m: Mat4) {
		gfx.transform = m.clone();
	}

	function pushTranslate(p: Vec2) {
		if (!p || (p.x === 0 && p.y === 0)) {
			return;
		}
		gfx.transform = gfx.transform.translate(p);
	}

	function pushScale(p: Vec2) {
		if (!p || (p.x === 1 && p.y === 1)) {
			return;
		}
		gfx.transform = gfx.transform.scale(p);
	}

	function pushRotateX(a: number) {
		if (!a) {
			return;
		}
		gfx.transform = gfx.transform.rotateX(a);
	}

	function pushRotateY(a: number) {
		if (!a) {
			return;
		}
		gfx.transform = gfx.transform.rotateY(a);
	}

	function pushRotateZ(a: number) {
		if (!a) {
			return;
		}
		gfx.transform = gfx.transform.rotateZ(a);
	}

	function pushTransform() {
		gfx.transformStack.push(gfx.transform.clone());
	}

	function popTransform() {
		if (gfx.transformStack.length > 0) {
			gfx.transform = gfx.transformStack.pop();
		}
	}

	// TODO: clean
	// draw a textured quad
	function drawQuad(conf: DrawQuadConf = {}) {

		const w = conf.width || 0;
		const h = conf.height || 0;
		const pos = conf.pos || vec2(0, 0);
		const origin = originPt(conf.origin || DEF_ORIGIN);
		const offset = origin.scale(vec2(w, h).scale(-0.5));
		const scale = vec2(conf.scale ?? 1);
		const rot = conf.rot || 0;
		const q = conf.quad || quad(0, 0, 1, 1);
		const z = 1 - (conf.z ?? 0);
		const color = conf.color || rgba(1, 1, 1, 1);

		pushTransform();
		pushTranslate(pos);
		pushScale(scale);
		pushRotateZ(rot);
		pushTranslate(offset);

		drawRaw([
			{
				pos: vec3(-w / 2, h / 2, z),
				uv: vec2(q.x, q.y + q.h),
				color: color,
			},
			{
				pos: vec3(-w / 2, -h / 2, z),
				uv: vec2(q.x, q.y),
				color: color,
			},
			{
				pos: vec3(w / 2, -h / 2, z),
				uv: vec2(q.x + q.w, q.y),
				color: color,
			},
			{
				pos: vec3(w / 2, h / 2, z),
				uv: vec2(q.x + q.w, q.y + q.h),
				color: color,
			},
		], [0, 1, 3, 1, 2, 3], conf.tex, conf.prog, conf.uniform);

		popTransform();

	}

	function drawTexture(
		tex: GfxTexture,
		conf: DrawTextureConf = {},
	) {

		const q = conf.quad ?? quad(0, 0, 1, 1);
		const w = tex.width * q.w;
		const h = tex.height * q.h;

		drawQuad({
			...conf,
			tex: tex,
			quad: q,
			width: w,
			height: h,
		});

	}

	function drawRect(
		pos: Vec2,
		w: number,
		h: number,
		conf: DrawRectConf = {}
	) {
		drawQuad({
			...conf,
			pos: pos,
			width: w,
			height: h,
		});
	}

	function drawRectStroke(
		pos: Vec2,
		w: number,
		h: number,
		conf: DrawRectStrokeConf = {}
	) {

		const offset = originPt(conf.origin || DEF_ORIGIN).scale(vec2(w, h)).scale(0.5);
		const p1 = pos.add(vec2(-w / 2, -h / 2)).sub(offset);
		const p2 = pos.add(vec2(-w / 2,  h / 2)).sub(offset);
		const p3 = pos.add(vec2( w / 2,  h / 2)).sub(offset);
		const p4 = pos.add(vec2( w / 2, -h / 2)).sub(offset);

		drawLine(p1, p2, conf);
		drawLine(p2, p3, conf);
		drawLine(p3, p4, conf);
		drawLine(p4, p1, conf);

	}

	function drawLine(
		p1: Vec2,
		p2: Vec2,
		conf: DrawLineConf = {},
	) {

		const w = conf.width || 1;
		const h = p1.dist(p2);
		const rot = Math.PI / 2 - p1.angle(p2);

		drawQuad({
			...conf,
			pos: p1.add(p2).scale(0.5),
			width: w,
			height: h,
			rot: rot,
			origin: "center",
		});

	}

	// format text and return a list of chars with their calculated position
	function fmtText(
		text: string,
		font: GfxFont,
		conf: DrawTextConf = {}
	): FormattedText {

		const chars = (text + "").split("");
		const gw = font.qw * font.tex.width;
		const gh = font.qh * font.tex.height;
		const size = conf.size || gh;
		const scale = vec2(size / gh).scale(vec2(conf.scale || 1));
		const cw = scale.x * gw;
		const ch = scale.y * gh;
		let curX = 0;
		let th = ch;
		let tw = 0;
		const flines = [[]];

		// check new lines and calc area size
		for (const char of chars) {
			// go new line if \n or exceeds wrap value
			if (char === "\n" || (conf.width ? (curX + cw > conf.width) : false)) {
				th += ch;
				curX = 0;
				flines.push([]);
			}
			if (char !== "\n") {
				flines[flines.length - 1].push(char);
				curX += cw;
			}
			tw = Math.max(tw, curX);
		}

		if (conf.width) {
			tw = conf.width;
		}

		// whole text offset
		const fchars = [];
		const pos = vec2(conf.pos || 0);
		const offset = originPt(conf.origin || DEF_ORIGIN).scale(0.5);
		// this math is complicated i forgot how it works instantly
		const ox = -offset.x * cw - (offset.x + 0.5) * (tw - cw);
		const oy = -offset.y * ch - (offset.y + 0.5) * (th - ch);

		flines.forEach((line, ln) => {

			// line offset
			const oxl = (tw - line.length * cw) * (offset.x + 0.5);

			line.forEach((char, cn) => {
				const qpos = font.map[char];
				const x = cn * cw;
				const y = ln * ch;
				if (qpos) {
					fchars.push({
						tex: font.tex,
						quad: quad(qpos.x, qpos.y, font.qw, font.qh),
						ch: char,
						pos: vec2(pos.x + x + ox + oxl, pos.y + y + oy),
						color: conf.color,
						origin: conf.origin,
						scale: scale,
						z: conf.z,
					});
				}
			});
		});

		return {
			width: tw,
			height: th,
			chars: fchars,
		};

	}

	function drawText(
		txt: string,
		font: GfxFont,
		conf = {},
	) {
		drawFmtText(fmtText(txt, font, conf));
	}

	// TODO: rotation
	function drawFmtText(ftext: FormattedText) {
		for (const ch of ftext.chars) {
			drawQuad({
				tex: ch.tex,
				width: ch.tex.width * ch.quad.w,
				height: ch.tex.height * ch.quad.h,
				pos: ch.pos,
				scale: ch.scale,
				color: ch.color,
				quad: ch.quad,
				// TODO: topleft
				origin: "center",
				z: ch.z,
			});
		}
	}

	// get current canvas width
	function width(): number {
		return gl.drawingBufferWidth / scale();
	}

	// get current canvas height
	function height(): number {
		return gl.drawingBufferHeight / scale();
	}

	function scale(): number {
		return gconf.scale ?? 1;
	}

	function clearColor(): Color {
		return gfx.clearColor.clone();
	}

	// TODO: type this
	return {
		width,
		height,
		scale,
		makeTex,
		makeProgram,
		makeFont,
		drawTexture,
		drawText,
		drawFmtText,
		drawRect,
		drawRectStroke,
		drawLine,
		fmtText,
		frameStart,
		frameEnd,
		pushTransform,
		popTransform,
		pushMatrix,
		drawCalls,
		clearColor,
	};

}

export {
	Gfx,
	originPt,
	gfxInit,
};

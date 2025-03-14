declare function kaboom(conf?: KaboomConf): KaboomCtx;

type KaboomCtx = {
	// assets
	loadRoot(path?: string): string,
	loadSprite(
		id: string,
		src: SpriteLoadSrc,
		conf?: SpriteLoadConf,
	): Promise<SpriteData>,
	loadSound(
		id: string,
		src: string,
	): Promise<SoundData>,
	loadFont(
		id: string,
		src: string,
		gw: number,
		gh: number,
		chars?: string,
	): Promise<FontData>,
	loadShader(
		name: string,
		vert?: string,
		frag?: string,
		isUrl?: boolean,
	): Promise<ShaderData>,
	addLoader<T>(l: Promise<T>): void,
	// game
	start(scene: string, ...args): void,
	scene(name: string, cb: (...args) => void): void,
	go(name: string, ...args): void,
	width(): number,
	height(): number,
	dt(): number,
	time(): number,
	screenshot(): string,
	focused(): boolean,
	focus(): void,
	// scene / obj
	add(comps: Comp[]): GameObj,
	readd(obj: GameObj): GameObj,
	destroy(obj: GameObj): void,
	destroyAll(tag: string): void,
	get(tag?: string): GameObj[],
	every(t: string, f: (obj: GameObj) => void): void,
	every(f: (obj: GameObj) => void): void,
	revery(t: string, f: (obj: GameObj) => void): void,
	revery(f: (obj: GameObj) => void): void,
	layers(list: string[], def?: string): void,
	on(event: string, tag: string, cb: (obj: GameObj) => void): void,
	action(tag: string, cb: (obj: GameObj) => void): void,
	action(cb: () => void): void,
	render(tag: string, cb: (obj: GameObj) => void): void,
	render(cb: () => void): void,
	collides(
		t1: string,
		t2: string,
		f: (a: GameObj, b: GameObj) => void,
	): void,
	overlaps(
		t1: string,
		t2: string,
		f: (a: GameObj, b: GameObj) => void,
	): void,
	clicks(
		tag: string,
		f: (a: GameObj) => void,
	): void,
	camPos(p: Vec2): Vec2,
	camScale(p: Vec2): Vec2,
	camRot(a: number): number,
	camShake(n: number): void,
	camIgnore(layers: string[]): void,
	gravity(g: number): number,
	defComp(id: CompID, requires: CompID[], builder: CompBuilder): CompBuilder,
	sceneData(): any,
	// net
	sync(obj: GameObj): void,
	recv(ty: string, handler: MsgHandler): void,
	send(ty: string, data: any): void,
	// comps
	pos(x: number, y: number): PosComp,
	pos(xy: number): PosComp,
	pos(p: Vec2): PosComp,
	pos(): PosComp,
	scale(x: number, y: number): ScaleComp,
	scale(xy: number): ScaleComp,
	scale(p: Vec2): ScaleComp,
	scale(): ScaleComp,
	rotate(a: number): RotateComp,
	color(r: number, g: number, b: number, a?: number): ColorComp,
	color(c: Color): ColorComp,
	color(): ColorComp,
	origin(o: Origin | Vec2): OriginComp,
	layer(l: string): LayerComp,
	area(p1: Vec2, p2: Vec2): AreaComp,
	sprite(id: string, conf?: SpriteCompConf): SpriteComp,
	text(t: string, size?: number, conf?: TextCompConf): TextComp,
	rect(w: number, h: number, conf?: RectCompConf): RectComp,
	solid(): SolidComp,
	body(conf?: BodyCompConf): BodyComp,
	shader(id: string): ShaderComp,
	// inputs
	cursor(c?: string): void,
	mousePos(layer?: string): Vec2,
	keyDown(k: string, f: () => void): void,
	keyPress(k: string, f: () => void): void,
	keyPressRep(k: string, f: () => void): void,
	keyRelease(k: string, f: () => void): void,
	charInput(f: (ch: string) => void): void,
	mouseDown(f: () => void): void,
	mouseClick(f: () => void): void,
	mouseRelease(f: () => void): void,
	keyIsDown(k: string): boolean,
	keyIsPressed(k: string): boolean,
	keyIsPressedRep(k: string): boolean,
	keyIsReleased(k: string): boolean,
	mouseIsDown(): boolean,
	mouseIsClicked(): boolean,
	mouseIsReleased(): boolean,
	loop(t: number, f: () => void): void,
	wait(t: number, f?: () => void): Promise<void>,
	// audio
	play(id: string, conf?: AudioPlayConf): AudioPlay,
	volume(v?: number): number,
	// math
	makeRng(seed: number): RNG,
	rand(): number,
	rand<T extends RNGValue>(n: T): T,
	rand<T extends RNGValue>(a: T, b: T): T,
	randSeed(seed: number): number,
	vec2(x: number, y: number): Vec2,
	vec2(p: Vec2): Vec2,
	vec2(xy: number): Vec2,
	vec2(): Vec2,
	rgb(r: number, g: number, b: number): Color,
	rgba(r: number, g: number, b: number, a: number): Color,
	quad(x: number, y: number, w: number, h: number): Quad,
	choose<T>(lst: T[]): T,
	chance(p: number): boolean,
	lerp(from: number, to: number, t: number): number,
	map(
		v: number,
		l1: number,
		h1: number,
		l2: number,
		h2: number,
	): number,
	mapc(
		v: number,
		l1: number,
		h1: number,
		l2: number,
		h2: number,
	): number,
	wave(lo: number, hi: number, t: number): number,
	deg2rad(deg: number): number,
	rad2deg(rad: number): number,
	// draw
	drawSprite(id: string | SpriteData, conf?: DrawSpriteConf): void,
	// TODO: conf type
	drawText(txt: string, conf?: {}): void,
	drawRect(pos: Vec2, w: number, h: number, conf?: DrawRectConf): void,
	drawRectStroke(pos: Vec2, w: number, h: number, conf?: DrawRectStrokeConf): void,
	drawLine(p1: Vec2, p2: Vec2, conf?: DrawLineConf): void,
	// dbg
	debug: Debug,
	// helpers
	addLevel(map: string[], conf: LevelConf): Level,
};

type KaboomConf = {
	width?: number,
	height?: number,
	scale?: number,
	fullscreen?: boolean,
	debug?: boolean,
	crisp?: boolean,
	canvas?: HTMLCanvasElement,
	root?: HTMLElement,
	clearColor?: number[],
	inspectColor?: number[],
	texFilter?: TexFilter,
	logMax?: number,
	connect?: string,
	global?: boolean,
	plugins?: KaboomPlugin[],
};

type GameObj = {
	hidden: boolean,
	paused: boolean,
	exists(): boolean,
	is(tag: string | string[]): boolean,
	use(comp: Comp): void,
	action(cb: () => void): void,
	on(ev: string, cb: () => void): void,
	trigger(ev: string, ...args): void,
	rmTag(t: string): void,
	_id: GameObjID | null,
	_tags: string[],
	_events: {
		add: (() => void)[],
		update: (() => void)[],
		draw: (() => void)[],
		destroy: (() => void)[],
		inspect: (() => {})[],
	},
	_client: ClientID | null,
	[custom: string]: any,
};

type SpriteAnim = {
	from: number,
	to: number,
};

type KaboomPlugin = (k: KaboomCtx) => Record<string, any>;

type SpriteLoadConf = {
	sliceX?: number,
	sliceY?: number,
	gridWidth?: number,
	gridHeight?: number,
	anims?: Record<string, SpriteAnim>,
};

type SpriteLoadSrc = string | GfxTextureData;

type SpriteData = {
	tex: GfxTexture,
	frames: Quad[],
	anims: Record<string, SpriteAnim>,
};

type SoundData = AudioBuffer;
type FontData = GfxFont;
type ShaderData = GfxProgram;

type AudioPlayConf = {
	loop?: boolean,
	volume?: number,
	speed?: number,
	detune?: number,
	seek?: number,
};

type AudioPlay = {
	play(seek?: number): void,
	stop(): void,
	pause(): void,
	paused(): boolean,
	stopped(): boolean,
	speed(s?: number): number,
	detune(d?: number): number,
	volume(v?: number): number,
	time(): number,
	duration(): number,
	loop(): void,
	unloop(): void,
};

type GfxProgram = {
	bind(): void,
	unbind(): void,
	bindAttribs(): void,
	send(uniform: Uniform): void,
}

type GfxTexture = {
	width: number,
	height: number,
	bind(): void,
	unbind(): void,
};

type GfxTextureData =
	HTMLImageElement
	| HTMLCanvasElement
	| ImageData
	| ImageBitmap
	;

type GfxFont = {
	tex: GfxTexture,
	map: Record<string, Vec2>,
	qw: number,
	qh: number,
};

type Vertex = {
	pos: Vec3,
	uv: Vec2,
	color: Color,
};

type TexFilter = "nearest" | "linear";

type DrawQuadConf = {
	pos?: Vec2,
	width?: number,
	height?: number,
	scale?: Vec2 | number,
	rot?: number,
	color?: Color,
	origin?: Origin | Vec2,
	z?: number,
	tex?: GfxTexture,
	quad?: Quad,
	prog?: GfxProgram,
	uniform?: Uniform,
};

type DrawTextureConf = {
	pos?: Vec2,
	scale?: Vec2 | number,
	rot?: number,
	color?: Color,
	origin?: Origin | Vec2,
	quad?: Quad,
	z?: number,
	prog?: GfxProgram,
	uniform?: Uniform,
};

type DrawRectStrokeConf = {
	width?: number,
	scale?: Vec2 | number,
	rot?: number,
	color?: Color,
	origin?: Origin | Vec2,
	z?: number,
	prog?: GfxProgram,
};

type DrawRectConf = {
	scale?: Vec2 | number,
	rot?: number,
	color?: Color,
	origin?: Origin | Vec2,
	z?: number,
	prog?: GfxProgram,
	uniform?: Uniform,
};

type DrawLineConf = {
	width?: number,
	color?: Color,
	z?: number,
	prog?: GfxProgram,
};

type DrawTextConf = {
	size?: number,
	pos?: Vec2,
	scale?: Vec2 | number,
	rot?: number,
	color?: Color,
	origin?: Origin | Vec2,
	width?: number,
	z?: number,
	prog?: GfxProgram,
};

type FormattedChar = {
	tex: GfxTexture,
	quad: Quad,
	ch: string,
	pos: Vec2,
	scale: Vec2,
	color: Color,
	origin: string,
	z: number,
};

type FormattedText = {
	width: number,
	height: number,
	chars: FormattedChar[],
};

type Origin =
	"topleft"
	| "top"
	| "topright"
	| "left"
	| "center"
	| "right"
	| "botleft"
	| "bot"
	| "botright"
	;

type DrawSpriteConf = {
	frame?: number,
	pos?: Vec2,
	scale?: Vec2 | number,
	rot?: number,
	color?: Color,
	origin?: Origin,
	quad?: Quad,
	prog?: ShaderData,
	uniform?: Uniform,
	z?: number,
};

type Vec2 = {
	x: number,
	y: number,
	clone(): Vec2,
	add(p: Vec2): Vec2,
	sub(p: Vec2): Vec2,
	scale(...args): Vec2,
	dot(p: Vec2): number,
	dist(p: Vec2): number,
	len(): number,
	unit(): Vec2,
	normal(): Vec2,
	angle(p: Vec2): number,
	lerp(p: Vec2, t: number): Vec2,
	toFixed(n: number): Vec2,
	eq(p: Vec2): boolean,
	str(): string,
};

type Vec3 = {
	x: number,
	y: number,
	z: number,
	xy(): Vec2,
};

type Vec4 = {
	x: number,
	y: number,
	z: number,
	w: number,
};

type Mat4 = {
	m: number[],
	clone(): Mat4,
	mult(m: Mat4): Mat4,
	multVec4(m: Vec4): Vec4,
	multVec3(m: Vec3): Vec3,
	multVec2(m: Vec2): Vec2,
	scale(s: Vec2): Mat4,
	translate(p: Vec2): Mat4,
	rotateX(a: number): Mat4,
	rotateY(a: number): Mat4,
	rotateZ(a: number): Mat4,
	invert(): Mat4,
};

type Color = {
	r: number,
	g: number,
	b: number,
	a: number,
	clone(): Color,
	lighten(n: number): Color,
	darken(n: number): Color,
	invert(): Color,
	isDark(p?: number): boolean,
	isLight(p?: number): boolean,
	eq(c: Color): boolean,
};

type Quad = {
	x: number,
	y: number,
	w: number,
	h: number,
	clone(): Quad,
	eq(q: Quad): boolean,
};

type RNGValue =
	number
	| Vec2
	| Color
	;

type RNG = {
	seed: number,
	gen(): number,
	gen<T extends RNGValue>(n: T): T,
	gen<T extends RNGValue>(a: T, b: T): T,
};

type Rect = {
	p1: Vec2,
	p2: Vec2,
};

type Line = {
	p1: Vec2,
	p2: Vec2,
};

type ClientID = number;
type MsgHandler = (id: ClientID, data: any) => void;

type Comp = {
	id?: CompID,
	require?: CompID[],
	add?: AddEvent,
	update?: UpdateEvent,
	draw?: DrawEvent,
	destroy?: DestroyEvent,
	inspect?: InspectEvent,
	[custom: string]: any,
};

type CompBuilder = any;
// TODO: doesn't work
// type CompBuilder = (...args) => Comp;
type GameObjID = number;
type CompID = string;
type AddEvent = () => void;
type DrawEvent = () => void;
type UpdateEvent = () => void;
type DestroyEvent = () => void;
type InspectEvent = () => any;

type PosCompInspect = {
	pos: string,
};

type PosComp = Comp & {
	pos: Vec2,
	move(x: number, y: number): void,
	move(p: Vec2): void,
	screenPos(): Vec2,
	inspect(): PosCompInspect,
};

type ScaleComp = Comp & {
	scale: Vec2,
	flipX(s: number): void,
	flipY(s: number): void,
};

type RotateComp = Comp & {
	angle: number,
};

type ColorComp = Comp & {
	color: Color,
};

type OriginComp = Comp & {
	origin: Origin | Vec2,
};

type LayerCompInspect = {
	layer: string,
};

type LayerComp = Comp & {
	layer: string,
	inspect(): LayerCompInspect,
};

type RectSide =
	"top"
	| "bottom"
	| "left"
	| "right"
	;

type CollisionResolve = {
	obj: GameObj,
	side: RectSide,
}

type AreaComp = Comp & {
	area: Rect,
	areaWidth(): number,
	areaHeight(): number,
	isClicked(): boolean,
	isHovered(): boolean,
	isCollided(o: GameObj): boolean,
	isOverlapped(o: GameObj): boolean,
	clicks(f: () => void): void,
	hovers(f: () => void): void,
	collides(tag: string, f: (o: GameObj) => void): void,
	overlaps(tag: string, f: (o: GameObj) => void): void,
	hasPt(p: Vec2): boolean,
	resolve(): void,
	_worldArea(): Rect;
	_checkCollisions(tag: string, f: (obj: GameObj) => void): void;
	_checkOverlaps(tag: string, f: (obj: GameObj) => void): void;
};

type SpriteCompConf = {
	noArea?: boolean,
	quad?: Quad,
	frame?: number,
	animSpeed?: number,
};

type SpriteCompCurAnim = {
	name: string,
	loop: boolean,
	timer: number,
};

type SpriteComp = Comp & {
	add: AddEvent,
	draw: DrawEvent,
	update: UpdateEvent,
	width: number,
	height: number,
	animSpeed: number,
	frame: number,
	quad: Quad,
	play(anim: string, loop?: boolean): void,
	stop(): void,
	changeSprite(id: string): void,
	numFrames(): number,
	curAnim(): string,
	inspect(): SpriteCompInspect,
};

type SpriteCompInspect = {
	curAnim?: string,
};

type TextComp = Comp & {
	add: AddEvent,
	draw: DrawEvent,
	text: string,
	textSize: number,
	font: string,
	width: number,
	height: number,
};

type TextCompConf = {
	noArea?: boolean,
	font?: string,
	width?: number,
};

type RectComp = Comp & {
	add: AddEvent,
	draw: DrawEvent,
	width: number,
	height: number,
};

type RectCompConf = {
	noArea?: boolean,
};

type LevelConf = {
	width: number,
	height: number,
	pos?: Vec2,
	any(s: string): Comp[] | undefined,
	[sym: string]: any,
//  	[sym: string]: Comp[] | (() => Comp[]),
};

type Level = {
	getPos(p: Vec2): Vec2,
	spawn(sym: string, p: Vec2): GameObj,
	width(): number,
	height(): number,
	gridWidth(): number,
	gridHeight(): number,
	offset(): Vec2,
	destroy(): void,
};

type Debug = {
	paused: boolean,
	inspect: boolean,
	timeScale: number,
	showLog: boolean,
	fps(): number,
	objCount(): number,
	drawCalls(): number,
	stepFrame(): void,
	clearLog(): void,
	log(msg: string): void,
	error(msg: string): void,
};

type UniformValue =
	Vec2
	| Vec3
	| Color
	| Mat4
	;

type Uniform = Record<string, UniformValue>;

type ShaderComp = Comp & {
	uniform: Uniform,
	shader: string,
};

type BodyComp = Comp & {
	update: UpdateEvent,
	jumpForce: number,
	curPlatform(): GameObj | null,
	grounded(): boolean,
	falling(): boolean,
	jump(f: number): void,
};

type BodyCompConf = {
	jumpForce?: number,
	maxVel?: number,
};

type SolidComp = Comp & {
	solid: boolean,
};

type LoopHandle = {
	stop(): void,
};

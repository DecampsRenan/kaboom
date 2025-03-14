### (wip)
- added `loadShader(id, vert, frag, isUrl)`
- added `shader()` comp for attaching custom shader to an obj
- (**BREAK**) added `defComp()` and refactored the component system, making it possible to declare comp dependencies. The old comp definition still works, but will result in error if there're overlapping fields now, thus breakable.
```js
// define a comp with id "drag", and depend on comps with id "pos" and "area"
const drag = defComp("drag", [ "pos", "area", ], () => {
	// normal component definition
	return {
		update() {
			// ...
		},
	};
});

add([
	sprite("mark"),
	// will throw error here since this object doesn't have a pos()
	drag(),
])
```
- added `obj.c()` for getting a specific comp's state (by default all comps' states are mounted to the obj by `Object.defineProperty`)
```js
// both works
obj.play("anim");
obj.c("sprite").play("anim");
```
- (**BREAK**) changed event `headbump` to `headbutt`

### v0.5.1
- added plugins npm package support e.g. `import asepritePlugin from "kaboom/plugins/aseprite"`

# v0.5.0 "Sticky Type"
- platforms are now sticky
- moved to TypeScript
- improved graphics performance
- improved inspect drawing performance
- added on-screen log that catches all kinds of errors
- added `cursor()`
- added `curPlatform()` by `body()`
- added `falling()` by `body()`
- added `changeSprite()` by `sprite()`
- added `duration()` and `time()` for the handle returned by `play()`
- added optional `seek` field to the audio play conf `play([conf])`
- added `LoopHandle` returned by `loop()` that has a `stop()`
- added a default background (can be dismissed by setting `clearColor`)
- fixed `sound.pause()` to work on firefox
- fixed collisions not treating explicit default layer the same as implicit default layer
- fixed unable to play another anim in `onAnimEnd()`
- fixed scene switches happen in the middle of a frame
- fixed `scale(0)` not working
- fixed `mosuePos()` not returning the camera affected pos with no layers
- (**BREAK**) changed `dbg()` to plain `debug` object
- (**BREAK**) moved `fps()`, `objCount()`, `stepFrame()`, `log()`, `error()` under `debug`
- (**BREAK**) removed `debug.logTime`
- (**BREAK**) changed component `debugInfo()` hook to `inspect()`
- (**BREAK**) removed `timer()` component
- (**BREAK**) renamed `removeTag()` to `rmTag()`
- (**BREAK**) changed `SpriteAnim` from `[ from, to ]` to `{ from: number, to: number }`
- (**BREAK**) removed `onAnimPlay()` and `onAnimEnd()` in favor of generic event `on("animEnd", (anim: string) => {})`
- (**BREAK**) removed `obj.addTag()` in favor of `obj.use()`
- (**BREAK**) merged `debug.hoverInfo` and `debug.showArea` into `debug.inspect`
- (**BREAK**) removed `sound.resume()` in favor of `sound.play()`

### v0.4.1
- fixed `on("destroy")` handler getting called twice
- fixed sprite `play()` not playing

# v0.4.0 "Multiboom"
- (**BREAK**) removed `init()` and `kaboom.global()`, in favor of `kaboom()`, also allows multiple kaboom games on one page
```js
// replaces init(), and added a 'global' flag for previous kaboom.global()
kaboom({
	global: true,
	width: 480,
	height: 480,
});
```
or not global
```js
const k = kaboom();
k.scene();
k.start();
k.vec2();
```
- (**BREAK**) changed `clearColor` on `kaboom(conf)` to accept a 4 number array instead of `rgba()`
- added a plugin system, see the `multiboom` example and `src/plugins`
- (**BREAK**) removed support for `.kbmsprite`, supports newer version of `.pedit` through pedit plugin
- (**BREAK**) `loadAseprite()` and made it an external plugin under `plugins/aseprite.js`
- added `sceneData()` for custom scene data kv store
- fixed `mouseClick` doesn't work on mobile
- disabled context menu on canvas
- prevented default behavior for 'tab' and function keys
- added `numFrames()` by `sprite()`
- added `screenshot()` that returns of a png base64 data url for a screenshot

# v0.3.0 "King Dedede...Bug!"
- (**BREAK**) removed `pause()` and `paused()` in favor to `kaboom.debug.paused`
- (**BREAK**) removed `velY`, `curPlatform` and `maxVel` fields by `body()`
- (**BREAK**) changed `curAnim` by `sprite()` to method `curAnim()`
- fixed `dt()` surge on page visibility change (#20)
- pause audio when page is not visible
- added built in debug control with `init({ debug: true, })`
  - `` ` ``: toggle `showLog` (default on with `debug: true`)
  - `f1`: toggle `showArea`
  - `f2`: toggle `hoverInfo`
  - `f8`: toggle `paused`
  - `f7`: decrease `timeScale`
  - `f9`: increase `timeScale`
  - `f10`: `stepFrame()`
- added on screen logging with `log()` and `error()`
- fixed `loadRoot()` sometimes doesn't work in async tasks

# v0.2.0 "Hear the Tremble"
- (**BREAK**) removed `aseSpriteSheet` conf field from `loadSprite(name, src, conf)`
- added `pause()`, `resume()`, `stop()`, `loop()`, `unloop()`, `volume()`, `detune()`, `speed()` methods to the handle returned by `play()`
- added `camShake()` for built in camera shake
- added `loadAseprite(name, imgSrc, jsonSrc)`
- added area component generation for `text()`
- added `noArea` to conf field of `sprite()`, `rect()` and `text()`, allowing to disable auto area component generation
- added a `quad` field to sprite comp creation config `sprite(id, { quad: quad(0, 0, 0.5, 0.5) })`
- fixed `resolve()` not working if the obj also has `solid`, so it does not check for itself (#8)
- `mousePos()` accepts a layer argument, which returns the mouse position affected by camera transform if that layer is not `camIgnore()`-ed
- fixed camera position getting calculated before completing every object's update (#14)
- fixed some cases `on("grounded", f)` called multiple times when moving on a smooth platform
- added `revery()` to iterate objects in reverse order
- added `readd()` to re-add an object to the scene without triggering events
- added `level.spawn()`

# v0.1.0 "Oh Hi Mark"
- (**BREAK**) changed default origin point to `"topleft"`, so if you want object origin point to be at center you'll need to manual `origin("center")`
- (**BREAK**) integrated `kit/physics` and `kit/level` to main lib
- (**BREAK**) makes `collides()` only run on first collision, not run every frame during the same collision
- (**BREAK**) `camPos()` by default focuses to center, so `camPos(player.pos)` puts player in the center of the screen
- (**BREAK**) renamed `kaboom.import()` to `kaboom.global()`
- added an arg field to `start(scene, ...)` to forward args to start scene
- added `camScale()`, `camRot()` and `camIgnore()`
- added `obj.overlaps()` by `area()`, and `overlaps()`
- added 3 ext fonts under `ext/fonts`

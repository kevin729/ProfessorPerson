var canvas = document.getElementById("can");
var gl;

var mouseX;
var mouseY;

var keys = [];
var entities = [];
var terrains = [];
var lights = [];
var particles = [];

var running = true;

var fps = 60;

var currentTime = 0;
var lastTime = 0;
var delta = 0;
var fbos;
var shader;
var Terrain;
var camera;
var particleEngine;
var skyBoxEngine;
var RayTracerEngine;
var tree;
var player;
var char;

var water;

window.addEventListener("keydown", function(e){
	keys[e.keyCode] = true;
	e.preventDefault();
}, false);

window.addEventListener("keyup", function(e){
	keys[e.keyCode] = false;
	e.preventDefault();
}, false);



function Init() {

	var width = canvas.width = window.innerWidth,
	height = canvas.height = window.innerHeight;

	gl = canvas.getContext('webgl');
	
	if(!gl)
	{
		gl = canvas.getContext('experimental-webgl');
	}
	
	if(!gl)
	{
		alert('Your browser does not support WebGL');
	}
	
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	
	loadModels();
	loadTextures(0, 0, start);
}

function start() {
	document.getElementById("loading").style.display = "none";
	fbos = new FBOs();
	water = new WaterTile(114, 194, -5);
	shader = new Shader(canvas, fbos);
	camera = new Camera(0,0,0, 0,0,0);
	particleEngine = new ParticleEngine(2, 0, 2, [0,0], [0,0], [0,0], getTexture("fireTexture"));
	skyBoxEngine = new SkyBoxEngine();
	RayTracerEngine = new RayTracerEngine(camera);

	var characterModel = new TexturedModel(getModel("player"), getTexture("characterTexture"));
	player = new Player(100, 0, 100, 0, 0, 0, 1, characterModel, 0, "player");
	tree = new Entity(25, 0, 20, 0, 0, 0, 1, new TexturedModel(getModel("tree"), getTexture("treeTexture")), 1, "tree", true);
	char = new Entity(200, 0, 200, 0, 0, 0, 5, new TexturedModel(getModel("player"), getTexture("characterTexture")), 0, "char", true);

	
	entities.push(new Entity(100, 0, 70, 0, 0, 0, 2, new TexturedModel(getModel("ramp"), getTexture("rockTexture")), 0, "ramp", false));
	entities.push(new Entity(200, 0, 200, 0, 0, 0, 10, new TexturedModel(getModel("house"), getTexture("rockTexture")), 0, "house", true));

	terrain = new Terrain(0, 0, [getTexture("grassTexture"), getTexture("dirtTexture"), getTexture("rockTexture"), getTexture("blendMapTexture")], getImage("heightMap"));
	terrains.push(terrain);

	lights.push(new Light([100,10000,100], [1, 1, 1])); //sun
	lights.push(new Light([0,100,100], [0,0,0]));
	lights.push(new Light([0,100,100], [0,0,0]));
	lights.push(new Light([0,100,100], [0,0,0]));

	lastTime = new Date().getTime();
	window.requestAnimationFrame(loop);
}


function loop() {
		currentTime = new Date().getTime();
		delta = (currentTime - lastTime)/1000;
		lastTime = currentTime;
		
		tick(terrain);
		render(camera);
		
		window.requestAnimationFrame(loop);
}

function tick(terrain) {
	for (var i = 0; i < entities.length; i++) {
		entities[i].tick(terrain);
	}

	if(keys[88]) {
		particleEngine.addParticles([110, 0, 150]);
	}
	if(keys[88])
		entities[1].move(0, 10, 0);

	// entities[1].move(0, 0, 1);

	particleEngine.tick();
	skyBoxEngine.tick();	
	camera.tick();
}

function render(camera) {
	fbos.bindFBO(fbos.reflectionFBO, 256, 256);

	var distance = 2*(camera.y-water.height);
	camera.y -= distance;
	camera.pitch = -camera.pitch;

	shader.process(entities, terrains, [], [], particleEngine);
	shader.render(lights, camera, [0, -1, 0, water.height-0.3], skyBoxEngine.getBlendFactor(), skyBoxEngine.getRotation());

	camera.y += distance;
	camera.pitch = -camera.pitch;
		
	fbos.bindFBO(fbos.refractionFBO, 256, 256)
	
	shader.process(entities, terrains, [], [], particleEngine);
	shader.render(lights, camera, [0, 1, 0, water.height+0.3], skyBoxEngine.getBlendFactor(), skyBoxEngine.getRotation());
	
	fbos.unbindFBO();

	shader.process(entities, terrains, [], [water], particleEngine);
	// shader.processUI(new UIObject([-0.5, 0.5], [0.25, 0.25], new Texture("fbo", fbos.refractionDepthTexture)));
	// shader.processUI(new UIObject([0.5, 0.5], [0.25, 0.25], new Texture("fbo", fbos.refractionTexture)));
	shader.render(lights, camera, [0, 0, 0, 0], skyBoxEngine.getBlendFactor(), skyBoxEngine.getRotation());
}

canvas.addEventListener('mousedown', function(e) {
	mouseX = e.offsetX;
	mouseY = e.offsetY;

	RayTracerEngine.tick();
}, false);

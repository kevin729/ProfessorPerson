var projMatrix = new Float32Array(16);

var RED = 0.5;
var GREEN = 0.5;
var BLUE = 0.5;

var maxLights = 4;

var renderEntities = new HashMap();
var renderTerrains = [];
var renderUIs = [];
var renderWaterTiles = [];
var renderParticles = new HashMap();

var Shader = function(canvas, FBOs)
{
	mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.width/canvas.height, 0.1, 10000);
	
	var entityShader = new EntityShader();
	var terrainShader = new TerrainShader();
	var uiShader = new UIShader();
	var skyBoxShader = new SkyBoxShader();
	var waterShader = new WaterShader(FBOs);
	var particleShader = new ParticleShader();
		
	this.render = function(lights, cam, clipPlane, dayNightFactor, rotation)
	{
		gl.clearColor(RED, GREEN, BLUE, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		gl.useProgram(entityShader.program);
		entityShader.loadSkyColour();
		entityShader.loadLights(lights);
		entityShader.loadView(cam);
		entityShader.loadClipPlane(clipPlane);
				
		renderEntities.getArray().forEach(function(a) {
		    entityShader.prepareTexturedModel(a[0]);
			a[1].forEach(function(e) {
				entityShader.prepareInstance(e);
				gl.drawElements(gl.TRIANGLES, a[0].model.vertexCount, gl.UNSIGNED_SHORT, 0);
			})
			entityShader.disableArrays();
			enableCulling();
		});
		unbind(); 
		
		gl.useProgram(terrainShader.program);
		terrainShader.loadSkyColour();
		terrainShader.loadLights(lights);
		terrainShader.loadView(cam);
		terrainShader.loadClipPlane(clipPlane);
		
		for (var i = 0; i < renderTerrains.length; i++) {
			terrainShader.render(renderTerrains[i]);
		}
		unbind();

		gl.useProgram(waterShader.program);
		waterShader.loadView(cam);
		waterShader.loadLight(lights[2]);
		waterShader.render(renderWaterTiles);
		unbind();
		
		gl.useProgram(skyBoxShader.program);
		skyBoxShader.loadView(cam, rotation);
		skyBoxShader.loadFog();
		skyBoxShader.render(dayNightFactor);
		unbind();

		gl.useProgram(particleShader.program);
		particleShader.render(renderParticles, cam);
		unbind();

		gl.useProgram(uiShader.program);
		uiShader.render(renderUIs);
		unbind();

		gl.useProgram(null);

		renderUIs = [];
		renderParticles.clear();
		renderWaterTiles = [];
		renderTerrains = [];
        renderEntities.clear();
	};
	
	this.processEntity = function(e) {
		var batch = renderEntities.getValue(e.texturedModel)
		
		if(batch != null) {
			renderEntities.getValue(e.texturedModel).push(e);
		} else {
			var newBatch = [];
			newBatch.push(e);
			renderEntities.put(e.texturedModel, newBatch);
		}
	};
	
	this.processTerrain = function(t) {
		renderTerrains.push(t);
	};
	
	this.processUI = function(ui) {
		renderUIs.push(ui);
	}

	this.processWater = function(waterTile) {
		renderWaterTiles.push(waterTile);
	} 

	this.processParticle = function(particle) {
		var batch = renderParticles.getValue(particle.texture)

		if(batch != null) {
			renderParticles.getValue(particle.texture).push(particle);
		} else {
			var newBatch = [];
			newBatch.push(particle);
			renderParticles.put(particle.texture, newBatch);
		}
	}

	this.process = function(entities, terrains, UIs, waterTiles, particleEngine) {
		var self = this;
		for (var i = 0; i < entities.length; i++) {
			self.processEntity(entities[i]);
		}

		for (var i = 0; i < terrains.length; i++) {
			self.processTerrain(terrains[i]);
		}

		for (var i = 0; i < waterTiles.length; i++) {
			self.processWater(waterTiles[i]);
		}

		particleEngine.process(this);

		for (var i = 0; i < UIs.length; i++) {
			self.processUI(UIs[i]);
		}
	}
}

function setupShader(shader)
{
		gl.shaderSource(shader.vertexShader, shader.vertexShaderText);
		gl.shaderSource(shader.fragmentShader, shader.fragmentShaderText);
	
		gl.compileShader(shader.vertexShader);
		if(!gl.getShaderParameter(shader.vertexShader, gl.COMPILE_STATUS))
			console.error('ERROR compiling vertex shader', gl.getShaderInfoLog(shader.vertexShader));
		gl.compileShader(shader.fragmentShader);
		if(!gl.getShaderParameter(shader.fragmentShader, gl.COMPILE_STATUS))
			console.error('ERROR compiling fragmentShader shader', gl.getShaderInfoLog(shader.fragmentShader));

		shader.program = gl.createProgram();
		gl.attachShader(shader.program, shader.vertexShader);
		gl.attachShader(shader.program, shader.fragmentShader);
		gl.linkProgram(shader.program);

		gl.validateProgram(shader.program);
}

var EntityShader = function()
{
	this.vertexShaderText =
	[
		'precision mediump float;',
		'attribute vec3 vPos;',
		'attribute vec2 TextureCo;',
		'attribute vec3 normals;',
		'varying vec3 surfaceNormal;',
		'varying vec3 toLightVector[4];',
		'varying vec3 toCameraVector;',
		'varying vec2 texture_Co;',
		'varying float visibility;',
		'varying vec4 worldPosition;',
		'uniform mat4 transformation;',
		'uniform mat4 view;',
		'uniform mat4 projection;',
		'uniform vec3 lightPosition[4];',
		'uniform vec3 cameraPosition;',
		'uniform float useFakeLighting;',
		'uniform float texturedRows;',
		'uniform vec2 offset;',
		'const float density = 0.004;',
		'const float gradient = 1.5;',
		'void main()',
		'{',
		'	worldPosition = transformation*vec4(vPos, 1);',
		'	vec4 positionRelativeToCam = view*worldPosition;',
		'	gl_Position = projection*view*worldPosition;',
		'	texture_Co = (TextureCo/texturedRows) + offset;',
		'	vec3 actualNormal = normals;',
		'	if(useFakeLighting > 0.5){',
		'		actualNormal = vec3(0.0, 1.0, 0.0);',
		'	}',
		'	surfaceNormal = (transformation*vec4(actualNormal, 0)).xyz;',
		'	for(int i=0; i<4; i++){',
		'		toLightVector[i] = lightPosition[i] - worldPosition.xyz;',
		'	}',
		'	toCameraVector = cameraPosition - worldPosition.xyz;',
		'	float distance = length(positionRelativeToCam.xyz);',
		'	visibility = exp(-pow((distance*density), gradient));',
		'	visibility = clamp(visibility, 0.0, 1.0);',
		'}'
	].join('\n');

	this.fragmentShaderText =
	[
		'precision mediump float;',
		'varying vec3 surfaceNormal;',
		'varying vec3 toLightVector[4];',
		'varying vec3 toCameraVector;',
		'varying vec2 texture_Co;', 
		'varying float visibility;',
		'varying float clip;',
		'varying vec4 worldPosition;',
		'uniform sampler2D modelTexture;', //TEXTURE0
		'uniform sampler2D specMap;', //TEXTURE1
		'uniform float useSpecMap;',
		'uniform vec3 lightColour[4];',
		'uniform vec3 attenuation[4];',
		'uniform float shineDamper;',
		'uniform float reflectivity;',
		'uniform vec3 skyColour;',
		'uniform vec4 clipPlane;',
		'vec3 totalDiffuse = vec3(0.0);',
		'vec3 totalSpecular = vec3(0.0);',
		'void main()',
		'{',
		'	if (clipPlane.x < 0.0 && worldPosition.x < clipPlane.w) {',
		'		discard;',
		'	}',
		'	if (clipPlane.x > 0.0 && worldPosition.x > clipPlane.w) {',
		'		discard;',
		'	}',
		'	if (clipPlane.y < 0.0 && worldPosition.y < clipPlane.w) {',
		'		discard;',
		'	}',
		'	if (clipPlane.y > 0.0 && worldPosition.y > clipPlane.w) {',
		'		discard;',
		'	}',
		'	if (clipPlane.z < 0.0 && worldPosition.z < clipPlane.w) {',
		'		discard;',
		'	}',
		'	if (clipPlane.z > 0.0 && worldPosition.z > clipPlane.w) {',
		'		discard;',
		'	}',
		'	vec4 textureColour = texture2D(modelTexture, texture_Co);',
		'	if(textureColour.a<0.5){',
		'		discard;',
		'	}',
		'	vec3 unitNormal = normalize(surfaceNormal);',
		'	vec3 unitCameraVector = normalize(toCameraVector);',
		'	for(int i = 0; i < 4; i++){',
		'		float distanceFromLight = length(toLightVector[i]);',
		'		float attFactor = attenuation[i].x + (attenuation[i].y * distanceFromLight) + (attenuation[i].z * distanceFromLight * distanceFromLight);',
		'		vec3 unitLightVector = normalize(toLightVector[i]);',
		'		float nDot1 = dot(unitNormal, unitLightVector);',
		'		float brightness = max(nDot1, 0.0);',
		'		totalDiffuse = totalDiffuse + (brightness * lightColour[i])/attFactor;',
		'		vec3 lightDirection = -unitLightVector;',
		'		vec3 reflectedLight = reflect(lightDirection, unitNormal);',
		'		float specularFactor = dot(reflectedLight, unitCameraVector);',
		'		specularFactor = max(specularFactor, 0.0);',
		'		float dampedFactor = pow(specularFactor, shineDamper);',
		'		totalSpecular = totalSpecular + (dampedFactor*reflectivity*lightColour[i])/attFactor;',
		'	}',
		'	totalDiffuse = max(totalDiffuse, 0.2);',
		'if (useSpecMap > 0.5) {',
		'	vec4 specMapColour = texture2D(specMap, texture_Co);',
		'	totalSpecular *= specMapColour.g;',
		'	if(specMapColour.r > 0.5){',
		'		totalDiffuse = vec3(1.0);',
		'	}',
		'}',
		'	vec4 outColour = vec4(totalDiffuse, 1) * texture2D(modelTexture, texture_Co) + vec4(totalSpecular, 1.0);',
		'	gl_FragColor = mix(vec4(skyColour, 1.0), outColour, visibility);',
		'}'
	].join('\n');
	
	this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
	this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	
	this.program;
	
	setupShader(this);
		
	var positionLocation = gl.getAttribLocation(this.program, 'vPos');
	var textureLocation = gl.getAttribLocation(this.program, 'TextureCo');
	var normalLocation = gl.getAttribLocation(this.program, 'normals');
	var transformationLocation = gl.getUniformLocation(this.program, 'transformation');
	var viewLocation = gl.getUniformLocation(this.program, 'view');
	var projectionLocation = gl.getUniformLocation(this.program, 'projection');
	var shineDamperLocation = gl.getUniformLocation(this.program, 'shineDamper');
	var reflectivityLocation = gl.getUniformLocation(this.program, 'reflectivity');
	var cameraPositionLocation = gl.getUniformLocation(this.program, 'cameraPosition');
	var useFakeLightingLocation = gl.getUniformLocation(this.program, 'useFakeLighting');
	var skyColourLocation = gl.getUniformLocation(this.program, 'skyColour');
	var offsetLocation = gl.getUniformLocation(this.program, 'offset');
	var texturedRowsLocation = gl.getUniformLocation(this.program, "texturedRows");
	var clipPlaneLocation = gl.getUniformLocation(this.program, 'clipPlane');
	var modelTextureLocation = gl.getUniformLocation(this.program, 'modelTexture');
	var specMapLocation = gl.getUniformLocation(this.program, 'specMap');
	var useSpecMapLocation = gl.getUniformLocation(this.program, 'useSpecMap');
	var lightPositionLocation = [];
	var lightColourLocation = [];

	for (i=0; i<maxLights; i++) {
		lightPositionLocation[i] = gl.getUniformLocation(this.program, 'lightPosition['+i+']');
		lightColourLocation[i] = gl.getUniformLocation(this.program, 'lightColour['+i+']');
	}

	var attenuationLocation = [];

	for (i=0; i<maxLights; i++) {
		attenuationLocation[i] = gl.getUniformLocation(this.program, 'attenuation['+i+']');
	}

	this.connectTextures = function()
	{
		gl.uniform1i(modelTextureLocation, 0);
		gl.uniform1i(specMapLocation, 1);
	};
	
	gl.useProgram(this.program);
	gl.uniformMatrix4fv(projectionLocation, gl.FALSE, projMatrix);
	this.connectTextures();
	gl.useProgram(null);
	
	this.prepareTexturedModel = function(tModel) {
		this.loadSkyColour();
		var model = tModel.model;
		var texture = tModel.texture;
		
		if(texture.hasTransparency)
		{
			disableCulling();
		}
		
		this.loadFakeLighting(texture.useFakeLighting);
		this.loadShine(texture.shineDamper, texture.reflectivity);
		gl.uniform1f(texturedRowsLocation, texture.rows);

		gl.bindBuffer(gl.ARRAY_BUFFER, model.data[0]);
		gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, gl.FALSE, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, model.data[1]);
		gl.vertexAttribPointer(textureLocation, 2, gl.FLOAT, gl.FALSE, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, model.data[2]);
		gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, gl.FALSE, 0, 0);
		
		this.enableArrays();
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.data[3]);
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture.textureVBO);

		if (texture.textureSpecVBO != -1) {
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, texture.textureSpecVBO);
			gl.uniform1f(useSpecMapLocation, 1.0);
			
		} else {
			gl.uniform1f(useSpecMapLocation, 0.0);
		}
	}
	
	this.prepareInstance = function(entity) {
		this.loadTransformations(entity);
		gl.uniform2f(offsetLocation, entity.getTextureXOffset(), entity.getTextureYOffset());
	}
	
	this.loadTransformations = function(entity)
	{
		var transformationMatrix = new Float32Array(16);
		mat4.identity(transformationMatrix);
				
		mat4.translate(transformationMatrix, transformationMatrix, [entity.x, entity.y, entity.z]);
		
		mat4.rotate(transformationMatrix, transformationMatrix, toRadians(entity.rX), [1, 0, 0]);
		mat4.rotate(transformationMatrix, transformationMatrix, toRadians(entity.rY), [0, 1, 0]);
		mat4.rotate(transformationMatrix, transformationMatrix, toRadians(entity.rZ), [0, 0, 1]);
		
		mat4.scale(transformationMatrix, transformationMatrix, [entity.scale, entity.scale, entity.scale]);
		
		gl.uniformMatrix4fv(transformationLocation, gl.FALSE, transformationMatrix);
	}
	
	this.loadView = function(camera)
	{
		var viewMatrix = createViewMatrix(camera);
		
		gl.uniformMatrix4fv(viewLocation, gl.FALSE, viewMatrix);
		gl.uniform3f(cameraPositionLocation, camera.x, camera.y, camera.z);
	};
	
	this.loadLights = function(lights)
	{
		for(var i = 0; i < maxLights; i++) {
			
			gl.uniform3f(lightPositionLocation[i], lights[i].position[0], lights[i].position[1], lights[i].position[2]);
			gl.uniform3f(lightColourLocation[i], lights[i].colour[0], lights[i].colour[1], lights[i].colour[2]);
			gl.uniform3f(attenuationLocation[i], lights[i].attenuation[0], lights[i].attenuation[1], lights[i].attenuation[2]);
		}
	};
	
	this.loadShine = function(shineDamper, reflectivity)
	{
		gl.uniform1f(shineDamperLocation, shineDamper);
		gl.uniform1f(reflectivityLocation, reflectivity);
	}
	
	this.loadFakeLighting = function(value)
	{
		load = 0;
		if(value)
			load = 1;
		
		gl.uniform1f(useFakeLightingLocation, load);
	}
	
	this.loadSkyColour = function()
	{
		gl.uniform3f(skyColourLocation, RED, GREEN, BLUE);
	}

	this.loadClipPlane = function(clipPlane)
	{
		gl.uniform4f(clipPlaneLocation, clipPlane[0], clipPlane[1], clipPlane[2], clipPlane[3]);
	}
	
	this.enableArrays = function()
	{
	    gl.enableVertexAttribArray(positionLocation);
		gl.enableVertexAttribArray(textureLocation);
		gl.enableVertexAttribArray(normalLocation);
	};
	
	this.disableArrays = function()
	{
	    gl.disableVertexAttribArray(positionLocation);
		gl.disableVertexAttribArray(textureLocation);
		gl.enableVertexAttribArray(normalLocation);
	};
}

var TerrainShader = function()
{
	this.vertexShaderText =
	[
		'precision mediump float;',
		'attribute vec3 vPos;',
		'attribute vec2 TextureCo;',
		'attribute vec3 normals;',
		'varying vec3 surfaceNormal;',
		'varying vec3 toLightVector[4];',
		'varying vec3 toCameraVector;',
		'varying vec2 texture_Co;',
		'varying float visibility;',
		'varying vec4 worldPosition;',
		'uniform mat4 transformation;',
		'uniform mat4 view;',
		'uniform mat4 projection;',
		'uniform vec3 lightPosition[4];',
		'uniform vec3 cameraPosition;',
		'const float density = 0.004;',
		'const float gradient = 1.5;',
		'void main()',
		'{',
		'	worldPosition = transformation*vec4(vPos, 1);',
		'	vec4 positionRelativeToCam = view*worldPosition;',
		'	gl_Position = projection*view*worldPosition;',
		'	texture_Co = TextureCo;',
		'	surfaceNormal = (transformation*vec4(normals, 0)).xyz;',
		'	for(int i = 0; i < 4; i++){',
		'		toLightVector[i] = lightPosition[i] - worldPosition.xyz;',
		'	}',
		'	toCameraVector = cameraPosition - worldPosition.xyz;',
		'	float distance = length(positionRelativeToCam.xyz);',
		'	visibility = exp(-pow((distance*density), gradient));',
		'	visibility = clamp(visibility, 0.0, 1.0);',
		'}'
	].join('\n');

	this.fragmentShaderText =
	[
		'precision mediump float;',
		'varying vec3 surfaceNormal;',
		'varying vec3 toLightVector[4];',
		'varying vec3 toCameraVector;',
		'varying vec2 texture_Co;',
		'varying float visibility;',
		'varying vec4 worldPosition;',	
		'uniform sampler2D grassTexture;', //TEXTURE0
		'uniform sampler2D dirtTexture;', //TEXTURE1
		'uniform sampler2D rockTexture;', //TEXTURE2
		'uniform sampler2D blendMapTexture;', //TEXTURE3
		'uniform vec3 lightColour[4];',
		'uniform vec3 attenuation[4];',
		'uniform float shineDamper;',
		'uniform float reflectivity;',
		'uniform vec3 skyColour;',
		'uniform vec4 clipPlane;',
		'vec3 totalDiffuse = vec3(0.0);',
		'vec3 totalSpecular = vec3(0.0);',
		'void main()',
		'{',
		'	if (clipPlane.x < 0.0 && worldPosition.x < clipPlane.w) {',
		'		discard;',
		'	}',
		'	if (clipPlane.x > 0.0 && worldPosition.x > clipPlane.w) {',
		'		discard;',
		'	}',
		'	if (clipPlane.y < 0.0 && worldPosition.y < clipPlane.w) {',
		'		discard;',
		'	}',
		'	if (clipPlane.y > 0.0 && worldPosition.y > clipPlane.w) {',
		'		discard;',
		'	}',
		'	if (clipPlane.z < 0.0 && worldPosition.z < clipPlane.w) {',
		'		discard;',
		'	}',
		'	if (clipPlane.z > 0.0 && worldPosition.z > clipPlane.w) {',
		'		discard;',
		'	}',
		'	vec4 blendMapColour = texture2D(blendMapTexture, texture_Co);',
		'	float blackColour = 1.0 - (blendMapColour.r + blendMapColour.g + blendMapColour.b);',
		'	vec2 tiledCoords = texture_Co*80.0;',
		'	vec4 grassTextureColour = texture2D(grassTexture, tiledCoords) * blackColour;',
		'	vec4 dirtTextureColour = texture2D(dirtTexture, tiledCoords) * blendMapColour.r;',
		'	vec4 rockTextureColour = texture2D(rockTexture, tiledCoords) * blendMapColour.g;',
		'	vec4 totalColour = grassTextureColour + dirtTextureColour + rockTextureColour;',
		'	vec3 unitNormal = normalize(surfaceNormal);',
		'	for(int i = 0; i < 4; i++){',
		'		float distanceFromLight = length(toLightVector[i]);',
		'		float attFactor = attenuation[i].x + (attenuation[i].y * distanceFromLight) + (attenuation[i].z * distanceFromLight * distanceFromLight);',
		'		vec3 unitLightVector = normalize(toLightVector[i]);',
		'		float nDot1 = dot(unitNormal, unitLightVector);',
		'		float brightness = max(nDot1, 0.0);',
		'		totalDiffuse = totalDiffuse + (brightness * lightColour[i])/attFactor;', 
		'		vec3 unitCameraVector = normalize(toCameraVector);',
		'		vec3 lightDirection = -unitLightVector;',
		'		vec3 reflectedLight = reflect(lightDirection, unitNormal);',
		'		float specularFactor = dot(reflectedLight, unitCameraVector);',
		'		specularFactor = max(specularFactor, 0.0);',
		'		float dampedFactor = pow(specularFactor, shineDamper);',
		'		vec3 totalSpecular = totalSpecular + (dampedFactor*reflectivity*lightColour[i])/attFactor;',
		'	}',
		'	totalDiffuse = max(totalDiffuse, 0.5);',
		'	vec4 outColour = vec4(totalDiffuse, 1) * totalColour + vec4(totalSpecular, 1.0);',
		'	gl_FragColor = mix(vec4(skyColour, 1.0), outColour, visibility);',
		'}'
	].join('\n');
	
	this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
	this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	
	this.program;
	
	setupShader(this);
		
	var positionLocation = gl.getAttribLocation(this.program, 'vPos');
	var textureLocation = gl.getAttribLocation(this.program, 'TextureCo');
	var normalLocation = gl.getAttribLocation(this.program, 'normals');
	var transformationLocation = gl.getUniformLocation(this.program, 'transformation');
	var viewLocation = gl.getUniformLocation(this.program, 'view');
	var projectionLocation = gl.getUniformLocation(this.program, 'projection');
	var shineDamperLocation = gl.getUniformLocation(this.program, 'shineDamper');
	var reflectivityLocation = gl.getUniformLocation(this.program, 'reflectivity');
	var cameraPositionLocation = gl.getUniformLocation(this.program, 'cameraPosition');
	var skyColourLocation = gl.getUniformLocation(this.program, 'skyColour');
	var grassTextureLocation = gl.getUniformLocation(this.program, 'grassTexture');
	var dirtTextureLocation = gl.getUniformLocation(this.program, 'dirtTexture');
	var rockTextureLocation = gl.getUniformLocation(this.program, 'rockTexture');
	var blendMapTextureLocation = gl.getUniformLocation(this.program, 'blendMapTexture');
	var clipPlaneLocation = gl.getUniformLocation(this.program, 'clipPlane');

	var lightPositionLocation = [];
	var lightColourLocation = [];

	for(i=0; i<maxLights; i++) {
		lightPositionLocation[i] = gl.getUniformLocation(this.program, 'lightPosition['+i+']');
		lightColourLocation[i] = gl.getUniformLocation(this.program, 'lightColour['+i+']');
	}

	var attenuationLocation = [];

	for (i=0; i<maxLights; i++) {
		attenuationLocation[i] = gl.getUniformLocation(this.program, 'attenuation['+i+']');
	}
	
	this.connectTextures = function()
	{
		gl.uniform1i(grassTextureLocation, 0);
		gl.uniform1i(dirtTextureLocation, 1);
		gl.uniform1i(rockTextureLocation, 2);
		gl.uniform1i(blendMapTextureLocation, 3);
	};
	
	gl.useProgram(this.program);
	gl.uniformMatrix4fv(projectionLocation, gl.FALSE, projMatrix);
	this.connectTextures();
	gl.useProgram(null);
	
	this.render = function(terrain)
	{
		model = terrain.model;

		this.loadTransformations(terrain);
		this.loadShine(1, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, model.data[0]);
		gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, gl.FALSE, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, model.data[1]);
		gl.vertexAttribPointer(textureLocation, 2, gl.FLOAT, gl.FALSE, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, model.data[2]);
		gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, gl.FALSE, 0, 0);
		
		this.enableArrays();
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.data[3]);

		this.bindTerrainTextures(terrain);
		
		gl.drawElements(gl.TRIANGLES, model.vertexCount, gl.UNSIGNED_SHORT, 0);
		
		this.disableArrays();
	};
	
	this.bindTerrainTextures = function(terrain)
	{
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, terrain.textures[0].textureVBO);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, terrain.textures[1].textureVBO);

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, terrain.textures[2].textureVBO);
		
		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D, terrain.textures[3].textureVBO);
	};	
	
	this.loadTransformations = function(terrain)
	{
		var transformationMatrix = new Float32Array(16);
		mat4.identity(transformationMatrix);
				
		mat4.translate(transformationMatrix, transformationMatrix, [terrain.x, 0, terrain.z]);
	
		gl.uniformMatrix4fv(transformationLocation, gl.FALSE, transformationMatrix);
	};
	
	this.loadView = function(camera)
	{
		var viewMatrix = createViewMatrix(camera);
		
		gl.uniformMatrix4fv(viewLocation, gl.FALSE, viewMatrix);
		gl.uniform3f(cameraPositionLocation, camera.x, camera.y, camera.z);
	};
	
	this.loadLights = function(lights)
	{
		for(var i = 0; i < maxLights; i++) {
			
			gl.uniform3f(lightPositionLocation[i], lights[i].position[0], lights[i].position[1], lights[i].position[2]);
			gl.uniform3f(lightColourLocation[i], lights[i].colour[0], lights[i].colour[1], lights[i].colour[2]);
			gl.uniform3f(attenuationLocation[i], lights[i].attenuation[0], lights[i].attenuation[1], lights[i].attenuation[2]);
		}
	};
	
	this.loadShine = function(shineDamper, reflectivity)
	{
		gl.uniform1f(shineDamperLocation, shineDamper);
		gl.uniform1f(reflectivityLocation, reflectivity);
	};
	
	this.loadSkyColour = function()
	{
		gl.uniform3f(skyColourLocation, RED, GREEN, BLUE);
	};

	this.loadClipPlane = function(clipPlane)
	{
		gl.uniform4f(clipPlaneLocation, clipPlane[0], clipPlane[1], clipPlane[2], clipPlane[3]);
	};
	
	this.enableArrays = function()
	{
	    gl.enableVertexAttribArray(positionLocation);
		gl.enableVertexAttribArray(textureLocation);
		gl.enableVertexAttribArray(normalLocation);
	};
	
	this.disableArrays = function()
	{
	    gl.disableVertexAttribArray(positionLocation);
		gl.disableVertexAttribArray(textureLocation);
		gl.disableVertexAttribArray(normalLocation);
	};
}

var UIShader = function() {
	this.vertexShaderText =
	[
		'precision mediump float;',
		'attribute vec2 vPos;',
		'varying vec2 texture_Co;',
		'uniform mat4 transform;',
		'void main()',
		'{',
		'	gl_Position = transform*vec4(vPos, 0, 1);',
		'	texture_Co = vec2((vPos.x+1.0)/2.0, 1.0-(vPos.y+1.0)/2.0);',
		'}'
	].join('\n');

	this.fragmentShaderText =
	[
		'precision mediump float;',
		'varying vec2 texture_Co;',
		'uniform sampler2D uiTexture;', //TEXTURE0
		'void main()',
		'{',
		'	gl_FragColor = texture2D(uiTexture, texture_Co);',
		'}'
	].join('\n');
	
	this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
	this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	
	this.program;
	
	setupShader(this);
	
	var positionLocation = gl.getAttribLocation(this.program, 'vPos');
	var transformationLocation = gl.getUniformLocation(this.program, 'transform')
	
	var uiQuad = loadModel([[-1,1, -1,-1, 1,1, 1,-1]], 2);
	
	this.render = function(UIs) {
		gl.bindBuffer(gl.ARRAY_BUFFER, uiQuad.data[0]);
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, gl.FALSE, 0, 0);
		gl.enableVertexAttribArray(positionLocation);
		
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.disable(gl.DEPTH_TEST);
		var self = this;

		for (var i = 0; i < UIs.length; i++) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, UIs[i].texture.textureVBO)
			self.loadTransformations(UIs[i]);

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, uiQuad.vertexCount);
		}
		gl.enable(gl.DEPTH_TEST);
		gl.disable(gl.BLEND);
		gl.disableVertexAttribArray(positionLocation);
	}
	
	this.loadTransformations = function(ui) {
		var transformationMatrix = new Float32Array(16);
		mat4.identity(transformationMatrix);
		mat4.translate(transformationMatrix, transformationMatrix, [ui.position[0], ui.position[1], 0]);
		
		mat4.scale(transformationMatrix, transformationMatrix, [ui.scale[0], ui.scale[1], 1]);

		gl.uniformMatrix4fv(transformationLocation, gl.FALSE, transformationMatrix);
	}
}

var SkyBoxShader = function() {
	this.vertexShaderText =
	[
		'precision mediump float;',
		'attribute vec3 vPos;',
		'varying vec3 texture_Co;',
		'uniform mat4 view;',
		'uniform mat4 projection;',
		'void main()',
		'{',
		'	gl_Position = projection*view*vec4(vPos, 1);',
		'	texture_Co = vPos;',
		'}'
	].join('\n');

	this.fragmentShaderText =
	[
		'precision mediump float;',
		'varying vec3 texture_Co;',
		'uniform samplerCube dayBox;', //TEXTURE0
		'uniform samplerCube nightBox;', //TEXTURE1
		'uniform float blendFactor;',
		'uniform vec3 fogColour;',
		'const float lowerLimit = 0.0;',
		'const float upperLimit = 30.0;',
		'void main()',
		'{',
		'	vec4 dayColour = textureCube(dayBox, texture_Co);',
		'	vec4 nightColour = textureCube(nightBox, texture_Co);',
		'	vec4 skyColour = mix(dayColour, nightColour, blendFactor);',
		'	float factor = (texture_Co.y-lowerLimit)/(upperLimit - lowerLimit);',
		'	factor = clamp(factor, 0.0, 1.0);',
		'	gl_FragColor = mix(vec4(fogColour, 1.0), skyColour, factor);',
		'}'
	].join('\n');
	
	this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
	this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	
	this.program;
	
	setupShader(this);

	var positionLocation = gl.getAttribLocation(this.program, "vPos");
	var viewLocation = gl.getUniformLocation(this.program, "view");
	var projectionLocation = gl.getUniformLocation(this.program, "projection");
	var fogColourLocation = gl.getUniformLocation(this.program, "fogColour");
	var blendFactorLocation = gl.getUniformLocation(this.program, "blendFactor");
	var dayBoxLocation = gl.getUniformLocation(this.program, "dayBox");
	var nightBoxLocation = gl.getUniformLocation(this.program, "nightBox");

	var cube = loadModel([skyBoxVertices], 3);
	var dayTexture = loadCubeMap(getSkyBoxTextures("dayBox"));
	var nightTexture = loadCubeMap(getSkyBoxTextures("nightBox"));

	this.connectTextures = function() {
		gl.uniform1i(dayBoxLocation, 0);
		gl.uniform1i(nightBoxLocation, 1);
	}

	gl.useProgram(this.program);
	this.connectTextures();
	gl.uniformMatrix4fv(projectionLocation, gl.FALSE, projMatrix);
	gl.useProgram(null);

	this.render = function(blendFactor) {
		gl.bindBuffer(gl.ARRAY_BUFFER, cube.data[0]);
		gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, gl.FALSE, 0, 0);
		gl.enableVertexAttribArray(positionLocation);

		this.bindTextures(blendFactor);
		
		gl.drawArrays(gl.TRIANGLES, 0, cube.vertexCount);

		gl.disableVertexAttribArray(positionLocation);
	}

	this.bindTextures = function(blendFactor) {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, dayTexture);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, nightTexture);
		this.loadBlendFactor(blendFactor);
	}

	this.loadView = function(camera, rotation)
	{
		var viewMatrix = new Float32Array(16);
		mat4.identity(viewMatrix);
		
		mat4.rotate(viewMatrix, viewMatrix, toRadians(camera.pitch), [1,0,0]);
		mat4.rotate(viewMatrix, viewMatrix, toRadians(camera.yaw+rotation), [0,1,0]);
		mat4.rotate(viewMatrix, viewMatrix, toRadians(camera.roll), [0,0,1]);

		gl.uniformMatrix4fv(viewLocation, gl.FALSE, viewMatrix);
	};

	this.loadFog = function() {
		gl.uniform3f(fogColourLocation, RED, GREEN, BLUE);
	};

	this.loadBlendFactor = function(blend) {
		gl.uniform1f(blendFactorLocation, blend);
	}
}

var WaterShader = function(waterFBO) {
	this.vertexShaderText =
	[
		'precision mediump float;',
		'attribute vec2 vPos;',
		'varying vec4 clipSpace;',
		'varying vec3 toCameraVector;',
		'varying vec2 texture_Co;',
		'varying vec3 fromLightVector;',
		'uniform mat4 transform;',
		'uniform mat4 view;',
		'uniform mat4 projection;',
		'uniform vec3 cameraPosition;',
		'uniform vec3 lightPosition;',
		'const float tiling = 6.0;',
		'void main()',
		'{',
		'	vec4 worldPosition = transform*vec4(vPos.x, 0.0, vPos.y, 1.0);',
		'	toCameraVector = cameraPosition - worldPosition.xyz;',
		'	fromLightVector = worldPosition.xyz - lightPosition;',
		'	clipSpace = projection*view*worldPosition;',
		'	gl_Position = clipSpace;',
		'	texture_Co = vec2(vPos.x/2.0+0.5, vPos.y/2.0+0.5) * tiling;',
		'}'
	].join('\n');

	this.fragmentShaderText =
	[
		'precision mediump float;',
		'varying vec4 clipSpace;',
		'varying vec3 toCameraVector;',
		'varying vec2 texture_Co;',
		'varying vec3 fromLightVector;',
		'uniform sampler2D reflectionTexture;',
		'uniform sampler2D refractionTexture;',
		'uniform sampler2D dudvMapTexture;',
		'uniform sampler2D normalMapTexture;',
		'uniform vec3 lightColour;',
		'uniform float moveFactor;',
		'const float waveStrength = 0.007;',
		'const float reflectivity = 0.6;',
		'const float shineDamper = 20.0;',
		'void main()',
		'{',
		'	vec2 ndc = (clipSpace.xy/clipSpace.w)/2.0 + 0.5;',
		'	vec2 reflectionTextureCo = vec2(ndc.x, 1.0-ndc.y);',
		'	vec2 refractionTextureCo = vec2(ndc.x, ndc.y);',
		'	vec2 distortedTextureCo = texture2D(dudvMapTexture, vec2(texture_Co.x + moveFactor, texture_Co.y)).rg*0.1;',
		'	distortedTextureCo = texture_Co + vec2(distortedTextureCo.x, distortedTextureCo.y + moveFactor);',
		'	vec2 totalDistortion = (texture2D(dudvMapTexture, distortedTextureCo).rg * 2.0 - 1.0) * waveStrength;',
		'	reflectionTextureCo += totalDistortion;',
		'	reflectionTextureCo.x = clamp(reflectionTextureCo.x, 0.001, 0.999);',
		'	reflectionTextureCo.y = clamp(reflectionTextureCo.y, 1.0-0.999, 1.0-0.001);',
		'	refractionTextureCo += totalDistortion;',
		'	refractionTextureCo = clamp(refractionTextureCo, 0.001, 0.999);',
		'	vec4 reflectionColour = texture2D(reflectionTexture, reflectionTextureCo);',
		'	vec4 refractionColour = texture2D(refractionTexture, refractionTextureCo);',
		'	vec3 toCameraVectorNormal = normalize(toCameraVector);',
		'	vec4 normalMapColour = texture2D(normalMapTexture, distortedTextureCo);',
		'	vec3 normal = vec3(normalMapColour.r * 2.0 - 1.0, normalMapColour.b, normalMapColour.g * 2.0 - 1.0);',
		'	normal = normalize(normal);',
		'	float refractionFactor = dot(toCameraVectorNormal, vec3(0.0, 1.0, 0.0));',
		'	refractionFactor = pow(refractionFactor, 0.5);',
		'	vec3 reflectedLight = reflect(normalize(fromLightVector), normal);',
		'	float specularFactor = max(dot(reflectedLight, toCameraVectorNormal), 0.0);',
		'	specularFactor = pow(specularFactor, shineDamper);',
		'	vec3 specular = lightColour * specularFactor * reflectivity;',
		'	float dampedFactor = pow(specularFactor, shineDamper);',
		'	gl_FragColor = mix(mix(reflectionColour, refractionColour, refractionFactor), vec4(0.0, 0.0, 0.5, 1.0), 0.3) + vec4(specular, 0.0);',
		'}'
	].join('\n');
	
	this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
	this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	
	this.program;
	
	setupShader(this);

	var positionLocation = gl.getAttribLocation(this.program, "vPos");
	var transformationLocation = gl.getUniformLocation(this.program, "transform");
	var viewLocation = gl.getUniformLocation(this.program, "view");
	var projectionLocation = gl.getUniformLocation(this.program, "projection");
	var reflectionTextureLocation = gl.getUniformLocation(this.program, "reflectionTexture");
	var refractionTextureLocation = gl.getUniformLocation(this.program, "refractionTexture");
	var dudvMapTextureLocation = gl.getUniformLocation(this.program, "dudvMapTexture");
	var normalMapTextureLocation = gl.getUniformLocation(this.program, "normalMapTexture");
	var moveFactorLoaction = gl.getUniformLocation(this.program, "moveFactor");
	var cameraPositionLocation = gl.getUniformLocation(this.program, "cameraPosition");
	var lightPositionLocation = gl.getUniformLocation(this.program, "lightPosition");
	var lightColourLocation = gl.getUniformLocation(this.program, "lightColour");

	var waterQuad = loadModel([[-1,-1, -1,1, 1,-1, 1,-1, -1,1, 1,1]], 2);
	this.waterFBO = waterFBO;

	var moveSpeed = 0.06;
	var moveFactor = 0;

	this.connectTextures = function()
	{
		gl.uniform1i(reflectionTextureLocation, 0);
		gl.uniform1i(refractionTextureLocation, 1);
		gl.uniform1i(dudvMapTextureLocation, 2);
		gl.uniform1i(normalMapTextureLocation, 3);
	};

	gl.useProgram(this.program);
	gl.uniformMatrix4fv(projectionLocation, gl.FALSE, projMatrix);
	this.connectTextures();
	gl.useProgram(null);

	this.render = function(waterTiles)
	{
		if(waterTiles.length != 0){
			moveFactor += moveSpeed*delta;
			moveFactor %= 1;
			this.loadMoveFactor();

			gl.bindBuffer(gl.ARRAY_BUFFER, waterQuad.data[0]);
			this.bindTerrainTextures();
			gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, gl.FALSE, 0, 0);
			gl.enableVertexAttribArray(positionLocation);

			var self = this;
			for (var i = 0; i < waterTiles.length; i++) {
				self.loadTransformations(waterTiles[i]);
			}

			gl.drawArrays(gl.TRIANGLES, 0, waterQuad.vertexCount);

			gl.disableVertexAttribArray(positionLocation);
		}
	}

	this.bindTerrainTextures = function()
	{
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.waterFBO.reflectionTexture);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.waterFBO.refractionTexture);

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, getTexture("waterDUDVTexture").textureVBO);

		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D, getTexture("waterNormalMapTexture").textureVBO);
	};	

	this.loadTransformations = function(waterTile)
	{
		var transformationMatrix = new Float32Array(16);
		mat4.identity(transformationMatrix);
				
		mat4.translate(transformationMatrix, transformationMatrix, [waterTile.x, waterTile.height, waterTile.z]);

		mat4.scale(transformationMatrix, transformationMatrix, [WaterTileSize, WaterTileSize, WaterTileSize]);

		gl.uniformMatrix4fv(transformationLocation, gl.FALSE, transformationMatrix);
	}

	this.loadView = function(camera)
	{
		var viewMatrix = createViewMatrix(camera);

		gl.uniformMatrix4fv(viewLocation, gl.FALSE, viewMatrix);
		gl.uniform3f(cameraPositionLocation, camera.x, camera.y, camera.z);
	};

	this.loadLight = function(sun) {
		gl.uniform3f(lightPositionLocation, sun.position[0], sun.position[1], sun.position[2]);
		gl.uniform3f(lightColourLocation, sun.colour[0], sun.colour[1], sun.colour[2]);
	}

	this.loadMoveFactor = function() {
		gl.uniform1f(moveFactorLoaction, moveFactor);
	}
}

var ParticleShader = function(waterFBO) {
	this.vertexShaderText =
	[
		'precision mediump float;',
		'attribute vec2 vPos;',
		'varying vec2 texture_Co1;',
		'varying vec2 texture_Co2;',
		'varying float blendFactor;',
		'uniform mat4 projection;',
		'uniform mat4 transformView;',
		'uniform vec2 offset1;',
		'uniform vec2 offset2;',
		'uniform float texturedRows;',
		'uniform float blend;',
		'void main()',
		'{',
		'	vec2 texture_Co = vPos + vec2(0.5, 0.5);',
		'	texture_Co.y = 1.0 - texture_Co.y;',
		'	texture_Co /= texturedRows;',
		'	texture_Co1 = texture_Co + offset1;',
		'	texture_Co2 = texture_Co + offset2;',
		'	blendFactor = blend;',
		'	gl_Position = projection * transformView * vec4(vPos, 0, 1.0);',
		'}'
	].join('\n');

	this.fragmentShaderText =
	[
		'precision mediump float;',
		'varying vec2 texture_Co1;',
		'varying vec2 texture_Co2;',
		'varying float blendFactor;',
		'uniform sampler2D texture;',
		'void main()',
		'{',
		'	vec4 colour1 = texture2D(texture, texture_Co1);',
		'	vec4 colour2 = texture2D(texture, texture_Co2);',
		'	gl_FragColor = mix(colour1, colour2, blendFactor);',
		'}'
	].join('\n');
	
	this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
	this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	
	this.program;
	
	setupShader(this);

	var positionLocation = gl.getAttribLocation(this.program, "vPos");
	var projectionLocation = gl.getUniformLocation(this.program, "projection");
	var transformViewLocation = gl.getUniformLocation(this.program, "transformView");
	var offset1Location = gl.getUniformLocation(this.program, "offset1");
	var offset2Location = gl.getUniformLocation(this.program, "offset2");
	var texturedRowsLocation = gl.getUniformLocation(this.program, "texturedRows");
	var blendLocation = gl.getUniformLocation(this.program, "blend");


	var quad = loadModel([[-0.5,0.5, -0.5,-0.5, 0.5,0.5, 0.5,-0.5]], 2);

	gl.useProgram(this.program);
	gl.uniformMatrix4fv(projectionLocation, gl.FALSE, projMatrix);
	gl.useProgram(null);

	this.render = function(particles, camera) {
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		gl.depthMask(false);

		gl.bindBuffer(gl.ARRAY_BUFFER, quad.data[0]);
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, gl.FALSE, 0, 0);
		gl.enableVertexAttribArray(positionLocation);

		var self = this;
		particles.getArray().forEach(function(a) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, a[0].textureVBO);

			a[1].forEach(function(p) {
				self.loadTransformView(p, camera);
				self.loadTextureInfo(p.textureOffset1, p.textureOffset2, a[0].rows, p.blend);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, quad.vertexCount);
			})
		});

		gl.depthMask(true);
		gl.disable(gl.BLEND);
		gl.disableVertexAttribArray(positionLocation);
	}

	this.loadTextureInfo = function(offset1, offset2, rows, blend) {
		gl.uniform2f(offset1Location, offset1[0], offset1[1]);
		gl.uniform2f(offset2Location, offset2[0], offset2[1]);
		gl.uniform1f(texturedRowsLocation, rows);
		gl.uniform1f(blendLocation, blend);
	}
	
	this.loadTransformView = function(particle, camera)
	{
		var transformationMatrix = new Float32Array(16);
		mat4.identity(transformationMatrix);

		var viewMatrix = new Float32Array(16);
		mat4.identity(viewMatrix);
		
		mat4.rotate(viewMatrix, viewMatrix, toRadians(camera.pitch), [1,0,0]);
		mat4.rotate(viewMatrix, viewMatrix, toRadians(camera.yaw), [0,1,0]);
		mat4.rotate(viewMatrix, viewMatrix, toRadians(camera.roll), [0,0,1]);
		mat4.translate(viewMatrix, viewMatrix, [-camera.x, -camera.y, -camera.z]);

		mat4.translate(transformationMatrix, transformationMatrix, [particle.position[0], particle.position[1], particle.position[2]]);

		transformationMatrix[0] = viewMatrix[0];
		transformationMatrix[1] = viewMatrix[4];
		transformationMatrix[2] = viewMatrix[8];
		transformationMatrix[4] = viewMatrix[1];
		transformationMatrix[5] = viewMatrix[5];
		transformationMatrix[6] = viewMatrix[9];
		transformationMatrix[8] = viewMatrix[2];
		transformationMatrix[9] = viewMatrix[6];
		transformationMatrix[10] = viewMatrix[10];

		
		mat4.scale(transformationMatrix, transformationMatrix, [particle.scale, particle.scale, particle.scale]);

		transformViewMatrix = mat4.multiply(viewMatrix, viewMatrix, transformationMatrix);
		
		gl.uniformMatrix4fv(transformViewLocation, gl.FALSE, transformViewMatrix);
	};
}

var ShapeShader = function() {
	this.vertexShaderText =
	[
		'precision mediump float;',
		'attribute vec3 vPos;',
		'{',
		'	gl_Position = vec4(vPos, 1.0)',
		'}'
	].join('\n');

	this.fragmentShaderText =
	[
		'precision mediump float;',
		'void main()',
		'{',
		'	gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);',
		'}'
	].join('\n');
	
	this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
	this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	
	this.program;
	
	setupShader(this);
		
	var positionLocation = gl.getAttribLocation(this.program, 'vPos');

	this.render = function(positionModel) {

	}
}

function enableCulling()
{
	gl.enable(gl.CULL_FACE);
}

function disableCulling()
{
	gl.disable(gl.CULL_FACE);
}
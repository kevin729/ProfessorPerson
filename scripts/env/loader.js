function loadModel(data, dimensions, boundingBoxes, collisionModel)
{
	var modelData = [];
	var vertexCount = 0; 
	
	if (data[0] != undefined) {
		var verticesVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, verticesVBO);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data[0]), gl.STATIC_DRAW);
		modelData[0] = verticesVBO;
		vertexCount = data[0].length/dimensions;
	}
	
	if (data[1] != undefined) {	
		var textureCoVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, textureCoVBO);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data[1]), gl.STATIC_DRAW);
		modelData[1] = textureCoVBO;
	}

	if (data[2] != undefined) {
		var normalsVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, normalsVBO);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data[2]), gl.STATIC_DRAW);
		modelData[2] = normalsVBO;
	}
	
	if (data[3] != undefined) {
		var indexVBO = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexVBO);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data[3]), gl.STATIC_DRAW);
		modelData[3] = indexVBO;
		vertexCount = data[3].length;
	}
				
	unbind();
		
	return new Model(modelData, vertexCount, boundingBoxes, collisionModel);
}

function loadCubeMap(images) {
	var textureVBO = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, textureVBO);

	for (i=0; i<images.length; i++) {
		var imageCanvas = document.createElement('canvas');
		imageCanvas.width = images[i].width;
		imageCanvas.height = images[i].height;
		var ctx = imageCanvas.getContext('2d');
		ctx.drawImage(images[i], 0, 0);

		gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X+i, 0, gl.RGBA, images[i].width, images[i].height, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(ctx.getImageData(0, 0, images[i].width, images[i].height).data));
	}


	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	gl.bindTexture(gl.TEXTURE_CUBE_MAP, textureVBO);

	return textureVBO;
}
	
function loadTexture(textureName, image, specImageFile)
{
	var textureVBO = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, textureVBO);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	var ext = (
  		gl.getExtension('EXT_texture_filter_anisotropic') ||
  		gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
  		gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
	);

	if (ext) {
		var amount = Math.min(4, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
		gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, amount);
	}
		
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);

	var texture = new Texture(textureName, textureVBO);

	if (!(specImageFile === undefined)) {
		var img = new Image();
		img.onload = function() {
			texture.textureSpecVBO = loadTexture(textureName+"Spec", img).textureVBO;
		}
		img.src = specImageFile;
	}
	
	return texture;
}

function loadSkyBoxes(index, i, callback) {
	if(i == 0)
		textureImages[index][3] = [];

	var img = new Image();
	img.onload = function() {
		textureImages[index][3][i] = img;
		i++;
		if(i == 6) {
			index++;
			i = 0;
		}

		if(index < textureImages.length)
			loadTextures(index, i, callback)
		else
			callback();
	}
	img.src = textureImages[index][1][i];
}

function loadModels() {
	for (var i = 0; i < models.length; i++) {
		models[i][2] = loadObj(models[i][1][0], models[i][1][1])
	}
}

function loadTextures(index, i, callback) {
	if (textureImages[index][2] == 'TEXTURE') {
		var img = new Image();
		img.onload = function() {	
			textureImages[index][7] = loadTexture(textureImages[index][0], img, textureImages[index][1][1]);
			textureImages[index][7].rows = textureImages[index][3];
			textureImages[index][7].reflectivity = textureImages[index][4];
			textureImages[index][7].shineDamper = textureImages[index][5];
			textureImages[index][7].hasTransparency = textureImages[index][6];
			textureImages[index][8] = img;
			index++;
			if(index < textureImages.length)
				loadTextures(index, i, callback);
			else
				callback();
		}
		img.src = textureImages[index][1][0];
	} else if(textureImages[index][2] == 'SKYBOX') {
		loadSkyBoxes(index, i, callback)
	}
}

function loadObj(file, collisionFile)
{
	var boxSizeMin = 0;
	var boxSizeMax = 0;
	
	var textureCo = [];
	var normals = [];

	var verticesA = [];
	var textureCoA = [];
	var normalsA = [];
	var indicesA = [];
	
	var vertexArray = [];
	var textureArray = [];
	var normalArray = [];

	var triangles = [];
	
	var path = "models/"+file+".obj";
	var client = new XMLHttpRequest();
	client.open("GET", path, false);
	client.send(null);
	var text = client.responseText;
	
	lines = text.split('\n');
	
	var self = this;
	
	this.dealWithProcessedVertex = function(currentVertex, textureIndex, normalIndex)
	{
		if(currentVertex.hasSameTextureAndNormal(textureIndex, normalIndex))
			indicesA.push(currentVertex.index);
		else{
			var duplicate = currentVertex.duplicatedVertex;
			if (duplicate != null) {
				dealWithProcessedVertex(duplicate, textureIndex, normalIndex);
			} else {
				var duplicateVertex = new Vertex(verticesA.length, currentVertex.position);
				duplicateVertex.textureIndex = textureIndex;
				duplicateVertex.normalIndex = normalIndex;
				currentVertex.duplicatedVertex = duplicateVertex;
				verticesA.push(duplicateVertex);
				indicesA.push(duplicateVertex.index);
			}
		}
	};
	
	this.processVertex = function(vertexD)
	{
		var index = parseInt(vertexD[0]) - 1;
		var currentVertex = verticesA[index];
		var textureIndex = parseInt(vertexD[1]) - 1;
		var normalIndex = parseInt(vertexD[2]) - 1;
		
		if(!currentVertex.isSet()) {
			currentVertex.textureIndex = textureIndex;
			currentVertex.normalIndex = normalIndex;
			indicesA.push(index);
		} else {
			dealWithProcessedVertex(currentVertex, textureIndex, normalIndex);
		}

		return [verticesA[index].position[0], verticesA[index].position[1], verticesA[index].position[2]];
	};
	
	this.convertArrays = function()
	{
		for(i = 0; i < verticesA.length; i++)
		{
			currentVertex = verticesA[i];
			
			vertexArray[i*3] = currentVertex.position[0];
			vertexArray[i*3+1] = currentVertex.position[1];
			vertexArray[i*3+2] = currentVertex.position[2];
			
			textureArray[i*2] = textureCo[currentVertex.textureIndex*2];
			textureArray[i*2+1] = 1 - textureCo[currentVertex.textureIndex*2+1];
			
			normalArray[i*3] = normals[currentVertex.normalIndex*3];
			normalArray[i*3+1] = normals[currentVertex.normalIndex*3+1];
			normalArray[i*3+2] = normals[currentVertex.normalIndex*3+2];
		};
	};
	
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];
		currentLine = line.split(" ");

		if (line.startsWith("v ")) {
			var vertex = new Vertex(verticesA.length, [parseFloat(currentLine[1]), parseFloat(currentLine[2]), parseFloat(currentLine[3])]);
			verticesA.push(vertex);

			if (vertex.position[0] < boxSizeMin) 
				boxSizeMin = vertex.position[0];
			if (vertex.position[0] > boxSizeMax)
				boxSizeMax = vertex.position[0];
			
			if (vertex.position[1] < boxSizeMin)
				boxSizeMin = vertex.position[1];
			if (vertex.position[1] > boxSizeMax)
				boxSizeMax = vertex.position[1];
			
			if (vertex.position[2] < boxSizeMin)
				boxSizeMin = vertex.position[2];
			if (vertex.position[2] > boxSizeMax)
				boxSizeMax = vertex.position[2];			
		} else if(line.startsWith("vt ")) {
			textureCo.push(parseFloat(currentLine[1]));
			textureCo.push(parseFloat(currentLine[2]));
		} else if(line.startsWith("vn ")) {
			normals.push(parseFloat(currentLine[1]));
			normals.push(parseFloat(currentLine[2]));
			normals.push(parseFloat(currentLine[3]));
		} else if(line.startsWith("f ")) {
			vertexData1 = currentLine[1].split("/");
			vertexData2 = currentLine[2].split("/");
			vertexData3 = currentLine[3].split("/");

			var v0 = this.processVertex(vertexData1)
			var v1 = this.processVertex(vertexData2)
			var v2 = this.processVertex(vertexData3)
		}
	}
	
	this.convertArrays();

	var boundingBox = new BoundingBox(boxSizeMin, boxSizeMax);
	
	if (collisionFile == null) {
		return loadModel([vertexArray,textureArray,normalArray,indicesA], 3, boundingBox);
	} else {	
		return loadModel([vertexArray,textureArray,normalArray,indicesA], 3, boundingBox, loadCollisionModel(collisionFile));
	}
}

function loadCollisionModel(file) {
	var verticesA = [];
	var indicesA = [];

	var triangles = [];

	var path = "models/"+file+".obj";
	var client = new XMLHttpRequest();
	client.open("GET", path, false);
	client.send(null);
	var text = client.responseText;
	
	lines = text.split('\n');

	this.processVertex = function(vertexD)
	{
		var index = parseInt(vertexD[0]) - 1;

		return [verticesA[index].position[0], verticesA[index].position[1], verticesA[index].position[2]];
	};

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];
		currentLine = line.split(" ");

		if (line.startsWith("v ")) {
			var vertex = new Vertex(verticesA.length, [parseFloat(currentLine[1]), parseFloat(currentLine[2]), parseFloat(currentLine[3])]);
			verticesA.push(vertex);
		} else if (line.startsWith("f ")) {
			vertexData1 = currentLine[1].split("/");
			vertexData2 = currentLine[2].split("/");
			vertexData3 = currentLine[3].split("/");

			var v0 = this.processVertex(vertexData1)
			var v1 = this.processVertex(vertexData2)
			var v2 = this.processVertex(vertexData3)

			var vector1 = subtractVector(v1, v0);
			var vector2 = subtractVector(v2, v0);

			triangles.push(new Triangle(v0, v1, v2));
		}
	}

	return new CollisionModel(triangles);
}

function loadTerrain(terrain)
{
	VERTEX_COUNT = terrain.heightMap.height;
	SIZE = terrain.SIZE;
	MAX_PIXEL_COLOUR = 256*256*256;
	var vertices = [];
	var normals = [];
	var textureCoords = [];
	var indices = [];
	var vertexPointer = 0;
	for(i=0;i<VERTEX_COUNT;i++){
		terrain.heights[i] = [];
		for(j=0;j<VERTEX_COUNT;j++){
			var height = terrain.getHeight(j, i);
			terrain.heights[i][j] = height;
			vertices[vertexPointer*3] = j/(VERTEX_COUNT - 1) * SIZE;
			vertices[vertexPointer*3+1] = height;
			vertices[vertexPointer*3+2] = i/(VERTEX_COUNT - 1) * SIZE;
			normal = terrain.calculateNormal(j, i);
			normals[vertexPointer*3] = normal[0];
			normals[vertexPointer*3+1] = normal[1];
			normals[vertexPointer*3+2] = normal[2];
			textureCoords[vertexPointer*2] = j/(VERTEX_COUNT - 1);
			textureCoords[vertexPointer*2+1] = i/(VERTEX_COUNT - 1);
			vertexPointer++;
		};
	};
	var pointer = 0;
	for(gz=0;gz<VERTEX_COUNT-1;gz++){
		for(gx=0;gx<VERTEX_COUNT-1;gx++){
			var topLeft = (gz*VERTEX_COUNT)+gx;
			var topRight = topLeft + 1;
			var bottomLeft = ((gz+1)*VERTEX_COUNT)+gx;
			var bottomRight = bottomLeft + 1;
			indices[pointer++] = topLeft;
			indices[pointer++] = bottomLeft;
			indices[pointer++] = topRight;
			indices[pointer++] = topRight;
			indices[pointer++] = bottomLeft;
			indices[pointer++] = bottomRight;
		};
	};
	
	return loadModel([vertices,textureCoords,normals,indices], 3);
}
	
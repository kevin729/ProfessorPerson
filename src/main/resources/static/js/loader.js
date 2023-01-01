var entities = []
var objects = {}
var models = {}
var textures = {
	"logo" : {image: ppurl+"images/logo.png", reflection:0.1, shineDamp:1, useFakeLighting:false, disableCull:false}
}
var light = {position:[0, 0, -10]}
var camera = {x: 0, y:0, z:0}

var running = false

var canvas
var gl
var shader

function init3D(_canvas) {
  canvas = _canvas

  if (canvas == null) {
      return
  }

  gl = this.canvas.getContext('webgl')
  if (!gl)
      gl = canvas.getContext('experimental-webgl')
  if (!gl)
      alert('Your browser does not support webgl')

  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)

  setupShader()
  
  loadTextures(0, () => {
	loadEntity(getCubeModel(), [0, 0, -5], [0, 0, 0], [1, 1, 1], gl.TRIANGLES, "cubelogo", textures["logo"])
	loop(() => {
		entities[0].rotation[1] += 3
		
	})
  })
  

  entities = []
  objects = {}
}

var interval;
function loop(callback) {
  if (!running) {
    interval = setInterval(() => {
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      render()

      if (callback != null) {
        callback()
      }
    }, 60);
  }
  running = true
}

function addCube(x, y, z, name) {
    loadEntity(getCubeModel(), [x, y, z], [0, 0, 0], [1, 1, 1], gl.TRIANGLE, name)
}

function addTriangle(x, y, z, name) {
  triangleModel = loadModel(createTriangle())
  entities.push(loadEntity(triangleModel, [x, y, z], [0, 0, 0], [1, 1, 1], gl.TRIANGLE, name))
}

function getCubeModel() {
	cubeData = createCube([-1, -1, -1], [1, 1, 1], [
		[255, 0, 255],
		[255, 0.68, 0.21],
		[255, 50, 0.5],
		[0, 255, 255],
		[0.83, 255, 0.21],
		[0, 0, 255],
	],)

	return loadModel(cubeData, name)
}

function getObjects() {
  return objects;
}

function loadTextures(index, callback) {
	var key = Object.keys(textures)[index]
	if (key == null) {
		return
	}

	var img = new Image()
	img.onload = function() {
		var textureVBO = gl.createTexture()
		gl.bindTexture(gl.TEXTURE_2D, textureVBO)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
		gl.bindTexture(gl.TEXTURE_2D, null)

		textures[key].textureVBO = textureVBO

		//next
		if (Object.keys(textures)[index+1] != null) {
			loadTextures(index+1, callback)
		} else {
			callback()
		}
	}
	img.src = textures[key].image
}

function loadModel(modelData, name) {
	var vBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.vertices), gl.STATIC_DRAW)
	gl.bindBuffer(gl.ARRAY_BUFFER, null)

	var tBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.textureCo), gl.STATIC_DRAW)
	gl.bindBuffer(gl.ARRAY_BUFFER, null)

	var cBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.colours), gl.STATIC_DRAW)
	gl.bindBuffer(gl.ARRAY_BUFFER, null)

	var nBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.normals), gl.STATIC_DRAW)
	gl.bindBuffer(gl.ARRAY_BUFFER, null)

	var iBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer)
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelData.indices), gl.STATIC_DRAW)
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

	var model = {
		vBuffer,
		tBuffer,
		cBuffer,
		nBuffer,
		iBuffer,
		indices : modelData.indices
	}

	models[name] = model
	return model
}

function loadEntity(model, position, rotation, scale, drawMethod, name, texture) {
	let reflection = 0.5
	let shineDamp = 0.5

	if (texture != null) {
		reflection = texture.reflection
		shineDamp = texture.shineDamp
	}

	var entity = {
		model,
		texture,
		position,
		rotation,
		scale,
		"drawMethod" : drawMethod != null ? drawMethod : gl.TRIANGLES,
		useTexture : texture != null,
		reflection,
		shineDamp
	}
	objects[name] = entity
	entities.push(entity)
	return entity
}

function connectObjects() {
	var obj = {
		vertices : [],
		colours : [],
		normals : [],
		indices : []
	}

	obj.vertices = obj.vertices.concat(arguments[0].vertices)
	obj.colours = obj.colours.concat(arguments[0].colours)
	obj.normals = obj.normals.concat(arguments[0].normals)
	obj.indices = obj.indices.concat(arguments[0].indices)

	for (i = 1; i < arguments.length; i++) {
		obj.vertices = obj.vertices.concat(arguments[i].vertices)
		obj.colours = obj.colours.concat(arguments[i].colours)
		obj.normals = obj.normals.concat(arguments[i].normals)

		maxIndex = Math.max(...obj.indices)

		for (j = 0; j < arguments[i].indices.length; j++) {
			obj.indices.push(arguments[i].indices[j] + maxIndex + 1)
		}
	}

	return obj
}

function createTriangle() {
	var triangle = {
		vertices : [
			//top
			0, 2, 0,
			//left
			-2, -2, 0,
			//right
			2, -2, 0
		],

		textureCo : [
			0.5, 1,
			0, 0,
			1, 1
		],

		normals : [
			0, 0, -1,
			0, 0, -1,
			0, 0, -1
		],

		colours : [
			1, 5, 1, 1,
			1, 1, 5, 1,
			5, 1, 1, 1,
		],

		indices : [
			0, 1, 2
		]
	}

	return triangle
}

function createCube(min, max, colour) {
	var cube = {
		vertices : [
				//front
				max[0], max[1], max[2], //0
				min[0], max[1], max[2], //1
				min[0], min[1], max[2], //2
				max[0], min[1], max[2], //3

				//back
				max[0], max[1], min[2], //4
				min[0], max[1], min[2], //5
				min[0], min[1], min[2], //6
				max[0], min[1], min[2], //7

				//Top
				max[0], max[1], max[2], //8
				max[0], max[1], min[2], //9
				min[0], max[1], max[2], //10
				min[0], max[1], min[2], //11

				//Bottom
				max[0], min[1], max[2], //12
				min[0], min[1], max[2], //13
				max[0], min[1], min[2], //14
				min[0], min[1], min[2], //15

				//right
				max[0], max[1], max[2], //16
				max[0], min[1], max[2], //17
				max[0], max[1], min[2], //18
				max[0], min[1], min[2], //19

				//left
				min[0], max[1], max[2], //20
				min[0], max[1], min[2], //21
				min[0], min[1], max[2], //22
				min[0], min[1], min[2] //23
		],

		textureCo : [
			1, 0,
			0, 0,
			0, 1,
			1, 1,

			0, 0,
			1, 0,
			1, 1,
			0, 1,

			1, 1,
			1, 0,
			0, 1,
			0, 0,

			1, 1,
			0, 1,
			1, 0,
			0, 0,

			0, 0,
			0, 1,
			1, 0,
			1, 1,

			1, 0,
			0, 0,
			1, 1,
			0, 1
		],

		colours : [
				//front
				colour[0][0], colour[0][1], colour[0][2], 1,
				colour[0][0], colour[0][1], colour[0][2], 1,
				colour[0][0], colour[0][1], colour[0][2], 1,
				colour[0][0], colour[0][1], colour[0][2], 1,

				//back
				colour[1][0], colour[1][1], colour[1][2], 1,
				colour[1][0], colour[1][1], colour[1][2], 1,
				colour[1][0], colour[1][1], colour[1][2], 1,
				colour[1][0], colour[1][1], colour[1][2], 1,

				//Top
				colour[2][0], colour[2][1], colour[2][2], 1,
				colour[2][0], colour[2][1], colour[2][2], 1,
				colour[2][0], colour[2][1], colour[2][2], 1,
				colour[2][0], colour[2][1], colour[2][2], 1,

				//Bottom
				colour[3][0], colour[3][1], colour[3][2], 1,
				colour[3][0], colour[3][1], colour[3][2], 1,
				colour[3][0], colour[3][1], colour[3][2], 1,
				colour[3][0], colour[3][1], colour[3][2], 1,

				//right
				colour[4][0], colour[4][1], colour[4][2], 1,
				colour[4][0], colour[4][1], colour[4][2], 1,
				colour[4][0], colour[4][1], colour[4][2], 1,
				colour[4][0], colour[4][1], colour[4][2], 1,

				//left
				colour[5][0], colour[5][1], colour[5][2], 1,
				colour[5][0], colour[5][1], colour[5][2], 1,
				colour[5][0], colour[5][1], colour[5][2], 1,
				colour[5][0], colour[5][1], colour[5][2], 1,
		],
		

		normals : [
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		0, 0, -1,
		0, 0, -1,
		0, 0, -1,
		0, 0, -1,
		0, 1, 0,
		0, 1, 0,
		0, 1, 0,
		0, 1, 0,
		0, -1, 0,
		0, -1, 0,
		0, -1, 0,
		0, -1, 0,
		1, 0, 0,
		1, 0, 0,
		1, 0, 0,
		1, 0, 0,
		-1, 0, 0,
		-1, 0, 0,
		-1, 0, 0,
		-1, 0, 0
		],

		indices : [0, 1, 2, //front
			   0, 2, 3, //front
			   4, 7, 6, //back
			   4, 6, 5, //back
			   8, 9, 10, //top
			   10, 9, 11, //top
			   12, 13, 14, //bottom
			   13, 15, 14, //bottom
			   16, 17, 18, //right
			   17, 19, 18, //right
			   20, 21, 22, //left
			   21, 23, 22 //left
 		]
	}


	return cube
}

function loadFile(file)
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

	return loadModel({vertices : vertexArray, textureCo: textureArray, normals: normalArray, indices : indicesA})
}

class Vertex {
    constructor(index, position) {
        var NO_INDEX = -1

        this.textureIndex = NO_INDEX
        this.normalIndex = NO_INDEX
        this.duplicateVertex = null

        this.index = index
        this.position = position

        this.isSet = function() {
            return this.textureIndex != NO_INDEX && this.normalIndex != NO_INDEX
        }

        this.hasSameTextureAndNormal = function(textureIndexOther, normalIndexOther) {
            return textureIndexOther == this.textureIndex && normalIndexOther == this.normalIndex
        }
    }
}

function toRadians(degrees) {
	return degrees*(Math.PI/180)
}

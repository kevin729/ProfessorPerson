var models = []
var keys = []

var earth
var satellite

var shader
var origin = [0, 0, 0]
var light = {
	position : [Math.cos(toRadians(-60)) * Math.sin(toRadians(-60)), Math.cos(0) * Math.sin(toRadians(-60)), 0],
	direction : [0, 0, 0]
}

var camera = {
	x : 0,
	y : 0,
	z : 30,
	rX : 0,
	rY : 0,
	rZ : 0
}

var textures = {
	earth : {image : "images/earth.jpg", reflect : 0.5, shineDamp : 10}
}

function loadTextures(index, callBack) {
	
	var key = Object.keys(textures)[index]
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

		textures[key].texture = textureVBO

		if (Object.keys(textures)[index+1] != null) {
			loadTextures(index+1, callBack)
		} else {
			callBack()
		}
	}
	img.src = textures[key].image
}

function loadObject(obj, textureData, drawMethod, position, rotation, scale) {
	var vBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.vertices), gl.STATIC_DRAW)
	gl.bindBuffer(gl.ARRAY_BUFFER, null)

	var tBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.textureCo), gl.STATIC_DRAW)
	gl.bindBuffer(gl.ARRAY_BUFFER, null)

	var texture = null
	var reflect = 0.5
	var shineDamp = 5000
	if (textureData != null) {
		texture = textureData.texture
		reflect = textureData.reflect
		shineDamp = textureData.shineDamp
	}

	var cBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.colours), gl.STATIC_DRAW)
	gl.bindBuffer(gl.ARRAY_BUFFER, null)

	var nBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.normals), gl.STATIC_DRAW)
	gl.bindBuffer(gl.ARRAY_BUFFER, null)

	var iBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer)
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(obj.indices), gl.STATIC_DRAW)
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

	var model = {
		vBuffer,
		tBuffer,
		cBuffer,
		nBuffer,
		iBuffer,
		useTexture : texture != null,
		textureVBO : texture,
		reflect,
		shineDamp,
		indices : obj.indices,
		drawMethod : drawMethod,
		position,
		rotation,
		scale,
		angle : 0
	}

	return model
}

function initObjects() {
	//draw sphere
	var sphere = {vertices : [], textureCo : [], normals : [], indices : []}
	var halfPolygons = 20
	var polygonSize = Math.PI/halfPolygons
	var polygons = (halfPolygons*halfPolygons*2)

	var oldSinX = 0
	var oldCosX = Math.cos((1 * polygonSize) - polygonSize/2)
	for (var x = 1; x <= polygons; x++) {
		var i = x-1
		var y = (Math.floor(i/(halfPolygons*2)) - (halfPolygons/2-0.5)) * polygonSize
		var xIndex = i%(halfPolygons*2)
		var yIndex = (y/polygonSize) + (halfPolygons/2-0.5)

		var sinX = Math.sin((xIndex+1) * polygonSize)
		var cosX = Math.cos(((xIndex+1) * polygonSize) - polygonSize/2)
		var sinYUp = Math.sin(y+polygonSize/2)
		var sinYDown = Math.sin(y+(-polygonSize/2))
		var cosYUp = Math.cos(y+polygonSize/2)
		var cosYDown = Math.cos(y+(-polygonSize/2))

		var v1 = [sinX * cosYUp, sinYUp, cosX * cosYUp] 
		var v2 = [oldSinX * cosYUp, sinYUp, oldCosX * cosYUp]
		var v3 = [oldSinX * cosYDown, sinYDown, oldCosX * cosYDown]
		var v4 = [sinX * cosYDown, sinYDown, cosX * cosYDown]

		sphere.vertices = sphere.vertices.concat(v1, v2, v3, v4)
		sphere.textureCo.push(1/(halfPolygons*2) * (xIndex+1), 1 - (1/halfPolygons * (yIndex+1)), 
							  1/(halfPolygons*2) * xIndex, 1 - (1/halfPolygons * (yIndex+1)),
							  1/(halfPolygons*2) * xIndex, 1 - (1/halfPolygons * yIndex),
							  1/(halfPolygons*2) * (xIndex+1), 1 - (1/halfPolygons * yIndex))


		sphere.normals = sphere.normals.concat(v1, v2, v3, v4)
		
		sphere.indices.push(4*i, 4*i+1, 4*i+2, 4*i, 4*i+2, 4*i+3)

		oldSinX = sinX
		oldCosX = cosX	
	}

	earth = loadObject(sphere, textures.earth, gl.TRIANGLES, [0, 0, 0], [0, 0, 0], [10, 10 ,10])

	satelliteBody = createCube([-1, -1, -1], [1, 1, 1], [
														[0, 0, 0],
														[0.83, 0.68, 0.21], 
														[0.83, 0.68, 0.21],
														[0.83, 0.68, 0.21],
														[0.83, 0.68, 0.21], 
														[0.83, 0.68, 0.21],
													], [0, 0, 50], [0, 0, 0], [1, 1, 1], 1, 5000)
	
	rod1 = createCube([-1.5, -0.1, -0.1], [-1, 0.1, 0.1], [
														[0.83, 0.68, 0.21], 
														[0.83, 0.68, 0.21], 
														[0.83, 0.68, 0.21],
														[0.83, 0.68, 0.21], 
														[0.83, 0.68, 0.21], 
														[0.83, 0.68, 0.21]
														], [0, 0, 50], [0, 0, 0], [1, 1, 1], 1, 5000)

	panel1 = createCube([-3.5, -0.01, -0.5], [-1.5, 0.01, 0.5], [[0.08, 0.27, 0.54],
														   [0.08, 0.27, 0.54],
														   [0.08, 0.27, 0.54],
														   [0.08, 0.27, 0.54],
														   [0.08, 0.27, 0.54],
														   [0.08, 0.27, 0.54]], [0, 0, 50], [0, 0, 0], [1, 1, 1], 1, 5000)

	rod2 = createCube([1, -0.1, -0.1], [1.5, 0.1, 0.1], [
														[0.83, 0.68, 0.21], 
														[0.83, 0.68, 0.21], 
														[0.83, 0.68, 0.21],
														[0.83, 0.68, 0.21], 
														[0.83, 0.68, 0.21], 
														[0.83, 0.68, 0.21]
														], [0, 0, 50], [0, 0, 0], [1, 1, 1], 1, 5000)

	panel2 = createCube([1.5, -0.01, -0.5], [3.5, 0.01, 0.5], [[0.08, 0.27, 0.54],
														   [0.08, 0.27, 0.54],
														   [0.08, 0.27, 0.54],
														   [0.08, 0.27, 0.54],
														   [0.08, 0.27, 0.54],
														   [0.08, 0.27, 0.54]], [0, 0, 50], [0, 0, 0], [1, 1, 1], 1, 5000)

	rod3 = createCube([-0.1, -0.1, 1], [0.1, 0.1, 1.4], [
														[0.83, 0.68, 0.21], 
														[0.83, 0.68, 0.21], 
														[0.83, 0.68, 0.21],
														[0.83, 0.68, 0.21], 
														[0.83, 0.68, 0.21], 
														[0.83, 0.68, 0.21]
														], [0, 0, 50], [0, 0, 0], [1, 1, 1], 1, 5000)

	antenna = createDish(-1.4)

	models.push(earth)

	satelliteData = connectObjects(satelliteBody, rod1, panel1, rod2, panel2, rod3, antenna)
	satellite = loadObject(satelliteData, null, gl.TRIANGLES, [0, 0, 50], [0, 180, 0], [1, 1, 1])

	models.push(satellite)
	start()
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

function createDish(minZ) {
	var halfPolygons = 100
	var polygonSize = Math.PI/halfPolygons
	var polygons = halfPolygons * 2

	var dish = {
		vertices : [],

		colours : [],
	
		normals : [],

		indices : []
	}

	var oldSinX = 0
	var oldCosY = 1

	for (var i = 0; i < polygons * 3 - 1; i++) {
		var x = (i % polygons) + 1;
		var z = Math.floor(i / polygons)

		var v1 = [oldSinX * z, oldCosY * z, -minZ]
		var v2 = [oldSinX * (z + 1), oldCosY * (z + 1), z - minZ]
		var v3 = [Math.sin(x * polygonSize) * (z + 1), Math.cos(x * polygonSize) * (z + 1), z - minZ]

		dish.vertices = dish.vertices.concat(v1, v2, v3, v1, v2, v3)

		var edge1 = subtractVector(v2, v1)
		var edge2 = subtractVector(v3, v1)

		var normal = normalise(crossProduct(edge1, edge2))

		dish.colours.push(0.83, 0.68, 0.21, 1, 0.83, 0.68, 0.21, 1, 0.83, 0.68, 0.21, 1, 0.83, 0.68, 0.21, 1, 0.83, 0.68, 0.21, 1, 0.83, 0.68, 0.21, 1)
		dish.normals = dish.normals.concat(normal, normal, normal, invertVector(normal), invertVector(normal), invertVector(normal))
		dish.indices.push(i*6, i*6+1, i*6+2, i*6+5, i*6+4, i*6+3)

		if (z != 0) {
			var v4 = v1
			var v5 = v3
			var v6 = [Math.sin((x+1) * polygonSize) * z, Math.cos((x+1) * polygonSize) * z, -minZ]

			dish.vertices = dish.vertices.concat(v4, v5, v6, v4, v5, v6)

			edge1 = subtractVector(v5, v4)
			edge2 = subtractVector(v6, v4)

			normal = normalise(crossProduct(edge1, edge2))

			dish.colours.push(0.83, 0.68, 0.21, 1, 0.83, 0.68, 0.21, 1, 0.83, 0.68, 0.21, 1, 0.83, 0.68, 0.21, 1, 0.83, 0.68, 0.21, 1, 0.83, 0.68, 0.21, 1)
			dish.normals = dish.normals.concat(normal, normal, normal, invertVector(normal), invertVector(normal), invertVector(normal))
			dish.indices.push(i*6+6, i*6+7, i*6+8, i*6+11, i*6+10, i*6+9)
		}

		oldSinX = Math.sin(x * polygonSize)
		oldCosY = Math.cos(x * polygonSize)
	}
	
	return dish
}

function createCube(min, max, colour, position, rotation, scale, reflect, shineDamp) {
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

		colours : [
				colour[0][0], colour[0][1], colour[0][2], 1,
				colour[0][0], colour[0][1], colour[0][2], 1,
				colour[0][0], colour[0][1], colour[0][2], 1,
				colour[0][0], colour[0][1], colour[0][2], 1,

				colour[1][0], colour[1][1], colour[1][2], 1,
				colour[1][0], colour[1][1], colour[1][2], 1,
				colour[1][0], colour[1][1], colour[1][2], 1,
				colour[1][0], colour[1][1], colour[1][2], 1,

				colour[2][0], colour[2][1], colour[2][2], 1,
				colour[2][0], colour[2][1], colour[2][2], 1,
				colour[2][0], colour[2][1], colour[2][2], 1,
				colour[2][0], colour[2][1], colour[2][2], 1,

				colour[3][0], colour[3][1], colour[3][2], 1,
				colour[3][0], colour[3][1], colour[3][2], 1,
				colour[3][0], colour[3][1], colour[3][2], 1,
				colour[3][0], colour[3][1], colour[3][2], 1,

				colour[4][0], colour[4][1], colour[4][2], 1,
				colour[4][0], colour[4][1], colour[4][2], 1,
				colour[4][0], colour[4][1], colour[4][2], 1,
				colour[4][0], colour[4][1], colour[4][2], 1,

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
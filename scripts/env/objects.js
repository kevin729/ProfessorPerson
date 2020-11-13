var GRAVITY = -200;

var models = [
	["player", ["character1N", "character1NCollision"]],
	["player2", ["character2NCollision", "character2NCollision"]],
	["tree", ["treeOne", "treeOneCollision"]],
	["cube", ["cube", "cube"]],
	["cubeHole", ["cubeHole", "cubeHole"]],
	["ramp", ["ramp", "ramp"]],
	["house", ["house", "house"]]
];

var textureImages = [
	["characterTexture", ["images/characterNMD.png"], "TEXTURE", 1, 0, 10, false],
	["grassTexture", ["images/grass2.png"], "TEXTURE", 1, 0, 10, false], 
	["dirtTexture", ["images/dirt2.png"], "TEXTURE", 1, 0, 10, false],
	["rockTexture", ["images/rock.png"], "TEXTURE", 1, 0, 10, false],
	["blendMapTexture", ["images/blendMap.png"], "TEXTURE", 1, 0, 10, false],
	["heightMap", ["images/heightMap.png"], "TEXTURE", 1, 0, 10, false],
	["stallTexture", ["images/stall.png"], "TEXTURE", 1, 0, 10, false],
	["logoTexture", ["images/ppLogo.png"], "TEXTURE", 1, 0, 10, false],
	["lampTexture", ["images/lamp.png", "images/lampSpec.png"], "TEXTURE", 1, 0, 10, false],
	["dayBox", ["images/cloudtop_rt.png", "images/cloudtop_lf.png", "images/cloudtop_up.png", "images/cloudtop_dn.png", "images/cloudtop_bk.png", "images/cloudtop_ft.png"], "SKYBOX"],
	["nightBox", ["images/purplenebula_rt.png", "images/purplenebula_lf.png", "images/purplenebula_up.png", "images/purplenebula_dn.png", "images/purplenebula_bk.png", "images/purplenebula_ft.png"], "SKYBOX"],
	["waterDUDVTexture", ["images/waterDUDV.jpg"], "TEXTURE", 1, 0, 10],
	["waterNormalMapTexture", ["images/waterNormalMap.png"], "TEXTURE", 1, 0, 10, false],
	["treeTexture", ["images/TreeOneTexture.png"], "TEXTURE", 2, 0, 10, true],
	["fireTexture", ["images/fire2.png"], "TEXTURE", 2, 0, 10, true]
];

var Model = function(data, VertexCount, boundingBox, collisionModel)
{
	this.vertexCount = VertexCount;
	this.data = data;
	this.boundingBox = boundingBox;
	this.collisionModel = collisionModel;
}

var CollisionModel = function(triangles) {
	this.triangles = triangles;
}

var BoundingBox = function(sizeMin, sizeMax) {

	this.sizeMin = sizeMin;
	this.sizeMax = sizeMax;
}

var Particle = function(position, velocity, timeToLive, gravity, rotation, scale, particleTexture) {
	this.elapsedTime = 0;
	this.alive = true;
	this.position = position;
	this.velocity = velocity;
	this.timeToLive = timeToLive;
	this.gravity = gravity;
	this.rotation = rotation;
	this.scale = scale;
	this.texture = particleTexture;
	this.textureOffset1 = [];
	this.textureOffset2 = [];
	this.blend = 0;

	this.tick = function() {
		this.velocity[1] += GRAVITY * this.gravity * delta;
		this.position[0] += this.velocity[0] * delta;
		this.position[1] += this.velocity[1] * delta;
		this.position[2] += this.velocity[2] * delta;
		this.updateTextureCo();
		this.elapsedTime += delta;
		this.alive = this.elapsedTime < this.timeToLive; 
	}

	this.updateTextureCo = function() {
		var lifeFactor = this.elapsedTime/this.timeToLive;
		var stageCount = this.texture.rows*this.texture.rows;
		var atlasProg = lifeFactor * stageCount;
		var index1 = Math.floor(atlasProg);
		var index2 = index1 < stageCount-1 ? index1+1 : index1;
		this.blend = atlasProg % 1;
		this.textureOffset1[0] = (index1%this.texture.rows)/this.texture.rows;
		this.textureOffset1[1] = (Math.floor(index1/this.texture.rows))/this.texture.rows;
		this.textureOffset2[0] = (index2%this.texture.rows)/this.texture.rows;
		this.textureOffset2[1] = (Math.floor(index2/this.texture.rows))/this.texture.rows;
	}
}

var UIObject = function(position, scale, texture) {
	this.position = position;
	this.scale = scale;
	this.texture = texture;
}

var Texture = function(textureName, TextureVBO)
{
	this.textureName = textureName;
	this.shineDamper = 10;
	this.reflectivity = 0;
	this.hasTransparency = false;
	this.useFakeLighting = false;
	this.rows = 1;
	this.textureVBO = TextureVBO;
	this.textureSpecVBO = -1;
}

var TexturedModel = function(model, texture) {
	this.model = model;
	this.texture = texture;
}

var Vertex = function(index, position)
{
	var NO_INDEX = -1;
	
	this.textureIndex = NO_INDEX;
	this.normalIndex = NO_INDEX;
	this.duplicateVertex = null;
	
	this.index = index;
	this.position = position;
	
	this.isSet = function()
	{
		return this.textureIndex != NO_INDEX && this.normalIndex != NO_INDEX; 
	};
	
	this.hasSameTextureAndNormal = function(textureIndexOther, normalIndexOther)
	{
		return textureIndexOther == this.textureIndex && normalIndexOther == this.normalIndex;
	};
}

var Triangle = function(vertex1, vertex2, vertex3) {

	this.vertices = [vertex1, vertex2, vertex3];
}

var Light = function(Position, Colour, attenuation)
{
	this.position = Position;
	this.colour = Colour;
	this.attenuation = attenuation
	if (this.attenuation == undefined) {
		this.attenuation = [1, 0, 0];
	}
}

var WaterTile = function(x, z, height) {
	this.x = x;
	this.z = z;
	this.height = height;
}

var Entity = function(X, Y, Z, RX, RY, RZ, S, texturedModel, textureIndex, name, gravityAffected)
{
	var that = {};
	
	that.x = X;
	that.y = Y;
	that.z = Z;

	that.speedX = 0;
	that.speedY = 0;
	that.speedZ = 0;
	
	that.rX = RX;
	that.rY = RY;
	that.rZ = RZ;
	
	that.scale = S;

	that.minX;
	that.maxX;
	that.minY;
	that.maxY;
	that.minZ;
	that.maxZ;

	that.name = name;

	that.textureIndex = textureIndex;
	
	that.inAir = false;

	that.onObject = false;
	that.underObject = false;
	that.onY = 0;
	that.gravityAffected = gravityAffected != null ? gravityAffected : true;
	
	that.speed = 20;
	that.upSpeed = 0;
	that.rotateSpeed = 90;
	
	that.texturedModel = texturedModel;

	that.tickAbstract = function(){}
		
	that.tick = function(terrain)
	{
		that.move(0, that.upSpeed, 0);

		var height = terrain.getTerrainHeight(that.x, that.z);
		if (that.y <= height || that.onObject) {
			that.inAir = false;

			if (that.onObject && that.upSpeed <= 0) {
				that.y = that.onY;
			} else if (that.y < height) {
				that.y = height;
			}

		} else {
			that.inAir = true;
		}
		
		that.tickAbstract();
	};

	that.setupBoundingBox = function() {
		that.minX = (that.texturedModel.model.boundingBox.sizeMin * that.scale) + that.x;
		that.maxX = (that.texturedModel.model.boundingBox.sizeMax * that.scale) + that.x;

		that.minY = (that.texturedModel.model.boundingBox.sizeMin * that.scale) + that.y;
		that.maxY = (that.texturedModel.model.boundingBox.sizeMax * that.scale) + that.y;

		that.minZ = (that.texturedModel.model.boundingBox.sizeMin * that.scale) + that.z;
		that.maxZ = (that.texturedModel.model.boundingBox.sizeMax * that.scale) + that.z;
	}

	that.detectCollision = function() {
		that.setupBoundingBox();

		var c = 0;

		for (var i = 0; i < entities.length; i++) {
			var e = entities[i];

			if (e == that) 
				continue;

			e.setupBoundingBox();

			if(((e.minX <= that.maxX && e.minX >= that.minX) || (e.maxX >= that.minX && e.maxX <= that.maxX) || (e.minX <= that.minX && e.maxX >= that.maxX)) &&
			   ((e.minY <= that.maxY && e.minY >= that.minY) || (e.maxY >= that.minY && e.maxY <= that.maxY) || (e.minY <= that.minY && e.maxY >= that.maxY)) &&
			   ((e.minZ <= that.maxZ && e.minZ >= that.minZ) || (e.maxZ >= that.minZ && e.maxZ <= that.maxZ) || (e.minZ <= that.minZ && e.maxZ >= that.maxZ))) {
			    c++;
			    that.checkCollision(e);
			} 
		}

		if (c == 0) {
			that.onObject = false;
			that.underObject = false;
		}
	}

	that.checkCollision = function(e) {
		var c = 0;

		var x = 0;
		var y = 0;
		var z = 0;

		var triangles = that.texturedModel.model.collisionModel.triangles;
		var eTriangles = e.texturedModel.model.collisionModel.triangles;

		for (var et = 0; et < eTriangles.length; et++) {
			for (var t = 0; t < triangles.length; t++) {
				
				var triangle = triangles[t];
				var eTriangle = eTriangles[et];

				var tri = new Triangle(triangle.vertices[0], triangle.vertices[1], triangle.vertices[2]);

				tri.vertices[0] = multiplyVector(tri.vertices[0], [that.scale, that.scale, that.scale]);
				tri.vertices[1] = multiplyVector(tri.vertices[1], [that.scale, that.scale, that.scale]);
				tri.vertices[2] = multiplyVector(tri.vertices[2], [that.scale, that.scale, that.scale]);

				// tri.vertices[0] = rotateVector(tri.vertices[0], [that.rX, that.rY, that.rZ]);
				// tri.vertices[1] = rotateVector(tri.vertices[1], [that.rX, that.rY, that.rZ]);
				// tri.vertices[2] = rotateVector(tri.vertices[2], [that.rX, that.rY, that.rZ]);

				tri.vertices[0] = addVector(tri.vertices[0], [that.x, that.y, that.z]);
				tri.vertices[1] = addVector(tri.vertices[1], [that.x, that.y, that.z]);
				tri.vertices[2] = addVector(tri.vertices[2], [that.x, that.y, that.z]);

				var eTri = new Triangle(eTriangle.vertices[0], eTriangle.vertices[1], eTriangle.vertices[2]);

				eTri.vertices[0] = multiplyVector(eTri.vertices[0], [e.scale, e.scale, e.scale]);
				eTri.vertices[1] = multiplyVector(eTri.vertices[1], [e.scale, e.scale, e.scale]);
				eTri.vertices[2] = multiplyVector(eTri.vertices[2], [e.scale, e.scale, e.scale]);

				// eTri.vertices[0] = rotateVector(eTri.vertices[0], [e.rX, e.rY, e.rZ]);
				// eTri.vertices[1] = rotateVector(eTri.vertices[1], [e.rX, e.rY, e.rZ]);
				// eTri.vertices[2] = rotateVector(eTri.vertices[2], [e.rX, e.rY, e.rZ]);

				eTri.vertices[0] = addVector(eTri.vertices[0], [e.x, e.y, e.z]);
				eTri.vertices[1] = addVector(eTri.vertices[1], [e.x, e.y, e.z]);
				eTri.vertices[2] = addVector(eTri.vertices[2], [e.x, e.y, e.z]);

				//plane equation of tri
				var tV1 = subtractVector(tri.vertices[1], tri.vertices[0]);
				var tV2 = subtractVector(tri.vertices[2], tri.vertices[0]);
				var tN = crossProduct(tV1, tV2);
				var tD = -dotProduct(tN, tri.vertices[0]);

				//put eTri into tri plane and compute signed distances to plane
				var tD0 = dotProduct(tN, eTri.vertices[0]) + tD;
				var tD1 = dotProduct(tN, eTri.vertices[1]) + tD;
				var tD2 = dotProduct(tN, eTri.vertices[2]) + tD;
    			
    			if (tD0 >= 0 && tD1 >= 0 && tD2 >= 0)
        			continue;
    			if (tD0 <= 0 && tD1 <= 0 && tD2 <= 0)
        			continue;

				//plane equation of eTri
				var eV1 = subtractVector(eTri.vertices[1], eTri.vertices[0]);
				var eV2 = subtractVector(eTri.vertices[2], eTri.vertices[0]);
				var eN = crossProduct(eV1, eV2);
				var eD = -dotProduct(eN, eTri.vertices[0]);

				//put tri into eTri plane and compute signed distances to plane
				var eD0 = dotProduct(eN, tri.vertices[0]) + eD;
				var eD1 = dotProduct(eN, tri.vertices[1]) + eD;
				var eD2 = dotProduct(eN, tri.vertices[2]) + eD;

    			if (eD0 >= 0 && eD1 >= 0 && eD2 >= 0)
        			continue;
    			if (eD0 <= 0 && eD1 <= 0 && eD2 <= 0)
        			continue;

        		if (isParallel(tN, eN))
        			continue;

        	    if ((tD0 == 0 && tD1 > 0 && tD2 > 0) || (tD0 == 0 && tD1 < 0 && tD2 < 0))
            		continue;
        		if ((tD0 > 0 && tD1 == 0 && tD2 > 0) || (tD0 < 0 && tD1 == 0 && tD2 < 0))
            		continue;
        		if ((tD0 > 0 && tD1 > 0 && tD2 == 0) || (0 > tD0 && tD1 < 0 && tD2 == 0))
            		continue;
        		if ((eD0 == 0 && eD1 > 0 && eD2 > 0) || (eD0 == 0 && eD1 < 0 && eD2 < 0))
            		continue;
        		if ((eD0 > 0 && eD1 == 0 && eD2 > 0) || (eD0 < 0 && eD1 == 0 && eD2 < 0))
            		continue;
        		if ((eD0 > 0 && eD1 > 0 && eD2 == 0) || (0 > eD0 && eD1 < 0 && eD2 == 0))
            		continue;

            	//line of intersection
            	var lD = crossProduct(tN, eN);

            	//find vertex of tri on one side of plane eTri and other two points on other side
            	var edgeT1 = [];
        		var edgeT2 = [];
        		var dV0 = 1;
        		var dV1 = 1;
        		var dV2 = 1;

            	if ((tD0 > 0 && tD1 <= 0 && tD2 <= 0) || (tD0 < 0 && tD1 >= 0 && tD2 >= 0)) {
            		edgeT1 = [tri.vertices[1], tri.vertices[0]];
            		edgeT2 = [tri.vertices[0], tri.vertices[2]];

            		dV0 = tD1;
            		dV1 = tD0;
            		dV2 = tD2;
            	} else if ((tD1 > 0 && tD0 <= 0 && tD2 <= 0) || (tD1 < 0 && tD0 >= 0 && tD2 >= 0)) {
            		edgeT1 = [tri.vertices[0], tri.vertices[1]];
            		edgeT2 = [tri.vertices[1], tri.vertices[2]];

            		dV0 = tD0;
            		dV1 = tD1;
            		dV2 = tD2;
            	} else if ((tD2 > 0 && tD1 <= 0 && tD0 <= 0) || (tD2 < 0 && tD1 >= 0 && tD0 >= 0)) {
            		edgeT1 = [tri.vertices[0], tri.vertices[2]];
            		edgeT2 = [tri.vertices[2], tri.vertices[1]];

            		dV0 = tD0;
            		dV1 = tD2;
            		dV2 = tD1;
            	}

            	var tP0 = dotProduct(lD, edgeT1[0]);
            	var tP1 = dotProduct(lD, edgeT2[0]);
            	var tP2 = dotProduct(lD, edgeT2[1]);

            	var tT1 = tP0 + (tP1 - tP0) * (dV0 / (dV0 - dV1));
            	var tT2 = tP1 + (tP2 - tP1) * (dV1 / (dV1 - dV2));

            	//find vertex of eTri on one side of plane tri and other two points on other side
            	var edgeE1 = [];
        		var edgeE2 = [];

        		if ((eD0 > 0 && eD1 <= 0 && eD2 <= 0) || (eD0 < 0 && eD1 >= 0 && eD2 >= 0)) {
            		edgeE1 = [eTri.vertices[1], eTri.vertices[0]];
            		edgeE2 = [eTri.vertices[0], eTri.vertices[2]];

            		dV0 = eD1;
            		dV1 = eD0;
            		dV2 = eD2;
            	} else if ((eD1 > 0 && eD0 <= 0 && eD2 <= 0) || (eD1 < 0 && eD0 >= 0 && eD2 >= 0)) {
            		edgeE1 = [eTri.vertices[0], eTri.vertices[1]];
            		edgeE2 = [eTri.vertices[1], eTri.vertices[2]];

            		dV0 = eD0;
            		dV1 = eD1;
            		dV2 = eD2;
            	} else if ((eD2 > 0 && eD1 <= 0 && eD0 <= 0) || (eD2 < 0 && eD1 >= 0 && eD0 >= 0)) {
            		edgeE1 = [eTri.vertices[0], eTri.vertices[2]];
            		edgeE2 = [eTri.vertices[2], eTri.vertices[1]];

            		dV0 = eD0;
            		dV1 = eD2;
            		dV2 = eD1;
            	}

            	var eP0 = dotProduct(lD, edgeE1[0]);
            	var eP1 = dotProduct(lD, edgeE2[0]);
            	var eP2 = dotProduct(lD, edgeE2[1]);

            	var eT1 = eP0 + (eP1 - eP0) * (dV0 / (dV0 - dV1));
            	var eT2 = eP1 + (eP2 - eP1) * (dV1 / (dV1 - dV2));

            	if (tT1 > tT2) {
            		var temp = tT1;
            		tT1 = tT2;
            		tT2 = temp;
            	}

            	if (eT1 > eT2) {
            		var temp = eT1;
            		eT1 = eT2;
            		eT2 = temp;
            	}

            	//check of overlap
            	if (eT1 >= tT1 && eT2 <= tT2 ||
            		tT1 >= eT1 && tT2 <= eT2 ||
            		eT1 >= tT1 && eT1 < tT2 && eT2 > tT2 ||
            		tT1 >= eT1 && tT1 < eT2 && tT2 > eT2) {
            		c++;
            		var tempY = barryCentric(eTri.vertices[0], eTri.vertices[1], eTri.vertices[2], [that.x, that.z]);
            	   	
            	   	if (tempY > y && tempY <= e.maxY) {
            	   		y = tempY;
            	   	}
				}
			}
		}

		if (c == 0) {
			that.onObject = false;
			that.underObject = false;
		} else {
			that.collisionResponse(e, x, y, z);
		}
	}

	that.collisionResponse = function(e, x, y, z) {
		if (that.gravityAffected) {
			
			if ((that.speedX != 0 || that.speedZ != 0 || that.upSpeed < 0 || that.onObject) && !(that.upSpeed > 0) && !isNaN(y) && !that.underObject) {
				that.onObject = true;
				that.onY = y;
				

			} else if (that.upSpeed > 0 && !that.onObject) {
				that.underObject = true
				that.upSpeed = 0;
			}
		}
	}

	that.getTextureXOffset = function() {
		return (that.textureIndex%that.texturedModel.texture.rows)/that.texturedModel.texture.rows;
	}

	that.getTextureYOffset = function() {
		return (Math.floor(that.textureIndex/that.texturedModel.texture.rows))/that.texturedModel.texture.rows;
	}


	that.move = function(dx, dy, dz)
	{
		that.speedX = dx;
		that.speedY = dy;
		that.speedZ = dz;

		that.detectCollision();
		that.applyForce();
	};
	
	that.applyForce = function()
	{
		that.x += delta*that.speedX;
		that.z += delta*that.speedZ;
		if (that.gravityAffected) {
			that.upSpeed += GRAVITY * delta;
			if (!that.inAir) {
				that.upSpeed = Math.max(that.upSpeed, 0);
			}
		}
		that.y += delta*that.speedY;
	};
	
	that.rotate = function(dx, dy, dz)
	{
		that.rX += delta*dx;
		that.rY += delta*dy;
		that.rZ += delta*dz;
	};
	
	that.moveForward = function()
	{
		that.move(-that.speed*Math.sin(toRadians(that.rY)), 0, -that.speed*Math.cos(toRadians(that.rY)));
	};
	
	that.moveBackward = function()
	{
		that.move(that.speed*Math.sin(toRadians(that.rY)), 0, that.speed*Math.cos(toRadians(that.rY)));
	};
	
	that.moveLeft = function()
	{
		that.move(-that.speed*Math.cos(toRadians(that.rY)), 0, that.speed*Math.sin(toRadians(that.rY)));
	};
	
	that.moveRight = function()
	{
		that.move(that.speed*Math.cos(toRadians(that.rY)), 0, -that.speed*Math.sin(toRadians(that.rY)));
	};
	
	that.getForwardVector = function()
	{
		return [-Math.sin(toRadians(that.rY)), 0, -Math.cos(toRadians(that.rY))];
	};
	
	that.getRightVector = function()
	{
		return [Math.cos(toRadians(that.rY)), 0, -Math.sin(toRadians(that.rY))];
	};
	
	return that;
}

var LightEntity = function(X, Y, Z, RX, RY, RZ, S, texturedModel, textureIndex, light, lightPos)
{
	var that = new Entity(X, Y, Z, RX, RY, RZ, S, texturedModel, textureIndex);
	that.light = light;
	that.lightPos = lightPos;
	lights.push(that.light);

	that.tickAbstract = function() {
		that.light.position[0] = X+that.lightPos[0];
		that.light.position[1] = Y+that.lightPos[1];
		that.light.position[2] = Z+that.lightPos[2];
	}

	return that;
}

var Player = function(X, Y, Z, RX, RY, RZ, S, texturedModel, textureIndex, name)
{
	var that = new Entity(X, Y, Z, RX, RY, RZ, S, texturedModel, textureIndex, name);
	
	that.jump = function()
	{
		if (!that.inAir) {
			that.upSpeed = 80;
		}
	}
	
	that.checkInputs = function()
	{
		if(keys[38])
			that.moveForward();
		if(keys[40])
			that.moveBackward();
		if(keys[37])
			that.moveLeft();
		if(keys[39])
			that.moveRight();

		if(keys[65])
			that.rY -= that.speed*delta;
		if(keys[68])
			that.rY += that.speed*delta;	


		if(keys[32])
			that.jump();
	};
	
	that.tickAbstract = function()
	{
		that.checkInputs();
		camera.follow(this);
	};
	
	return that;
}

var Terrain = function(gridX, gridZ, Textures, heightMap)
{
	this.SIZE = 800;
	this.x = gridX*this.SIZE;
	this.z = gridZ*this.SIZE;
	this.MAX_HEIGHT = 80;
	this.textures = Textures;
	this.heights = [];
	this.heightMap = heightMap;
	this.scaledHeight = this.SIZE/this.heightMap.height
	
	heightCanvas = document.createElement('canvas');
	heightCanvas.width = this.heightMap.height;
	heightCanvas.height = this.heightMap.height;
	this.ctx = heightCanvas.getContext('2d');
	this.ctx.drawImage(this.heightMap, 0, 0);
	
	this.getTerrainHeight = function(worldX, worldZ)
	{
		var terrainX = worldX - this.x;
		var terrainZ = worldZ - this.z;
		var gridSquareSize = this.SIZE/(this.heights.length-1);
		var gridX = Math.floor(terrainX / gridSquareSize);
		var gridZ = Math.floor(terrainZ / gridSquareSize);
		if(gridX >= this.heights.length-1 || gridZ >= this.heights.length-1 || gridX < 0 || gridZ < 0)
			return 0;
		
		var xCo = (terrainX % gridSquareSize)/gridSquareSize;
		var zCo = (terrainZ % gridSquareSize)/gridSquareSize;
		var ans;
		if(xCo <= (1-zCo)) {
			ans = barryCentric([0, this.heights[gridZ][gridX], 0], [1, this.heights[gridZ][gridX+1], 0], [0, this.heights[gridZ+1][gridX], 1], [xCo, zCo]);
		} else {
			ans = barryCentric([1, this.heights[gridZ][gridX+1], 0], [1, this.heights[gridZ+1][gridX+1], 1], [0, this.heights[gridZ+1][gridX], 1], [xCo, zCo]);
		}
		
		return ans;
	}
		
	this.getHeight = function(x, z)
	{
		if(x<0 || x>this.heightMap.Height || z<0 || z>this.heightMap.Height)
			return 0;

		data = this.ctx.getImageData(x, z, 1, 1).data
		colour = (data[0] + data[1] + data[2])/(256 + 256 + 256);
		
		colour = (this.MAX_HEIGHT*2)*colour-this.MAX_HEIGHT;
		
		return colour;
	};
	
	this.calculateNormal = function(x, z)
	{
		heightL = this.getHeight(x-1, z);
		heightR = this.getHeight(x+1, z);
		heightU = this.getHeight(x, z+1);
		heightD = this.getHeight(x, z-1);
		
		normal = [heightL-heightR, 2, heightD-heightU];
		
		length = Math.sqrt(Math.pow(normal[0], 2) + Math.pow(normal[1], 2) + Math.pow(normal[2], 2));
		
		normal[0] /= length;
		normal[1] /= length;
		normal[2] /= length;
		
		return normal;
	};
	this.model = loadTerrain(this);
}

var Camera = function(X, Y, Z, Yaw, Pitch, Roll)
{
	this.x = X;
	this.y = Y;
	this.z = Z;
	
	this.pitch = Pitch;
	this.yaw = Yaw;
	this.roll = Roll;
	
	this.distanceFromObject = 20;
	this.angleAroundObject = 0;
	this.angleOverObject = 45;
	
	this.speed = 45;
	
	this.tick = function()
	{
		if(keys[87])
			this.angleOverObject = Math.min(90, this.angleOverObject + this.speed*delta);
		if(keys[83])
			this.angleOverObject = Math.max(-90, this.angleOverObject - this.speed*delta);
		
		// if(keys[65])
		// 	this.angleAroundObject -= this.speed*delta;
		// if(keys[68])
		// 	this.angleAroundObject += this.speed*delta;			
	}
	
	this.follow = function(e)
	{		
		aroundAngle = e.rY + this.angleAroundObject;
		overAngle = this.distanceFromObject * Math.sin(toRadians(this.pitch));
		this.pitch = this.angleOverObject;
		this.yaw = -aroundAngle;
		this.x = e.x + (this.distanceFromObject * Math.sin(toRadians(aroundAngle)) * Math.cos(toRadians(this.pitch)));
		this.y = e.y + overAngle;
		this.z = e.z + (this.distanceFromObject * Math.cos(toRadians(aroundAngle)) * Math.cos(toRadians(this.pitch)));
	};
	
	this.moveForward = function()
	{
		this.z -= this.speed*Math.cos(toRadians(this.yaw));
		this.x += this.speed*Math.sin(toRadians(this.yaw));
	};
	
	this.moveBackward = function()
	{
		this.z += this.speed*Math.cos(toRadians(this.yaw));
		this.x -= this.speed*Math.sin(toRadians(this.yaw));
	};
	
	this.moveLeft = function()
	{
		this.z -= this.speed*Math.sin(toRadians(this.yaw));
		this.x -= this.speed*Math.cos(toRadians(this.yaw));
	};
	
	this.moveRight = function()
	{
		this.z += this.speed*Math.sin(toRadians(this.yaw));
		this.x += this.speed*Math.cos(toRadians(this.yaw));
	};
}
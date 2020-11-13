var column = 0;
var line = 0;

var Entity = function(x, y, width, height, img)
{
	var that = {}
	that.img = img;
	that.x = x;
	that.y = y;
	that.width = width;
	that.height = height;
	
	that.tick = function() {
		
	}
	
	that.render = function() {
		context.drawImage(that.img, that.x, that.y, that.width, that.height);
	}
	
	that.rotate = function(angle) {
		context.save();
		context.translate(that.x+that.width/2, that.y+that.height/2);
		context.rotate(toRadians(angle));
		context.drawImage(that.img, -(that.width/2), -(that.height/2), that.width, that.height);
		context.restore();
	};
	
	that.scale = function(scaleX, scaleY) {
		context.save();
		context.translate(that.x+that.width/2, that.y+that.height/2);
		context.scale(scaleX, scaleY);
		context.drawImage(that.img, -(that.width/2), -(that.height/2), that.width, that.height);
		context.restore();
	}
	
	return that;
}

var EntityObj = function(width, height, img) {
	this.width = width;
	this.height = height;
	this.img = img;
}

function setupEntity(eO) {
	var entityCanvas = document.getElementById("entityCanvas");
	var ctx = entityCanvas.getContext("2d");
	ctx.drawImage(eO.img, column*64, line*64, 64, 64);
	ctx.rect(column*64, line*64, 64, 64);
	ctx.stroke();
	
	if (column % 4 == 0 && column != 0) {
		column = 0;
		line++;
	} else {
		column++;
	}
}



function addEntity(name, width, height, img) {
	var entityObj = new EntityObj(width, height, img)
	entityList.push(entityObj);
	setupEntity(entityObj);
}


	
var Tile = function(id, name, texture) {
	var that = {};
	
	that.id = id;
	that.name = name;
	that.texture = texture;
	
	that.tick = function(){}
	
	that.render = function(x, y){
		context.drawImage(that.texture, x, y, TILESIZE, TILESIZE);
	}
	
	tiles[id] = that;
	
	return that;
}

function setupTileImages() {
	document.getElementById("tileLeftImage").src = tiles[tileLeftDropDown.selectedIndex].texture.src;
	document.getElementById("tileRightImage").src = tiles[tileRightDropDown.selectedIndex].texture.src;
}

function setupTileDropDowns() {
	tiles.forEach(function(t, index) {
		var optLeft = document.createElement("option");
		optLeft.innerHTML = t.name;
		optLeft.value = t.id;
		
		var optRight = document.createElement("option");
		optRight.innerHTML = t.name;
		optRight.value = t.id;
		
		tileLeftDropDown.add(optLeft);
		tileRightDropDown.add(optRight);
	});
}

function setupTile(tile) {
	var optLeft = document.createElement("option");
	optLeft.innerHTML = tile.name;
	optLeft.value = tile.id;
		
	var optRight = document.createElement("option");
	optRight.innerHTML = tile.name;
	optRight.value = tile.id;
	
	tileLeftDropDown.add(optLeft);
	tileRightDropDown.add(optRight);
}

function addTile(img, name) {
	var tile = new Tile(tiles.length, name, img);
	setupTile(tile);
}

function initTiles() {
	var grassTile = new Tile(0, "grass", graphics.grass);
	var dirtTile = new Tile(1, "dirt", graphics.dirt);
	
	setupTileDropDowns();
	
	setupTileImages();
	
	start();
}





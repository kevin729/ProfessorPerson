var Area = function()
{
    var that = {};
	
	that.map = [[]];
	
	that.tick = function()
	{
		if (mouseLeftClicked) {
			if (editor == "ppTabTiles") {
				that.setTile(tileLeftDropDown.options[tileLeftDropDown.selectedIndex].value, mouseX, mouseY);
			} else if (editor == "ppTabEntities" && entityList[entityLeft] != null && getMousePressed(1)) {
				var e = entityList[entityLeft]
				entities.push(new Entity(mouseX-e.width/2, mouseY-e.height/2, e.width, e.height, e.img));
			}
		}
		
		if (mouseRightClicked) {
			if (editor == "ppTabTiles") {
				that.setTile(tileRightDropDown.options[tileRightDropDown.selectedIndex].value, mouseX, mouseY);
			} else if (editor == "ppTabEntities" && entityList[entityRight]                                                                                             != null && getMousePressed(3)) {
				var e = entityList[entityRight]
				entities.push(new Entity(mouseX-e.width/2, mouseY-e.height/2, e.width, e.height, e.img));
			}
		}
	}
	
	that.render = function()
	{
	    for (y = 0; y < that.map[0].length; y++) {
			for(x = 0; x < that.map[[0]].length; x++) {
				tiles[that.map[y][x]].render(x*TILESIZE, y*TILESIZE);
			}
		}
	}
	
	that.getTile = function(x, y) {
		return that.map[Math.floor(y/TILESIZE)][Math.floor(x/TILESIZE)];
	} 
	
	that.setTile = function(tileIndex, x, y) {
		that.map[Math.floor(y/TILESIZE)][Math.floor(x/TILESIZE)] = tileIndex;
	}
	return that;
}

var Overworld = function()
{
	var that = new Area();
	
	that.map = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                [1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
				
	return that;
}
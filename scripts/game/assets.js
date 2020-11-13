var Sheet = function(sheetFile)
{
	this.sheet = null;
	
	if(sheetFile != undefined && sheetFile != "" && sheetFile != null)
	{
		this.sheet = new Image();
		
		this.sheet.onload = function(){
			graphics = loadImages()
		}
		this.sheet.src = sheetFile;
	}

    this.crop = function(x, y, width, height, callback)
	{
		var tempCanvas = document.createElement('canvas');
		var tempContext = tempCanvas.getContext('2d');
		
		tempCanvas.width = width;
		tempCanvas.height = height;

		tempContext.drawImage(this.sheet, x, y, width, height, 0, 0, width, height);
		
		var img = new Image();

		img.onload = function(){
			callback(img);
		};
		img.src = tempCanvas.toDataURL("image/png");
	};
}

function loadImages(){
	var Images = {
		grass: sheet.crop(size*2, 0, size, size, function(img){Images.grass = img;}),
		dirt: sheet.crop(size*2, size, size, size, function(img){Images.dirt = img; initTiles()})
	};
	
	return Images;
}

var graphics;
var sheet;
var size = 32;
function initAssets() {
	sheet = new Sheet("images/ss.png");
}



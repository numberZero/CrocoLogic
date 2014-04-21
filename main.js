const fieldWidth = 36;
const fieldHeight = 36;
const mapWidth = 12;
const mapHeight = 12;
const walkTime = 0.4;
const stepLen = 0.02;
const normVel = stepLen / walkTime;
const stepCount = Math.floor(walkTime / stepLen);
const dirU = 0;
const dirR = 1;
const dirL = 2;
const dirD = 3;
const dirAuto = 4;
const dirMeat = 5;
const dirEraser = 6;
const dirPlay = 7;
const dirSave = 8;
const dirReset = 9;

function _Dummy() {}

var bf = document.getElementById("Battlefield");
var bkg = document.createElement("table");
var type = 0;
var doUpdating = false;
var saved;
var _Crocodiles = [];

(function()
{
	var _Click = function()
	{
		if(this.field.content)
			return;
		if (type == dirMeat)
		{
			new Meat(this.field);
		} else if (type == dirEraser)
		{
		
		} else 
		{
			new Crocodile(this.field, type);
		}
	}

	for(var j = 0; j < mapHeight; ++j)
	{
		var row = [];
		var trow = bkg.insertRow(-1);
		for(var i = 0; i < mapWidth; ++i)
		{
			var cell = trow.insertCell(-1);
			var field = {"x": i, "y": j, "cell": cell, "content": null, "wants": null};
			row.push(field);
			cell.textContent = i + ", " + j;
			cell.fieldX = i;
			cell.fieldY = j;
			cell.field = field;
			cell.onclick = _Click;
		}
		_Crocodiles.push(row);
	}
	bf.appendChild(bkg);

	var _UpdatePos = function()
	{
		this.img.style.left = this.x * fieldWidth + "pt";
		this.img.style.top = this.y * fieldHeight + "pt";
	}

	var _Directions = [
		{"x": 0, "y": -1},
		{"x": +1, "y": 0},
		{"x": -1, "y": 0},
		{"x": 0, "y": +1},
		{"x": 0, "y": 0},
		];
		
	var _AnimSteps = stepCount;
	var _GlobalUpdate = function()
	{
		for(var j = 0; j < mapHeight; ++j)
		{
			var row = _Crocodiles[j];
			for(var i = 0; i < mapWidth; ++i)
			{
				var field = row[i];
				if(field.content instanceof Crocodile)
					field.content.update();
			}
		}
		for(var j = 0; j < mapHeight; ++j)
		{
			var row = _Crocodiles[j];
			for(var i = 0; i < mapWidth; ++i)
			{
				var field = row[i];
				if(field.content instanceof Crocodile)
					field.content.think();
			}
		}
		for(var j = 0; j < mapHeight; ++j)
		{
			var row = _Crocodiles[j];
			for(var i = 0; i < mapWidth; ++i)
			{
				var field = row[i];
				if(field.content instanceof Crocodile)
					field.content.go();
			}
		}
	}

	var _GlobalStep = function()
	{
		for(var j = 0; j < mapHeight; ++j)
		{
			var row = _Crocodiles[j];
			for(var i = 0; i < mapWidth; ++i)
			{
				var field = row[i];
				if(field.content instanceof Crocodile)
					field.content.step();
			}
		}
		if(!--_AnimSteps)
		{
			if(doUpdating)
				_GlobalUpdate();
			_AnimSteps = stepCount;
		}
	}
	loop = setInterval(_GlobalStep, stepLen * 1000);

	var _Die = function()
	{
		this.field.content = null;
		bf.removeChild(this.img);
	}

	var Erase = function()
	{
		if (type == 6)
			this.object.die();
	}
	
	const _Images = ["crocU.png", "crocR.png", "crocL.png", "crocD.png"];
	const _OmniImages = ["crocOU.png", "crocOR.png", "crocOL.png", "crocOD.png"];

	window.Crocodile = function(field, dir)
	{
		if(field.content)
			throw "Field occupied";
		field.content = this;
		this.field = field;
		this.tx = field.x;
		this.ty = field.y;
		this.done();
		this.sleep = 0;
		this.img = document.createElement("img");
		this.img.className = "Crocodile";
		this.dir = dir;
		if (this.dir == dirAuto)
		{
			this.omnicroc = true;
			this.dir = 0;
			this.img.src = _OmniImages[this.dir];
		}
		else
		{
			this.omnicroc = false;
			this.img.src = _Images[this.dir];
		}
		this.updatePos();
		this.tField = field;
		this.img.object = this;
		this.img.onclick = Erase;
		bf.appendChild(this.img);
//		this.update();
	}

	window.Crocodile.prototype = {
		constructor: window.Target,
		updatePos: _UpdatePos,
		die: _Die,

		done: function()
			{
				this.x = this.tx;
				this.y = this.ty;
				this.vx = 0;
				this.vy = 0;
			},
 
		step: function()
			{
				this.x += this.vx;
				this.y += this.vy;
				this.updatePos();
			},
 
		update: function()
			{	
				this.updatePos();
				this.done();
				this.field.content = null;
				this.field = _Crocodiles[this.y][this.x];
				if(this.field.content)// instanceof Meat)
				{
					this.field.content.die();
					this.sleep = 3;
				}
				this.field.content = this;
			},
 
		think: function()
			{
				if (this.sleep)
				{
					this.img.title = this.sleep;
					--this.sleep;
				}
				else
				{
					var dir = 4;
					var minLen = Number.POSITIVE_INFINITY;
					
					var tdir = this.dir;
					var len = this.checkForMeat(tdir);
					if(len < minLen)
					{
						minLen = len;
						dir = tdir;
					}
					
					if (this.omnicroc)
					{
						tdir = (this.dir + 1) % 4;
						len = this.checkForMeat(tdir);
						if(len < minLen)
						{
							minLen = len;
							dir = tdir;
						}
						
						tdir = (this.dir + 3) % 4;
						len = this.checkForMeat(tdir);
						if(len < minLen)
						{
							minLen = len;
							dir = tdir;
						}
						
						tdir = (this.dir + 2) % 4;
						len = this.checkForMeat(tdir);
						if(len < minLen)
						{
							minLen = len;
							dir = tdir;
						}
					}
					
					if(dir != 4)
					{
						this.dir = dir;
						this.img.src = _OmniImages[this.dir];
						dir = _Directions[this.dir];
						this.goTo(this.x + dir.x, this.y + dir.y);
					}
				}
			},
 
		go: function()
			{
			},
 
		goTo: function(x, y)
			{
				if((x != this.x) && (y != this.y))
					throw "Diagonal movements are not allowed";
				if((x == this.x) && (y == this.y))
					return;
				this.x = this.field.x;
				this.y = this.field.y;
				this.tx = x;
				this.ty = y;
				if(x == this.x)
					this.vy = (y > this.y) ? 1 : -1;
				else
					this.vx = (x > this.x) ? 1 : -1;
				this.vx *= normVel;
				this.vy *= normVel;
			},
		
		checkForMeat: function(dir)
			{
				if(!dir.hasOwnProperty("x"))
					dir = _Directions[dir];
				var x = this.field.x;
				var y = this.field.y;
				while(true)
				{
					x += dir.x;
					y += dir.y;
					if((x < 0) || (y < 0))
						break;
					if((x >= mapWidth) || (y >= mapHeight))
						break;
					var obj = _Crocodiles[y][x].content;
					if(obj instanceof Meat)
						return Math.abs(x - this.field.x + y - this.field.y);
					if(obj)
						break;
				}
				return Number.POSITIVE_INFINITY;
			},
	}
		
	window.Meat = function(field)
	{
		field.content = this;
		this.field = field;
		this.x = field.x;
		this.y = field.y;
		this.img = document.createElement("img");
		this.img.className = "Meat";
		this.img.src = "meat.png";
		this.updatePos();
		this.tField = field;
		this.img.object = this;
		this.img.onclick = Erase;
		bf.appendChild(this.img);
	}
	
	window.Meat.prototype = {
		constructor: window.Target,
		updatePos: _UpdatePos,
		die: _Die,
	}

})();

function setType(a)
{
	if (a == dirPlay) {
			doUpdating = !doUpdating;
			document.getElementById("PlayButton").src = doUpdating ? "pause.png" : "play.png"
	} else if (a == dirSave) {
		saved = _Crocodiles.clone();
		alert("Saved!");
	} else if (a == dirReset) {
		_Crocodiles = saved.clone();
		alert("Loaded!");
	} else {
		type = a;
	}
}
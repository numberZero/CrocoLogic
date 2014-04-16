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
			//cell.textContent = i + ", " + j;
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

	var _Step = function(obj)
	{
		if(obj)
			return _Step.call(obj);
		this.x += this.vx;
		this.y += this.vy;
		_UpdatePos.call(this);
	}

	var _CheckForMeat = function(dir)
	{
		if(!dir.hasOwnProperty("x"))
			arguments.callee.call(this, _Directions[dir].x, _Directions[dir].y);
		var x = this.field.x;
		var y = this.field.y;
		while(true)
		{
			x += dir.x;
			y += dir.y;
			if((x < 0) || (y < 0))
				return 0;
			if((x >= mapWidth) || (y >= mapHeight))
				return 0;
			var obj = _Crocodiles[y][x].content;
			if(!obj)
				continue;
			if(obj instanceof Meat)
				return Math.abs(x - this.field.x + y - this.field.y);
			return 0;
		}
	}
	
	var _Directions = [
		{"x": 0, "y": -1},
		{"x": +1, "y": 0},
		{"x": -1, "y": 0},
		{"x": 0, "y": +1},
		{"x": 0, "y": 0},
		];
		
	var _Update = function()
	{	
		if (!doUpdating)
			return;
		_UpdatePos.call(this);
		this.field = _Crocodiles[this.y][this.x];
		if(this.field.content instanceof Meat)
		{
			this.field.content.die();
			this.sleep = 3;
		}
			this.field.content = this;
			if (this.sleep)
			{
				this.img.title = this.sleep;
				--this.sleep;
			}
			else
			{
				var dir = _Directions[this.dir];
			
				if(this.checkForMeat(dir))
				{
					if (_Crocodiles[this.y + dir.y][this.x + dir.x] instanceof Target)
						_Crocodiles[this.y + dir.y][this.x + dir.x].content.valid = false;
					_Crocodiles[this.y + dir.y][this.x + dir.x] = Target(_Crocodiles[this.y + dir.y][this.x + dir.x]);
				}
				if (this.omnicroc)
				{
					var tdir = _Directions[4], minLen = mapWidth * 10;
					for (var i = 0; i < 4; i++)
					{
						var curDistance = this.checkForMeat(_Directions[i]);
						if ((curDistance < minLen) && curDistance)
						{
							minLen = curDistance;
							tdir = _Directions[i];
							this.img.src = _OmniImages[i];
						
						}
					}
					this.tField = _Crocodiles[this.y + tdir.y][this.x + tdir.x];
					if (_Crocodiles[this.y + tdir.y][this.x + tdir.x].content) {
						_Crocodiles[this.y + tdir.y][this.x + tdir.x].content.valid++;
					} else {
						_Crocodiles[this.y + tdir.y][this.x + tdir.x].content = new Target(this.tField);
					}
				}
			}
	}
	
	var _AnimSteps = stepCount;
	var _GlobalUpdate = function()
	{
		for(var j = 0; j < mapHeight; ++j)
		{
			var row = _Crocodiles[j];
			for(var i = 0; i < mapWidth; ++i)
			{
				var field = row[i];
				if(field.content)
					field.content.done();
			}
		}
			for(var j = 0; j < mapHeight; ++j)
			{
				var row = _Crocodiles[j];
				for(var i = 0; i < mapWidth; ++i)
				{
					var field = row[i];
					if(field.content)
						field.content.update();
				}
			}
			for(var j = 0; j < mapHeight; ++j)
			{
				var row = _Crocodiles[j];
				for(var i = 0; i < mapWidth; ++i)
				{
					var field = row[i];
					if(field.content)
						field.content.goTo(field.content.tField.x, field.content.tField.y);
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
				if(field.content)
					field.content.step();
			}
		}
		if(!--_AnimSteps)
		{
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

	var _Stop = function()
	{
		this.tx = this.x = this.field.x;
		this.ty = this.y = this.field.y;
		this.vx = 0;
		this.vy = 0;
	}

	var _Erase = function()
	{
		if (type == 6)
			this.object.die();
	}
	
	var _Done = function()
	{
		this.x = this.tx;
		this.y = this.ty;
		this.vx = 0;
		this.vy = 0;
	}

	var _GoTo = function(x, y)
	{
	if (_Crocodiles[y][x].content.valid <= 1)		
		{		
			if((x != this.x) && (y != this.y))
				throw "Diagonal movements are not allowed";
			if((x == this.x) && (y == this.y))
				return;
			this.field.content = null;
			this.x = this.field.x;
			this.y = this.field.y;
			this.tx = x;
			this.ty = y;
			if(x == this.x)
			{
				this.vy = (y > this.y) ? 1 : -1;
	//			this.img.src = (y > this.y) ? "crocD.png" : "crocU.png";
			} else {
				this.vx = (x > this.x) ? 1 : -1;
	//			this.img.src = (x > this.x) ? "crocR.png" : "crocL.png";
			}
			this.vx *= normVel;
			this.vy *= normVel;
		}
	}

	const _Images = ["crocU.png", "crocR.png", "crocL.png", "crocD.png"];
	const _OmniImages = ["crocOU.png", "crocOR.png", "crocOL.png", "crocOD.png"];

	window.Crocodile = function(field, dir)
	{
		field.content = this;
		this.field = field;
		this.x = field.x;
		this.y = field.y;
		this.sleep = 0;
		this.valid = 0;
		this.img = document.createElement("img");
		this.img.className = "Crocodile";
		this.dir = dir;
		if (this.dir == dirAuto) {
			this.omnicroc = true;
			this.dir = 0;
			this.img.src = _OmniImages[this.dir];
		} else {
			this.omnicroc = false;
		this.img.src = _Images[this.dir];
		}
		_UpdatePos.call(this);
		this.goTo = _GoTo;
		this.die = _Die;
		this.tField = field;
		this.step = _Step;
		this.update = _Update;
		this.stop = _Stop;
		this.done = _Done;
		this.img.object = this;
		this.img.onclick = _Erase;
		this.checkForMeat = _CheckForMeat;
		this.stop();
		bf.appendChild(this.img);
		this.update();
	}
	
	window.Target = function(field, author)
	{
		field.content = this;
		this.field = field;
		this.x = field.x;
		this.y = field.y;
		this.goTo = _Dummy;
		this.valid = 1;
		this.die = _Die;
		this.step = _Dummy;
		this.update = _Dummy;
		this.stop = _Dummy;
		this.done = _Die;
	}
	
	window.Meat = function(field)
	{
		field.content = this;
		this.valid = 0;
		this.field = field;
		this.x = field.x;
		this.y = field.y;
		this.goTo = _Dummy;
		this.img = document.createElement("img");
		this.img.className = "Meat";
		this.img.src = "meat.png";
		_UpdatePos.call(this);
		this.die = _Die;
		this.tField = field;
		this.step = _Dummy;
		this.update = _Dummy;
		this.stop = _Dummy;
		this.done = function()
		{
			this.valid = 0;
		};
		this.img.object = this;
		this.img.onclick = _Erase;
		bf.appendChild(this.img);
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
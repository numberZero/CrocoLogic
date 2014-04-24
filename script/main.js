/*const fieldWidth = 36;
const fieldHeight = 36;*/
const mapWidth = 12;
const mapHeight = 12;
const walkTime = 0.4;
const stepLen = 0.02;
const stepCount = Math.floor(walkTime / stepLen);
const normVel = 1 / stepCount;

const dirNorth = 0;
const dirEast = 1;
const dirSouth = 2;
const dirWest = 3;
const dirAuto = 4;

var bf = document.getElementById("Battlefield");
var bkg = document.createElement("table");
var doUpdating = false;
var saved;

(function()
{
	const _Directions = [
		{"x":  0, "y": -1},
		{"x": +1, "y":  0},
		{"x":  0, "y": +1},
		{"x": -1, "y":  0},
		{"x":  0, "y":  0},
		];
	const _Images = ["image/crocU.png", "image/crocR.png", "image/crocD.png", "image/crocL.png"];
	const _OmniImages = ["image/crocOU.png", "image/crocOR.png", "image/crocOD.png", "image/crocOL.png"];
		
	var Cell = function(x, y, td)
	{
		this.x = x;
		this.y = y;
		this.cell = td;
		this.content = null;
//		td.textContent = " ";
		td.field = this;
		td.fieldX = x;
		td.fieldY = y;
//		td.textContent = i + ", " + j;
	}
	
	Cell.prototype = {
		constructor: Cell,
		resetTargeted: function()
		{
			this.targeted = [null, null, null, null];
		},
	}
	
	this.forEachCell = function(callback)
	{
		var args = Array.prototype.slice.call(arguments, 1);
		for(var j = 0; j < mapHeight; ++j)
		{
			var row = _Crocodiles[j];
			for(var i = 0; i < mapWidth; ++i)
				callback.apply(row[i], args);
		}
	}

	this.forEachCrocodile = function(callback)
	{
		var args = Array.prototype.slice.call(arguments, 1);
		forEachCell(function()
		{
			if(this.content instanceof Crocodile)
				callback.apply(this.content, args);
		});
	}

	var _Die = function()
	{
		this.field.content = null;
		bf.removeChild(this.img);
		if(this.ondie)
			this.ondie();
	}
	
	var crocCount = 0;
	
	this.Crocodile = function(field, dir)
	{
		if(field.content)
			throw "Field occupied";
		this.id = crocCount++;
		this.field = {};
		this.target = field;
		this.sleep = 0;
		this.ate = 0;
		this.img = document.createElement("img");
		this.img.className = "Crocodile";
		this.dir = dir;
		if (this.dir == dirAuto)
		{
			this.omnicroc = true;
			this.dir = 0;
			this.images = _OmniImages;
		}
		else
		{
			this.omnicroc = false;
			this.images = _Images;
		}
		this.img.src = this.images[this.dir];
		this.img.object = this;
		this.update();
		bf.appendChild(this.img);
	}

	this.Crocodile.prototype = {
		constructor: this.Crocodile,
		die: _Die,

		updateImage: function()
			{
				this.img.style.left = this.x + "em";
				this.img.style.top = this.y + "em";
				this.img.style.opacity = 1 / (this.sleepiness + 1);
			},

		step: function()
			{
				this.x += this.vx;
				this.y += this.vy;
				if(this.sleepiness)
					this.sleepiness -= normVel;//1 / stepCount;
				this.updateImage();
			},
 
		update: function()
			{	
				if (this.sleep)
					return;
				this.field.content = null;
				this.field = this.target;
				this.x = this.field.x;
				this.y = this.field.y;
				this.vx = 0;
				this.vy = 0;
				if(this.field.content)
				{
					if(!(this.field.content instanceof Meat))
						throw "Can't eat anything except of Meat";
					this.field.content.die();
					this.sleep = 3;
					++this.ate;
				}
				this.field.content = this;
				this.sleepiness = this.sleep;
				this.updateImage();
			},
 
		think: function()
			{
				if (this.sleep)
					return;
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
					this.img.src = this.images[this.dir];
					dir = _Directions[this.dir];
					this.target = _Crocodiles[this.y + dir.y][this.x + dir.x];
					this.target.targeted[this.dir] = this;
				}
			},
 
		go: function()
			{
				if(this.sleep)
				{
					--this.sleep;
					return;
				}
				var front = this.target.targeted[(this.dir + 2) % 4]; // targeted from front
				var left = this.target.targeted[(this.dir + 1) % 4]; // targeted from left
				var right = this.target.targeted[(this.dir + 3) % 4]; // targeted from right
				if(front && left && right)
					this.dir = (this.dir + 2) % 4;
				if(front || ((left == null) != (right == null)))
					this.target = this.field;
				else
					this.goTo(this.target.x, this.target.y);
			},
 
		goTo: function(x, y)
			{
				if((x != this.x) && (y != this.y))
					throw "Diagonal movements are not allowed";
				if((x == this.x) && (y == this.y))
					return;
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
		
	this.Meat = function(field)
	{
		if(field.content)
			throw "Field occupied";
		field.content = this;
		this.field = field;
		this.x = field.x;
		this.y = field.y;
		this.target = field;
		this.img = document.createElement("img");
		this.img.className = "Meat";
		this.img.src = "image/meat.png";
		this.img.object = this;
		this.img.style.left = this.x + "em";
		this.img.style.top = this.y + "em";
		bf.appendChild(this.img);
	}
	
	this.Meat.prototype = {
		constructor: this.Meat,
		die: _Die,
	}

	var _AnimSteps = stepCount;
	var _GlobalUpdate = function()
	{
		forEachCell(Cell.prototype.resetTargeted);
		forEachCrocodile(Crocodile.prototype.update);
		forEachCrocodile(Crocodile.prototype.think);
		for(var i = 0; i < onupdate.length; ++i)
			onupdate[i]();
		forEachCrocodile(Crocodile.prototype.go);
	}

	var _GlobalStep = function()
	{
		if(!doUpdating)
			return;
		forEachCrocodile(Crocodile.prototype.step);
		if(!--_AnimSteps)
		{
			_GlobalUpdate();
			_AnimSteps = stepCount;
		}
	}

	var _Crocodiles = [];
	for(var j = 0; j < mapHeight; ++j)
	{
		var row = [];
		var trow = bkg.insertRow(-1);
		for(var i = 0; i < mapWidth; ++i)
			row.push(new Cell(i, j, trow.insertCell(-1)));
		_Crocodiles.push(row);
	}
	bkg.id = "BattlefieldGrid";
	document.getElementById("BattlefieldContainer").appendChild(bkg);
	
	this.onupdate = [];

	setInterval(_GlobalStep, stepLen * 1000);
})();

function playPause()
{
	doUpdating = !doUpdating;
	document.getElementById("PlayButton").src = doUpdating ? "image/pause.png" : "image/play.png"
}

function save()
{
	alert("Saved!");
}

function load()
{
	alert("Loaded!");
}

function reset()
{
	alert("Cleaned!");
}

var mapWidth = 12;
var mapHeight = 12;
const walkTime = 0.4;
const stepLen = 0.02;
const stepCount = Math.floor(walkTime / stepLen);
const normVel = 1 / stepCount;

const objMeat = 1;
const objBlock = 2;
const objGlass = 3;

const dirNorth = 0;
const dirEast = 1;
const dirSouth = 2;
const dirWest = 3;
const dirCount = 4;

const dirAuto = -1; // anything except of [0; dirCount)
const dirNone = -1; // anything except of [0; dirCount)

(function()
{
	const _Directions = [
		{x:  0, y: -1},
		{x: +1, y:  0},
		{x:  0, y: +1},
		{x: -1, y:  0},
		];
	const _Images = ["image/crocU.png", "image/crocR.png", "image/crocD.png", "image/crocL.png"];
	const _OmniImages = ["image/crocOU.png", "image/crocOR.png", "image/crocOD.png", "image/crocOL.png"];

	var Cell = function(x, y, td)
	{
		this.x = x;
		this.y = y;
		this.cell = td;
		this.content = null;
		this.targetedBy = null;
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
			this.targetedBy = null;
		},
	}
	
	this.forEachCell = function(callback)
	{
		var args = Array.prototype.slice.call(arguments, 1);
		for(var j = 0; j < mapHeight; ++j)
		{
			var row = _Map[j];
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
	
	this.Crocodile = function(field, dir)
	{
		if(field.content)
			throw "Field occupied";
		if(field.targetedBy)
			throw "Field is targeted by another Crocodile";
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
		this.img.object = this;
		this.update();
		this.updateImageParams();
		bf.appendChild(this.img);
	}

	this.Crocodile.prototype = {
		constructor: this.Crocodile,
		die: _Die,

		updateImageParams: function()
			{
				this.img.style.left = this.x + "em";
				this.img.style.top = this.y + "em";
				this.img.style.opacity = 1 / (this.sleepiness + 1);
			},

		updateImage: function()
			{
				this.img.src = this.images[this.dir];
				this.updateImageParams();
			},

		step: function()
			{
				this.x += this.vx;
				this.y += this.vy;
				if(this.sleepiness)
					this.sleepiness -= normVel;//1 / stepCount;
				this.updateImageParams();
			},
 
		update: function()
			{
				if(!this.sleep)
				{
					this.field.content = null;
					this.field = this.target;
				}
				this.x = this.field.x;
				this.y = this.field.y;
				this.vx = 0;
				this.vy = 0;
				if(!this.sleep)
				{
					if(this.field.content)
					{
						if(!(this.field.content instanceof Meat))
							throw "Can't eat anything except of Meat";
						this.field.content.die();
						this.sleep = 3;
						++this.ate;
					}
					this.field.content = this;
				}
				this.sleepiness = this.sleep;
				this.updateImage();
			},
 
		think: function()
			{
				if (this.sleep)
					return;
				var dir = dirNone;
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
					tdir = (this.dir + 1) % dirCount;
					len = this.checkForMeat(tdir);
					if(len < minLen)
					{
						minLen = len;
						dir = tdir;
					}
					
					tdir = (this.dir + 3) % dirCount;
					len = this.checkForMeat(tdir);
					if(len < minLen)
					{
						minLen = len;
						dir = tdir;
					}
					
					tdir = (this.dir + 2) % dirCount;
					len = this.checkForMeat(tdir);
					if(len < minLen)
					{
						minLen = len;
						dir = tdir;
					}
				}
				
				if(dir != dirNone)
				{
					this.dir = dir;
					dir = _Directions[this.dir];
					this.target = _Map[this.y + dir.y][this.x + dir.x];
					this.target.targeted[this.dir] = this;
				}
				this.updateImage();
			},
 
		go: function()
			{
				if(this.sleep)
				{
					--this.sleep;
					return;
				}
				if(this.target == this.field)
					return;
				if(this.target.content && !this.target.content.isMeat)
				{
					this.target.targeted[this.dir] = null;
					this.target = this.field;
					return;
				}
				var front = this.target.targeted[(this.dir + 2) % dirCount]; // targeted from front
				var left = this.target.targeted[(this.dir + 1) % dirCount]; // targeted from left
				var right = this.target.targeted[(this.dir + 3) % dirCount]; // targeted from right
				if(front && left && right)
					this.dir = (this.dir + 2) % dirCount;
				if(front || ((left == null) != (right == null)))
					this.target = this.field;
				else
					this.walk();
			},
 
		walk: function()
			{
				this.vx = _Directions[this.dir].x * normVel;
				this.vy = _Directions[this.dir].y * normVel;
				this.target.targetedBy = this;
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
					var obj = _Map[y][x].content;
					if(obj instanceof Meat)
						return Math.abs(x - this.field.x + y - this.field.y);
					if(obj && !obj.isTransparent)
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
		isMeat: true,
	}
	
	this.Block = function(field, transparent)
	{
		if(field.content)
			throw "Field occupied";
		field.content = this;
		this.field = field;
		this.x = field.x;
		this.y = field.y;
		this.target = field;
		this.img = document.createElement("img");
		if(transparent)
		{
			this.img.className = "Glass";
			this.img.src = "image/glass.png";
		}
		else
		{
			this.img.className = "Block";
			this.img.src = "image/block.png";
		}
		this.isTransparent = !!transparent;
		this.img.object = this;
		this.img.style.left = this.x + "em";
		this.img.style.top = this.y + "em";
		bf.appendChild(this.img);
	}
	
	this.Block.prototype = {
		constructor: this.Block,
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
	
	this.play = function()
	{
		doUpdating = true;
	}
	
	this.pause = function()
	{
		doUpdating = false;
	}
	
	this.initialize = function(width, height)
	{
		var c = document.getElementById("BattlefieldContainer");
		if(_Map)
		{
			c.removeChild(bf);
			c.removeChild(bkg);
			forEachCell(function()
				{
					if(this.content)
						this.content.die();
				});
		}
		if(width || height)
		{
			mapWidth = width;
			mapHeight = height || width;
			_Map = [];
			while(bkg.rows.length)
				bkg.deleteRow(0);
			for(var j = 0; j < mapHeight; ++j)
			{
				var row = [];
				var trow = bkg.insertRow(-1);
				for(var i = 0; i < mapWidth; ++i)
					row.push(new Cell(i, j, trow.insertCell(-1)));
				_Map.push(row);
			}
		}
		c.appendChild(bf);
		c.appendChild(bkg);
	}

	this.serialize = function()
	{
		var data = {width: mapWidth, height: mapHeight, meat: [], block: [], crocodiles: []};
		forEachCell(function()
			{
				if(this.content instanceof Meat)
					data.meat.push({
						x: this.x,
						y: this.y,
					});
				if(this.content instanceof Block)
					data.block.push({
						x: this.x,
						y: this.y,
						glass: this.content.isTransparent,
					});
				if(this.content instanceof Crocodile)
					data.crocodiles.push({
						x: this.x,
						y: this.y,
						dir: this.content.dir,
						omnicroc: this.content.omnicroc,
						sleep: this.content.sleep,
					});
			});
		return data;
	}

	this.restore = function(data)
	{
		if(!data || !data.width || !data.height || !(data.meat instanceof Array)|| !(data.crocodiles instanceof Array))
			throw "Invalid data";
		this.initialize(data.width, data.height);
		for(var i = 0; i < data.block.length; ++i)
		{
			var desc = data.block[i];
			var meat = new Block(_Map[desc.y][desc.x], desc.glass);
		}
		for(var i = 0; i < data.meat.length; ++i)
		{
			var desc = data.meat[i];
			var meat = new Meat(_Map[desc.y][desc.x]);
		}
		for(var i = 0; i < data.crocodiles.length; ++i)
		{
			var desc = data.crocodiles[i];
			var croc = new Crocodile(_Map[desc.y][desc.x], desc.omnicroc ? dirAuto : desc.dir);
			croc.dir = desc.dir;
			croc.sleep = desc.sleep;
			croc.update();
		}
	}

	var _Map;
	var crocCount = 0;
	var doUpdating;
	var bf = document.getElementById("Battlefield");
	var bkg = document.createElement("table");
	bkg.id = "BattlefieldGrid";
	this.onupdate = [];
	this.pause();
	this.initialize(mapWidth, mapHeight);
	setInterval(_GlobalStep, stepLen * 1000);
})();

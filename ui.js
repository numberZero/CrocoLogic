function bind(fn, obj, args)
{
	args = args || [];
	return function() { fn.apply(obj, args); }
}

function bind_passthis(fn, args)
{
	args = args || [];
	return function(self) { fn.apply(self, args); }
}

(function()
{
	var Click;
	
	function Select()
	{
	}
	
	function Erase()
	{
		if(!this.field.content)
			return;
		this.field.content.die();
	}
	
	function MakeCroc(dir)
	{
		if(this.field.content)
			return;
		new Crocodile(this.field, dir);
	}
	
	function MakeMeat()
	{
		if(this.field.content)
			return;
		new Meat(this.field);
	}
	
	function SelectTool()
	{
		Click = this.fn;
		var old = document.getElementsByClassName("ToolActive");
		while(old.length)
			old[0].classList.remove("ToolActive");
		this.classList.add("ToolActive");
	}
	
	function BFClick(e)
	{
		if(e.target instanceof HTMLTableCellElement)
			Click(e.target);
	}
	
	var tools = [
		[
			{
				name: "Select",
				image: "arrow.png",
				tool: Select,
			},
			{
				name: "Erase",
				image: "delete.png",
				tool: Erase,
			},
		],
		[
			{
				name: "North",
				image: "crocU.png",
				tool: MakeCroc,
				params: [0],
			},
			{
				name: "East",
				image: "crocR.png",
				tool: MakeCroc,
				params: [1],
			},
			{
				name: "South",
				image: "crocD.png",
				tool: MakeCroc,
				params: [2],
			},
			{
				name: "West",
				image: "crocL.png",
				tool: MakeCroc,
				params: [3],
			},
			{
				name: "Auto",
				image: "crocO.png",
				tool: MakeCroc,
				params: [4],
			},
			{
				name: "Meat",
				image: "meat.png",
				tool: MakeMeat,
			},
		]
	];

	var toolbox = document.getElementById("Toolbox");
	for(var k = 0; k < tools.length; ++k)
	{
		var toolgroup = tools[k];
		var panel = document.createElement("span");
		panel.className = "ToolBar";
		for(var i = 0; i < toolgroup.length; ++i)
		{
			var spec = toolgroup[i];
			if(!spec)
			{
				toolbox.appendChild(document.createTextNode(" "));
				continue;
			}
			var tool = document.createElement("img");
			tool.src = spec.image;
			tool.title = spec.name;
			tool.className = "Tool";
			tool.id = "Tool_" + k + "_" + i;
			tool.onclick = SelectTool;
			tool.fn = bind_passthis(spec.tool, spec.params);
			panel.appendChild(tool);
		}
		toolbox.appendChild(panel);
	}
	
	document.getElementById("Battlefield").onclick = BFClick;
	document.getElementById("Tool_0_0").onclick();
})()

		/* Constant identifiers */
		var DIMENSION_GAP = 12.0;
		var DIMENSION_LABEL_MARGIN = 70.0;
		var AGGREGATE_LABEL_MARGIN = 8.0;
		var AGGREGATE_LABEL_MIN_SIZE = 10.0;
		var AGGREGATE_LABEL_MAX_SIZE = 14.0;
		var AGGREGATE_SCALE_FACTOR = 450.0;
		var CURRENT_DIM_POS_X = 50.0;
		var FLOW_GAP = 4.0;
		var width_per_dimension = 350;
		var INTERACTION_WIDTH = 100;
		var MARGIN_TOP = 80.0;
		var currDimPosX = CURRENT_DIM_POS_X;
		var current_dimension = 0;
		var min_value = -1;
		var max_value = -1;
		var load_finished;
		
		var aggregates = ["Intended", "Declared", "Degree"];
		var data; 
		var dimensions;
    	var divisionColors;
    	var category20b_sq = ['#bd9e39',  '#b5cf6b', '#637939', '#01665E', '#35978F', "#393B79","#6B6ECF","#5254A3","#88419d","#7a0177","#CE6DBD", "#e7298a","#e7298a","#dd3497","#f0027f"]; 
    	// reds
    	// "#a50f15","#cb181d","#ef3b2c","#fb6a4a","#fc9272", "#fcbba1"
    	// var category20b_sq = ['#393b79',  '#bd9e39', '#ad494a',  '#637939', '#7b4173' - blue-red, "#003c30","#543005", '#6b6ecf', '#e7ba52','#d6616b','#b5cf6b', '#ce6dbd',"#35978f","#bf812d"];
    	var sum_values;
    	var formatPercentage = d3.format(".0%");
    	var formatNumber = d3.format(",");
				
		$(document).ready(function(){
			initializeFlow();
			
			//Load aggregated data
			loadAggregate();
			
			//Draw side chart		
			drawIntChart();
			drawDecChart();
			showCommentary();
		});  
	   


		// end persist chart
		
		function refresh()
		{
			if(load_finished)
			{
				loadingFinished(false);
				clearSVGCanvas();
				loadAggregate();
			}
		}
	   
		function drawDimension(aggregated_data, dimension) {
			"use strict";
		
			var sumValue = sumDimension(aggregated_data);
						
			var currPosY = MARGIN_TOP;
			var currPosLabelY = MARGIN_TOP;
						
			d3.select('.svg_canvas')
				.append('g')
				.attr('class', 'dimension_group')
				.selectAll('.dimension_line')
				.data(aggregated_data)
				.enter()
				.append('path')
				.attr('class', 'dimension_line')
				.attr('dim_axis', dimension)
				.attr('x', currDimPosX)
				.attr('height', function(aggregate){
					return (parseFloat(aggregate.value)/sumValue) * AGGREGATE_SCALE_FACTOR;
				})
				.attr('id', function(aggregate){
					return StringOperations.buildID(aggregate.dimension); 
				})
				.attr('d', function(aggregate)
				{

					var posY = (parseFloat(aggregate.value)/sumValue) * AGGREGATE_SCALE_FACTOR;
										
					var path_data = "M " + currDimPosX + " " + currPosY + " L " + currDimPosX + " " + (currPosY + posY);
					
					d3.select(this).attr('y', currPosY);
					d3.select(this).attr('dimValue', aggregate.value);
					currPosY += posY + DIMENSION_GAP;
										
					return path_data;
				})
				.style('stroke-opacity', 0.0)
				.style("stroke", function(d) {
				        return d.color = divisionColors(d.dimension.substring(1, d.dimension.length));})
				.transition()
				.duration(500)
				.style('stroke-opacity', 0.75);
						
			addDimensionLabels(dimension, currDimPosX);
			
			currDimPosX += width_per_dimension;
			
			current_dimension += 1;
			
			if(current_dimension < aggregates.length)
			{			
				loadAggregate();
			}
			else
			{
				current_dimension = 0;
				currDimPosX = CURRENT_DIM_POS_X;
				loadFlows();
			}
		
	   }
		function loadAggregate()
		{
			d3.csv("idg_div_aggregate6.csv", function(error, csv) {
			  if (error) return console.warn(error);
			  data = csv;
			  var aggregates = d3.nest().key(function(d) {return d.aggregate;}).entries(data);

			  dimensions = d3.nest().key(function(d) {return d.dimension.substring(1, d.dimension.length);}).entries(data).map(function (d) {return d.key;});
			  // divisionColors = d3.scale.category20b().domain(dimensions);
			  divisionColors = d3.scale.ordinal().domain(dimensions).range(category20b_sq);
			  drawDimension(aggregates[current_dimension].values, aggregates[current_dimension].key);

			  });
		}
		
		function addDimensionLabels(dimension, currDimPosX)
		{
			//Add labels of the dimension
			d3.select('.svg_canvas')
				.append('text')
				.text(dimension.toUpperCase())
				.attr('class', 'dimension_header')
				.attr('x', function() { return currDimPosX;} )
				.attr('y', DIMENSION_LABEL_MARGIN)
				.style('fill-opacity', 0.0)
				.transition()
				.duration(2500)
				.style('fill-opacity', 1.0);
		}
		
		function addAggregateLabels()
		{
			var svg_canvas = d3.select('.svg_canvas');
			d3.selectAll('.dimension_line').each(function(aggregate)
			{
				var dim_line = d3.select(this);
				
				svg_canvas.append('text')
				.text(aggregate.dimension.substring(1,aggregate.dimension.length).replace(" and ", "&"))
				.attr('id', (aggregate.dimension))
				.attr('class', 'aggregate_label')
				.attr('x', parseFloat(dim_line.attr('x')) + AGGREGATE_LABEL_MARGIN)
				.attr('y', parseFloat(dim_line.attr('y')) + (parseFloat(dim_line.attr('height')) / 2.0))
				.style('font-size', function()
				{				
					if(parseFloat(dim_line.attr('height')) < 10.0)
					{
						return Math.max(AGGREGATE_LABEL_MIN_SIZE, parseFloat(dim_line.attr('height')));
					}
					else
					{
						return AGGREGATE_LABEL_MAX_SIZE;
					}
				})
				.style('fill-opacity', 0.0)
				.transition()
				.duration(2500)
				.style('fill-opacity', 1.0);
			});				
		}
		
		function loadFlows()
		{

			//load the csv file into an object
			d3.csv("idg_div6.csv", function(error, csv) {
			 
			drawFlows(csv);

		});
	}
				
		function initializeFlow()
		{
			var svg_width = $('body').width() - $('#navigation').width() - (CURRENT_DIM_POS_X * 2.0);
			
			d3.select('#content')
				.append('svg')
				.attr('class', 'svg_canvas')
				.attr('width', svg_width);
			
			width_per_dimension = (svg_width / (aggregates.length - .5)) - CURRENT_DIM_POS_X;
		}
	   
		function drawFlows(raw_flow_data)
		{
			d3.select('.svg_canvas')
				.selectAll('.flow_line')
				.data(raw_flow_data)
				.enter()
				.append('path')
				.attr('class', 'flow_line')
				.attr('d', function(flow_line)
				{	
					var value = parseFloat(flow_line.value);
				
					if(value > 0.0)
					{
						var path_data = "";
						
						for(var i = 0; i < aggregates.length - 1; i++)
						{
							var dimAxisFrom = d3.select("#" + StringOperations.buildID(flow_line[aggregates[i]]));
							var dimAxisTo = d3.select("#" + StringOperations.buildID(flow_line[aggregates[i + 1]]));
							
							var startHeight = (value / parseFloat(dimAxisFrom.attr('dimValue'))) * parseFloat(dimAxisFrom.attr('height'));
							var endHeight = (value / parseFloat(dimAxisTo.attr('dimValue'))) * parseFloat(dimAxisTo.attr('height'));
														
							var startX = parseFloat(dimAxisFrom.attr('x'));
							var startY;
							
							if(dimAxisFrom.attr('currPosY') == null)
								startY = parseFloat(dimAxisFrom.attr('y'));
							else
								startY = parseFloat(dimAxisFrom.attr('currPosY'));
							
							dimAxisFrom.attr('currPosY', startY + startHeight);
							
							
							var endX = parseFloat(dimAxisTo.attr('x'));
							var endY;
							
							if(dimAxisTo.attr('currPosY') == null)
								endY = parseFloat(dimAxisTo.attr('y'));
							else
								endY = parseFloat(dimAxisTo.attr('currPosY'));
							
							
							if(i == aggregates.length - 2)
								dimAxisTo.attr('currPosY', endY + endHeight);
							
							var flowShape = new FlowShape(startX + FLOW_GAP, startY, endX - FLOW_GAP, endY, startHeight, endHeight);
							path_data += " " + flowShape.getPathData();
						}
						
						return path_data; 
					}
					// else
					// {
					// 	return "";
					// }
						
				});
	
			addAggregateLabels();
			drawInteractionShapes();
			loadingFinished(true);
		}
				
		function drawInteractionShapes()
		{
			var svg_canvas = d3.select('.svg_canvas');
			d3.selectAll(".dimension_line").each(function()
			{
				svg_canvas.append('rect')
				.data(d3.select(this).data())
				.attr('dim_axis', d3.select(this).attr('dim_axis'))
				.attr('x', d3.select(this).attr('x') - (INTERACTION_WIDTH / 2.0))
				.attr('y', d3.select(this).attr('y'))
				.attr('width', INTERACTION_WIDTH)
				.attr('height', d3.select(this).attr('height'))
				.attr('class', 'interaction_shape')
				.on('mouseover', highlightNode)
				.on('mouseout', unhighlightNode)
				.on('click', highlightFlows);
			});

		}	
		
		function highlightNode() {
			var dim = d3.select(this).data()[0].dimension;
			var dim_axis = d3.select(this).attr('dim_axis');
			
			d3.selectAll('.dimension_line').filter(function(d) {return d.dimension == dim;}).style("stroke-opacity",0.50);
			// d3.selectAll('.aggregate_label,id=' + dim + '"').style("font-color","steelblue");
		}

		function unhighlightNode() {
			var dim = d3.select(this).data()[0].dimension;
			
			d3.selectAll('.dimension_line').filter(function(d) {return d.dimension == dim;}).style("stroke-opacity",0.85);
		}


		function clearSVGCanvas()
		{
			d3.selectAll('.flow_line_highlighted').remove();
			d3.selectAll('.flow_line').remove();
			d3.selectAll('.flow_line_hide').remove();
			d3.selectAll('.dimension_group').remove();
			d3.selectAll('.dimension_line').remove();
			d3.selectAll('.interaction_shape').remove();
			d3.selectAll('.aggregate_label').remove();
			d3.selectAll('.value_label').remove();
			d3.selectAll('.dimension_header').remove();
		}
		
		/*-------------*/
		/* Interaction */
		/*-------------*/
		
		function highlightFlows()
		{
			var dim = d3.select(this).data()[0].dimension;
			var dim_axis = d3.select(this).attr('dim_axis');
			
			deselectFlows();
				
			d3.selectAll('.flow_line')
			.attr('class', function(flow_data)
			{
				if(flow_data[dim_axis] == dim)
					return 'flow_line_highlighted';	
				else
					return 'flow_line_hide';
			});	

			showValues();
			showCommentary(dim);
		}
		
		function deselectFlows()
		{
			d3.selectAll('.flow_line_highlighted')		
			.attr('class', 'flow_line');
			
			d3.selectAll('.flow_line_hide')		
			.attr('class', 'flow_line');
			d3.selectAll('.value_label').remove();
		}
		
		function showValues()
		{
			var highlighted_flows = d3.selectAll('.flow_line_highlighted');
				
			sum_values = new Array();
			for(var i = 0; i < aggregates.length; i++)
			{
				sum_values[i] = new Object();
			}
			
			if(!highlighted_flows.empty())
			{					
				highlighted_flows.each(function(flow_data){
					for(var i = 0; i < aggregates.length; i++)
					{
						var dim = flow_data[aggregates[i]];
						
						if(sum_values[i][dim] == undefined)
						{
							sum_values[i][dim] = parseFloat(flow_data.value);
						}
						else
						{
							sum_values[i][dim] += parseFloat(flow_data.value);
						}
					}			
				});
			}
			else
			{
				d3.selectAll('.flow_line').each(function(flow_data){
					for(var i = 0; i < aggregates.length; i++)
					{
						var dim = flow_data[aggregates[i]];
						
						if(sum_values[i][dim] == undefined)
						{
							sum_values[i][dim] = parseFloat(flow_data.value);
						}
						else
						{
							sum_values[i][dim] += parseFloat(flow_data.value);
						}
					}			
				});
			}

			if(showNumberCheckbox.checked)
				{
				
				var svg_canvas = d3.select('.svg_canvas');
				
				d3.selectAll('.dimension_line').each(function(aggregate)
				{
					var dim_line = d3.select(this);
					
					svg_canvas.append('text')
					.text(function()
					{
						var value = sum_values[jQuery.inArray(dim_line.attr('dim_axis'), aggregates)][aggregate.dimension];
						
						if(value == undefined)
							return "";
						else
							return $.formatNumber(value, {format:"#,###", locale:"us"});
					})
					.attr('class', 'value_label')
					.attr('x', parseFloat(dim_line.attr('x')) - AGGREGATE_LABEL_MARGIN)
					.attr('y', parseFloat(dim_line.attr('y')) + (parseFloat(dim_line.attr('height')) / 2.0))
					.style('font-size', function()
					{				
						if(parseFloat(dim_line.attr('height')) < 10.0)
						{
							return Math.max(AGGREGATE_LABEL_MIN_SIZE, parseFloat(dim_line.attr('height')));
						}
						else
						{
							return AGGREGATE_LABEL_MAX_SIZE;
						}
					})
					.style('fill-opacity', 0.0)
					.transition()
					.duration(2500)
					.style('fill-opacity', 1.0);
				});				
			}
			else			
			{
				d3.selectAll('.value_label').remove();
			}
		}
		
		function sumDimension(dimension)
		{
			var totalValue = 0.0;
			
			$.each(dimension, function(index, property)
			{
				totalValue += parseFloat(property.value);
			});
		
			return totalValue;
		}


		function showCommentary(dimension) {
			// construct the commentary

			d3.select("#commentary text").transition().style("stroke-opacity",0.0);
			d3.select("#commentary").html("");

			if(!dimension) {
				d3.select("#commentary").append("text")
						.style("opacity", 0)
						.html("Hello. Click on any of the<span style='background-color:#ffffe5;'><span style='color:#bd9e39;'> c</span><span style='color:#b5cf6b;'>o</span><span style='color:#637939;'>l</span><span style='color:#01665E;'>o</span><span style='color:#35978F;'>r</span><span style='color:#393B79;'>e</span><span style='color:#6B6ECF;'>d</span> <span style='color:#88419d;'>b</span><span style='color:#7a0177;'>a</span><span style='color:#CE6DBD;'>r</span><span style='color:#e7298a;'>s </span></span> (below) or on the<span style='background-color:#ffffe5;'><span style='color:#6B6ECF;'> b</span><span style='color:#35978F;'>a</span><span style='color:#bd9e39;'>r</span> <span style='color:#7a0177;'>c</span><span style='color:#CE6DBD;'>h</span><span style='color:#5254A3;'>a</span><span style='color:#393B79;'>r</span><span style='color:#e7298a;'>t</span><span style='color:#bd9e39;'>s </span></span> (on the left)<br>to filter the flows from that perspective. Try showing/hiding the number of students.<br>&larr; For more context, please see the accompanying Major Migration Narrative");
						// ['#bd9e39',  '#b5cf6b', '#637939', '#01665E', '#35978F', "#393B79","#6B6ECF","#5254A3","#88419d","#7a0177","#CE6DBD", "#e7298a","#e7298a","#dd3497","#f0027f"]
			d3.selectAll("#commentary text")
					.transition().delay(3000).duration(2000)
					.style("opacity",1);
			}

			if(dimension) {

			var sv0 =  "i" + dimension.substring(dimension.length,1);
			var sv1 =  "d" + dimension.substring(dimension.length,1);
			var sv2 =  "g" + dimension.substring(dimension.length,1);

			if(dimension.substring(0,1,dimension.length) == "i") {
				//conditional logic to treat the text for certain buckets, such as L&S Undeclared
				if(dimension=="iL and S Undeclared") {

					d3.select("#commentary").append("text")
						.style("opacity", 0)
						.html("<br>Of the <span class='numStudents'>" + formatNumber(sum_values[0][sv0]) + "</span> students who entered L&S without an intended major, <span class='numStudents'>" + formatPercentage(sum_values[1]["dNo Declared Major"] / sum_values[0][sv0]) + "</span> did not declare a major and <span class='numStudents'>" + formatPercentage(sum_values[2]["gNo Degree"] / sum_values[0][sv0]) + "</span> did <span style='color:#fb6a4a;'>not</span> earn a degree by the end of the 2012-13 academic year.");
					}
				else if(dimension=="iNo Intended Major") {

					d3.select("#commentary").append("text")
						.style("opacity", 0)
						.html("<br>Of the <span class='numStudents'>" + formatNumber(sum_values[0][sv0]) + "</span> students who entered without an intended major, <span class='numStudents'>" + formatPercentage((isNaN(sum_values[1]["dNo Declared Major"]) ? 0 : sum_values[1]["dNo Declared Major"]) / sum_values[0][sv0]) + "</span> did not declare a major and <span class='numStudents'>" + formatPercentage(sum_values[2]["gNo Degree"] / sum_values[0][sv0]) + "</span> did not earn a degree by the end of the 2012-13 academic year.");
					}
				else {
					d3.select("#commentary").append("text")
						.style("opacity", 0)
						.html("Of the <span class='numStudents'>" + formatNumber(sum_values[0][sv0]) + "</span> students who entered intending to pursue a degree in " + sv0.substring(1,sv0.length).replace(" and ", "&") + ", <span class='numStudents'>" + formatPercentage(sum_values[1][sv1] / sum_values[0][sv0]) + "</span> declared their major there, and <span class='numStudents'>" + formatPercentage(sum_values[2][sv2] / sum_values[0][sv0]) + "</span> received their degrees from " + sv0.substring(1,sv0.length).replace(" and ", "&") + ". A total of <span class='numStudents'>" + formatPercentage(1 - (isNaN(sum_values[2]["gNo Degree"]) ? 0 : sum_values[2]["gNo Degree"])/ sum_values[0][sv0]) + "</span> earned a degree from UC Berkeley by the end of the 2012-13 academic year.");
					}
			}

			else if(dimension.substring(0,1,dimension.length) == "d") {
				// accommodate dNA
				if(dimension=="dNo Declared Major") {

					d3.select("#commentary").append("text")
						.style("opacity", 0)
						.html("<br>Of the <span class='numStudents'>" + formatNumber(sum_values[1][sv1]) + "</span> students who did not declare a major, <span class='numStudents'>" + formatPercentage(sum_values[0]["iL and S Undeclared"] / sum_values[1][sv1] ) + "</span> entered Letters & Science undeclared, and <span class='numStudents'>" + formatPercentage(sum_values[2]["gNo Degree"] / sum_values[1][sv1]) + "</span> did <span style='color:#fb6a4a;'>not</span> earn a degree by the end of the 2012-13 academic year.");
					}
				else {
				d3.select("#commentary").append("text")
					.style("opacity", 0)
					.html("Of the <span class='numStudents'>" + formatNumber(sum_values[1][sv1]) + "</span> students who declared their major within " + sv1.substring(1,sv1.length).replace(" and ", "&") + ", <span class='numStudents'>" + formatPercentage(sum_values[0][sv0] / sum_values[1][sv1]) + "</span> intended to major there, and <span class='numStudents'>" + formatPercentage(sum_values[2][sv2] / sum_values[1][sv1]) + "</span> received their degrees from " + sv1.substring(1,sv1.length).replace(" and ", "&") +". A total of <span class='numStudents'>" + formatPercentage(1 - (sum_values[2]["gNo Degree"] / sum_values[1][sv1])) + "</span> earned a degree from UC Berkeley by the end of the 2012-13 academic year.");
				}
			}

			else if (dimension.substring(0,1,dimension.length) == "g") {
				// accommodate gNo Degree
				if(dimension=="gNo Degree") {

					d3.select("#commentary").append("text")
						.style("opacity", 0)
						.html("Of the <span class='numStudents'>" + formatNumber(sum_values[2][sv2]) + "</span> students who did <span style='color:#fb6a4a;'>not</span> earn a degree by the end of the 2012-13 academic year,<br><span class='numStudents'>" + formatPercentage(sum_values[1]["dNo Declared Major"] / sum_values[2][sv2]) + "</span> did not declare a major, and <span class='numStudents'>" + formatPercentage((sum_values[0]["iL and S Undeclared"] + sum_values[0]["iNo Intended Major"]) / sum_values[2][sv2]) + "</span> were admitted as undeclared or with no intending major specified.");	
					}
				else {
				d3.select("#commentary").append("text")
					.style("opacity", 0)
					.html("<br>Of the <span class='numStudents'>" + formatNumber(sum_values[2][sv2]) + "</span> students who received a degree from " + sv2.substring(1,sv2.length).replace(" and ", "&") + ", <span class='numStudents'>" + formatPercentage(sum_values[1][sv1] / sum_values[2][sv2]) + "</span> declared their major there, and <span class='numStudents'>" + formatPercentage(sum_values[0][sv0] / sum_values[2][sv2]) + "</span> were admitted intending to major there.");	
				}
			}

			d3.selectAll("#commentary text")
					.transition().duration(2000)
					.style("opacity",1);

			}

		}
		
		
		function loadingFinished(ready)
		{
			load_finished = ready;
		}
				
		function getOverview()
		{
			deselectFlows();
			showValues();
			showCommentary(null);
		}
		
		function  dispatchBar() {
			console.log(this.__data__.x);
			var bar_dim = this.__data__.x;	

			// super huge thanks to Mike Bostock and his example for how to do this: http://bl.ocks.org/mbostock/4679202		
			var shape = d3.selectAll(".interaction_shape").filter(function (d) {return d.dimension == bar_dim;}).each(highlightFlows);
		}
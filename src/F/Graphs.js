F.GraphUtils = function(){
	var getSeriesVariables = function(series, options){
		var defaults = {
			compile: true
		}
		$.extend(defaults, options);
		var variableList= [];
		
		for(var i=0; i<series.length; i++){
			var thisseries = series[i];
			
			for(var j=0; j< thisseries.data.length; j++){
				var item = thisseries.data[j];
				if(F.isString(item) && !F.Array.contains(item, variableList)){
					var templatedName = (defaults.compile) ? F.Template.compile(item) : item;
					variableList.push(item);
				}
				else if(F.isObject(item) && F.isString(item.y) && !F.Array.contains(item.y, variableList)){
					var templatedName = (defaults.compile) ? F.Template.compile(item.y): item.y;
					variableList.push(templatedName);
				}				
			}
		}
		return variableList;
	}
	
	var getDataForSeries = function(variableList, callback, options){
		var useArchive= (options && options.archiveParams);

		if(!variableList || variableList.length === 0){
			callback([]);
		}
		else{
			var type = "concise";
			for(var i=0; i< variableList.length; i++){
				variableList[i] = variableList[i].toLowerCase(); 
				if(variableList[i].indexOf(".result") !== -1){
					//Extract stuff within brackets
					//var index = variableList[i].toLowerCase().replace(/.*.result\(|\)/gi,'');
					variableList[i]= variableList[i].substr(0,variableList[i].indexOf(".result"));
				}
			}
			
			if(useArchive){
				F.API.Archive.getRuns(options.archiveParams, function(runs){
					if(runs.length){
						var runValues = runs[0].values;
						callback(runValues) ;
					}
				})
			}
			else{
				F.API.Run.getValues(variableList, function(run){
					var runValues = run.values;
					callback(runValues) ;
				}, {format: "runtime"});
			}
			
		}
	}
	
	var unifySeriesData = function(runValues, ipSeries, callback, options){
		var series = F.Array.copy(ipSeries);
		var useResultFormatted = (options && options.plotResultFormatted);
		
		var numberFormat = "";
		//console.log("unifySeriesData", runValues, ipSeries, options, useResultFormatted)
		for(var i=0; i<series.length; i++){
			var thisseries = series[i];
				thisseries.dataFormatted = [];
			
			var dataArray = [];
			var dataFormattedArray = [];
			
			for(var j=0; j< thisseries.data.length; j++){
				var item = thisseries.data[j];
				var index = j;
				if(F.isString(item)){
					var itemName = $.trim(F.Template.compile(item).toLowerCase());
					//TODO: make ', ' same as ',' to allow errors in specifying name
					
					var pattern = /(.*).(Result|Decision)\((.*)\)/i;
					var match = pattern.exec(itemName);
					if(match){
						var actualVarName = match[1];
						var isResult = (match[2] === "result");
						var range = match[3]; // ... or 1..3
						
						var results = runValues[actualVarName].results; //TODO: Also split for .decision
						numberFormat =runValues[actualVarName].numberFormat;
						
						if(range){
							var first = range.charAt(0);
							var max = range.length -1;
							var last = range.charAt(max);
							
							var startIndex = (first === ".") ? 0 : parseInt(first);
							var endIndex = (last === ".") ? results.length : last;
							
							results = results.slice(startIndex, endIndex);
						}
						
						var kindex = 0;
						for(var k=0; k< results.length; k++){
							kindex++;
							index = j+kindex;
							//dataArray.push(parseFloat(results[k].result));
							var val = (!useResultFormatted) ? parseFloat(results[k].result) : F.Number.extract(results[k].resultFormatted);
							
							
							dataArray.push(val);
							dataFormattedArray.push(results[k].resultFormatted);
						}
					}
					else{
						//Just a regular variable name
						
						var val = (!useResultFormatted) ? parseFloat(runValues[itemName].result) : F.Number.extract(runValues[itemName].resultFormatted);
						dataArray[index] =  val;
						numberFormat = runValues[itemName].numberFormat;
						dataFormattedArray[index] = runValues[itemName].resultFormatted;
					}
		
				}
				else if(F.isObject(item) && item.y){
					//Data was specified in "y" format
					var itemClone = $.extend(true, {}, item);
					var itemFormattedClone = $.extend(true, {}, item);
					
					var itemName = $.trim(F.Template.compile(itemClone.y).toLowerCase());
					//var value = (runValues[itemName].result);
					var value = (F.Number.extract(runValues[itemName].resultFormatted));
					var valueFormatted =runValues[itemName].resultFormatted;
						
					numberFormat = runValues[itemName].numberFormat;
					
					itemClone.y = value;
					itemFormattedClone.y = valueFormatted;
					
					dataArray[index] = itemClone;
					dataFormattedArray[index] = itemFormattedClone;
				}
				else if(!isNaN(parseFloat(item))){
					dataArray.push(item)
				}
				else{
					throw new Error("unknown data format to unifySeriesData", item)
				}
			}
			
			//console.log("fina", dataArray, dataFormattedArray)
			thisseries.data = dataArray;
			thisseries.dataFormatted = dataFormattedArray;
			thisseries.numberFormat = numberFormat;
			
			series[i] = thisseries;
		}
		//console.log(ipSeries, series, numberFormat, "unify")
		return {series: series, numberFormat: numberFormat};
	}
	
	return{
		populateSeries: function(series, callback, options){
			var variableList = getSeriesVariables(series);
			getDataForSeries(variableList, function(runValues){
				var populatedSeries = unifySeriesData(runValues, series, $.noop, options);
				callback(populatedSeries.series, populatedSeries.numberFormat);
			}, options);
		}
	};
}();

var FChart = function(options){
	var hc, model, isDataURL;

	var defaultOptions = {
		FOptions: {
			numberFormat: "auto"
		},
		title: {
			 style:{
				fontFamily: 'verdana',
				fontSize: '12px',
				fontWeight: 'bold',
				color: '#555555'
			 }
	      },
	      credits:{
			enabled: false
			},
  	      legend: {
	         floating: false,
	         backgroundColor: '#FFFFFF',
	         borderColor: '#CCC',
	         borderWidth: 1,
	         shadow: false
	      },
		 tooltip: {
	         formatter: function() {
                 var options = this.series.options;
                 return options.formatted ? options.formatted[this.x] : this.y;
	         },
	         borderRadius: 0
	      },
		  series: []
	}
	$.extend(true, defaultOptions, options);
	
	isDataURL = (defaultOptions.seriesURL) ? true: false;
	
	var defaultseries = F.Array.copy(defaultOptions.series);
	var model = $.extend(true, [], defaultseries);
	
	function draw(callback){
		if(isDataURL){
			var ac = new AjaxConnection(defaultOptions.seriesURL);
				ac.getJSON("", function(res){
					var res = $.parseJSON(F.String.clean(res))
					callback(res);
				})
		}
		else{
			F.GraphUtils.populateSeries(model, callback,defaultOptions.FOptions);
		}
	}
	
	draw(function(series, numberFormat){
		defaultOptions.series = series;
		
		var format = defaultOptions.FOptions.numberFormat;
		if(format !== "auto"){
			var noFormat = (defaultOptions.FOptions.numberFormat)? defaultOptions.FOptions.numberFormat: numberFormat;
			var formatter = {
				yAxis:{
					labels:{
						formatter: function(){
							var formatted = F.Number.format(this.value, noFormat);
							//console.log(this.value, noFormat,numberFormat, formatted);
							return formatted;
						}
					}
				}
			}
			defaultOptions = $.extend(true, {}, defaultOptions,formatter );
		}

		hc = new Highcharts.Chart(defaultOptions);
	});
	
	
	return{
		chart:function(){
			return hc;
		},
		redraw: function(series, callback){
			
			var populate = function(series){
				var dirty = false;
				for(var i=0; i< series.length; i++){
					if(!F.Array.areEqual(series[i].data, hc.series[i].data)){
						//console.log("populate", series[i], hc.series[i])
						hc.series[i].setData(series[i].data, false);
						hc.series[i].options.dataFormatted = series[i].dataFormatted; // A little hacky
						dirty = true;
					}
				}
				if(dirty){
					hc.redraw();
				}
			}
			
			if(!series){
				draw(populate);
			}
			else{
				populate(series);
			}
			
			
		},
		getModel: function(){
			var cleanedModel = F.GraphUtils.getSeriesVariables(model, {compile: false});
			return cleanedModel;
		},
		getDataset: function(){
			var dSet = {}
			for(var i=0; i<hc.series.length; i++){
				var thisseries = hc.series[i];
				var olddata = thisseries.data;
				for(var j=0; j< olddata.length; j++){
					//console.log(olddata[j]);
					dSet[olddata[j].name] = olddata[j].y;
				}
			}
			//console.log(dSet)
		},
		update: function(changedValues){
			
		}
	}
}

var FStackedColumn = function(container, options){
	var defaultOptions = {
		chart: {
			renderTo: container,
			defaultSeriesType: 'column'
		},
		legend:{
			enabled:false
	    },
		xAxis:{
			lineColor: '#ababab', 
			lineWidth: 1,
			gridLineColor:'#FFFFFF',
			tickWidth: 0
		},
		yAxis:{
			lineColor: '#ababab', 
			lineWidth: 1,
			gridLineColor:'#FFFFFF',
			tickWidth: 0
		}
		
	}
	$.extend(true, defaultOptions, options);
	
	var fc = new FChart(defaultOptions);
	return fc;
}

var FArea= function(container, options){
	var defaultOptions = {
		chart: {
			renderTo: container,
			defaultSeriesType: 'area'
		},
		plotOptions: {
			area: {
	          stacking: 'normal',
	          linewidth: 0
	        },
	         series: { 
              marker: { 
                enabled: false, 
                radius: 0 
              },
              lineWidth: 0
            }
		}
	}
	$.extend(true, defaultOptions, options);
	
	//console.log("area", defaultOptions)
	var fc = new FChart(defaultOptions);
	return fc;
	
}
var FBar = function(container, options){
	var defaultOptions = {
		chart: {
			renderTo: container,
			defaultSeriesType: 'bar'
        },
		plotOptions: {
			series: {
				borderWidth: 0,
				shadow: false
			}
		},
		xAxis:{
			lineColor: '#ababab', 
			lineWidth: 1,
			gridLineColor:'#FFFFFF',
			tickWidth: 0
		},
		yAxis:{
			lineColor: '#ababab', 
			lineWidth: 1,
			gridLineColor:'#FFFFFF',
			tickWidth: 0
		}
	}
	$.extend(true, defaultOptions, options);
	
	var fc = new FChart(defaultOptions);
	return fc;
}

var FLine = function(container, options){
			var me = this;

	var defaultOptions = {
		chart: {
			renderTo: container,
			defaultSeriesType: 'line'
		},
		FOptions:{
			drawable: false
		},
		legend:{
			enabled:false
		},
		credits:{
			enabled: false
		},
		xAxis:{
			lineColor: '#ababab', 
			lineWidth: 1,
			gridLineColor:'#FFFFFF',
			tickWidth: 0
		},
		yAxis:{
			lineColor: '#ababab', 
			lineWidth: 1,
			gridLineColor:'#FFFFFF',
			tickWidth: 0
		},
		plotOptions: {
		  series: {
            borderWidth: 0,
            shadow: false
          },
		  line: {
		      marker: {
		          radius: 2,
		          symbol: "circle"
		      }
		  }  
		}		
	}
	
	$.extend(true, defaultOptions, options);
	
	if(defaultOptions.FOptions.drawable){
		$.extend(true, defaultOptions, {
			chart:{
				  events : {
					load: function(e){
						var chart = e.currentTarget;
						var container = chart.container,
						yValue = null;
					
						var getPoint = _.memoize(function(axis, e) {
							//normalize for ie
							var x = (e.chartX) ? e.chartX : e.x;
							var y = (e.chartY) ? e.chartY : e.y;
							var pc = axis.isXAxis ? 
								x - chart.plotLeft : 
								chart.plotHeight - y + chart.plotTop
							var val = axis.translate(
								 pc,
								true
							);
							return val;
						}, function(axis, e) {
							var x = (e.chartX) ? e.chartX : e.x;
							var y = (e.chartY) ? e.chartY : e.y;
							return [axis.isXAxis ? 'x': 'y', x, y].join('_');
						});
					
						var capture = function(e) {
							if (e.originalEvent) {
								e = e.originalEvent;
							}
							if(e.shiftKey) {
								var series = _.first(chart.series);
								yValue = Math.round(getPoint(series.yAxis, e) * 2) / 2;
							}
						};
					
						var move = function(e) {
							if (e.originalEvent) {
								e = e.originalEvent;
							}
							var isiPad = navigator.userAgent.match(/iPad/i) != null;
							//Highcharts ismousedown doesn't work on ipads
							if(!isiPad && !chart.mouseIsDown)
								return false;
					
							var series = _.first(chart.series);
							var x = Math.round(getPoint(series.xAxis, e)),
							y = yValue !== null ? yValue : Math.round(getPoint(series.yAxis, e) * 2) / 2;
							
							if(series.data[x])
								series.data[x].update(y, true, false);
						};
					
						var drop = function(e) {
							yValue = null;
						};
					
						$(container)
						.on('mousedown.dlg touchstart.dlg', capture)
						.on('mousemove.dlg touchmove.dlg', move)
						.on('mouseleave.dlg touchend.dlg', drop)
						
						chart.markReadonly = function(){
							$(container)
								.off('mousedown.dlg touchstart.dlg')
								.off('mousemove.dlg touchmove.dlg')
								.off('mouseleave.dlg touchend.dlg');
								
								$(document).off('mouseup.dlg');
						}
						
					}
		          }
			}
		});
	}
	
	//console.log("line options", defaultOptions)
	var fc = new FChart(defaultOptions);
		
	return fc;
}


var FPie = function(container, options){
	var defaultOptions = {
		chart: {
			renderTo: container,
			defaultSeriesType: 'pie'
		},
		legend:{
			enabled:false
		},
		credits:{
			enabled: false
		},
		xAxis:{
			lineColor: '#ababab', 
			lineWidth: 1,
			gridLineColor:'#FFFFFF',
			tickWidth: 0
		},
		yAxis:{
			lineColor: '#ababab', 
			lineWidth: 1,
			gridLineColor:'#FFFFFF',
			tickWidth: 0
		}
	}
	$.extend(true, defaultOptions, options);
	
	var fc = new FChart(defaultOptions);
	return fc;
}

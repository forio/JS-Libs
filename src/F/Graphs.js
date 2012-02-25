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
	
	var getDataForSeries = function(variableList, callback){
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
			F.API.Run.getValues(variableList, function(run){
				var runValues = run.values;
				callback(runValues) ;
			}, {format: "runtime"});
		}
	}
	
	var unifySeriesData = function(runValues, ipSeries, callback){
		var series = F.Array.copy(ipSeries);

		//console.log("unifySeriesData", runValues, ipSeries)
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
					
					if(itemName.indexOf(".result") !== -1){
						var newItemName = itemName.substr(0,itemName.indexOf(".result"));
						var results = runValues[newItemName].results;
						
						var kindex = 0;
						for(var k=0; k< results.length; k++){
							if(k%2 == 0){
								//TODO: skipping a step for now
								kindex++;
								index = j+kindex;
								//dataArray.push(parseFloat(results[k].result));
								dataArray.push(F.Number.extract(results[k].resultFormatted));
								dataFormattedArray.push(results[k].resultFormatted);
							}
						}
					}
					else{
						dataArray[index] =  parseFloat(runValues[itemName].result);
						dataFormattedArray[index] = runValues[itemName].resultFormatted;
					}
				}
				else if(F.isObject(item) && item.y){
					//Data was specified in "y" format
					var itemClone = $.extend(true, {}, item);
					var itemFormattedClone = $.extend(true, {}, item);
					
					var itemName = $.trim(F.Template.compile(itemClone.y).toLowerCase());
					//var value = (runValues[itemName].result);
					var value = (F.Number.extract[itemName].resultFormatted);
					var valueFormatted =runValues[itemName].resultFormatted;
						
					itemClone.y = value;
					itemFormattedClone.y = valueFormatted;
					
					dataArray[index] = itemClone;
					dataFormattedArray[index] = itemFormattedClone;
				}
				else if(parseFloat(item)){
					dataArray.push(item)
				}
				else{
					throw new Error("unknown data format to unifySeriesData", item)
				}
			}
			
			//console.log("fina", dataArray, dataFormattedArray)
			thisseries.data = dataArray;
			thisseries.dataFormatted = dataFormattedArray;
			
			series[i] = thisseries;
		}
		//console.log(ipSeries, series, "unify")
		return series;
	}
	
	return{
		populateSeries: function(series, callback){
			var variableList = getSeriesVariables(series);
			getDataForSeries(variableList, function(runValues){
				var populatedSeries = unifySeriesData(runValues, series);
				callback(populatedSeries);
			});
		}
	};
}();

var FChart = function(options){
	var hc, model, isDataURL;

	var defaultOptions = {
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
					callback(res)
				})
		}
		else{
			F.GraphUtils.populateSeries(model, callback);
		}
	}
	
	draw(function(series){
		defaultOptions.series = series;
		hc = new Highcharts.Chart(defaultOptions);
	});
	
	
	return{
		chart: hc,
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
	    legend:{
			enabled:false
	    },
		credits:{
			enabled: false
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
	var defaultOptions = {
		chart: {
			renderTo: container,
			defaultSeriesType: 'line'
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

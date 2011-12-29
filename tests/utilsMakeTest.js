/**
 * @author Naren
 */
 TestCase("F.makeQueryString", {
 	setUp: function(){
 	},
   testMakeQueryString_Strings: function(){
   		var testSingle = "Apple=Mango";
    	var testMulti  = "Apple=Mango&game=life";
    	var testSpecialChars  = "Apple[fruit]=$Ma#ngo~&game=of'life";
    	var testEmpty  = "";
    	
    	assertSame("Apple=Mango", F.makeQueryString(testSingle) );
    	assertSame("Apple=Mango&game=life", F.makeQueryString(testMulti) );
    	assertSame(encodeURIComponent("Apple[fruit]") + "=" +
    					encodeURIComponent("$Ma#ngo~") + "&" +
    					encodeURIComponent("game") + "=" +
    					encodeURIComponent("of'life")
    					, F.makeQueryString(testSpecialChars) );
    	assertSame("", F.makeQueryString(testEmpty) );
    	
    	//Fail Cases
    	try{
    		F.makeQueryString("Apple");
    	}
    	catch(e){
    		assertSame(e.message, "Error parsing decision value: String should be in 'name=value' format")
    	}
   },
    testMakeQueryString_Strings_Prefix: function(){
   		var testSingle = "Apple=Mango";
    	var testMulti  = "Apple=Mango&D_game=life";
    	var testSpecialChars  = "D_Apple[fruit]=$Ma#ngo~&game=of'life";
    	var testEmpty  = "";
    	
    	var options = {prefix : "D_"};
    	assertSame("D_Apple=Mango", F.makeQueryString(testSingle, options) );
    	assertSame("D_Apple=Mango&D_game=life", F.makeQueryString(testMulti, options) );
    	assertSame(encodeURIComponent("D_Apple[fruit]") + "=" +
    					encodeURIComponent("$Ma#ngo~") + "&" +
    					encodeURIComponent("D_game") + "=" +
    					encodeURIComponent("of'life")
    					, F.makeQueryString(testSpecialChars, options) );
    	assertSame("", F.makeQueryString(testEmpty) );
   },
   testMakeQueryString_Objects: function(){
   		var testSingle = { Apple: "Mango"	};
    	var testMulti  = {Apple: "Mango", game: "life"};
    	var testMultiWithArray  = {Apple: "Mango", blank : "", game: ["life", "death"]};
    	
    	var testEmpty  = {};
    	
		assertSame("Apple=Mango", F.makeQueryString(testSingle) );
    	assertSame("Apple=Mango&game=life", F.makeQueryString(testMulti) );
    	assertSame("Apple=Mango&blank=&game=life&game=death", F.makeQueryString(testMultiWithArray) );
    	assertSame("", F.makeQueryString(testEmpty) );
   },
    testMakeQueryString_Elements: function(elemName, elemVal){
		/*:DOC testInputText = <input type='text' value='Mango' name='Apple' /> */
		/*:DOC testInputCheck = <input type='checkbox' value='Mango' name='Apple' /> */
		/*:DOC testInputRadio = <input type='radio' value='Mango' name='Apple' /> */
		/*:DOC testInputHidden = <input type='hidden' value='Mango' name='Apple' /> */
		/*:DOC testInputSelect = <select name='fruit'> <option value='Mango' selected> Mango </option> <option value='Apple'> Appple </option> </select> */
    	
   		/*:DOC testForm = <form name="myForm"> 
   		 * <input type='hidden' value='Mango' name='Apple' />
   		 * <select name='fruit'> 
   		 * 		<option value='Mango' selected> Mango </option>
   		 * 		<option value='Apple'> Appple </option> 
   		 * </select> 
   		 * </form>
   		 */
    	var testEmpty  = null;

    	assertSame("Apple=Mango", F.makeQueryString(this.testInputText) ); 
    	assertSame("Apple=Mango", F.makeQueryString(this.testInputCheck) );
    	assertSame("Apple=Mango", F.makeQueryString(this.testInputRadio) );
    	assertSame("Apple=Mango", F.makeQueryString(this.testInputHidden) );
    	assertSame("fruit=Mango", F.makeQueryString(this.testInputSelect) );
    	
    	assertSame("Apple=Mango&fruit=Mango", F.makeQueryString(this.testForm) );
    	
    	assertSame("", F.makeQueryString(testEmpty) );
    	
    	//Fail cases
    	/*:DOC test1 = <div id='Apple' /> */
    	/*:DOC test2 = <input type='checkbox' value='Mango' /> */
    	/*:DOC test2 = <input type='checkbox' name='Mango' /> */
    	
    	//assertException("Error parsing decision name: Element does not have 'name' property.", F.makeQueryString(this.test2));
    	
    	try{
    		F.makeQueryString(this.test3);
    	}
    	catch(e){
    		assertSame(e.message, "Error parsing decision name: Element does not have 'value' property.");
    	}
    },
     testMakeQueryString_Arrays: function(){
		var testSingle = ["Apple=Mango"];
    	var testMulti  = ["Apple=Mango", "game=life"];
    	var testMultiMixed  = ["Apple=Mango", {game:"life"}];
    	var testEmpty  = [];
    	
		assertSame("Apple=Mango",  F.makeQueryString(testSingle) );
    	assertSame("Apple=Mango&game=life", F.makeQueryString(testMulti) );
    	assertSame("Apple=Mango&game=life", F.makeQueryString(testMultiMixed) );
    	assertSame("", F.makeQueryString(testEmpty) );
    }
   
 });
 
  TestCase("Forio.Utils.makeObject", {
  	setUp: function(){
		var testSingleObj = {"Apple": "Mango"};
    	var testMultiObj = {"Apple": "Mango", "game": "life"};
    	var testSpecialCharsObj  = {"Apple[fruit]": "$Ma#ngo~", "game": "of'life" };
 	},
  	testMakeObject_Strings: function(){
   		var testSingle = "Apple=Mango";
    	var testMulti  = "Apple=Mango&game=life";
    	var testSpecialChars  = "Apple[fruit]=$Ma#ngo~&game=of'life";
    	var testEmpty  = "";
    	
    	YAHOO.util.ObjectAssert.propertiesAreEqual(this.testSingleObj, F.makeObject(testSingle));
    	YAHOO.util.ObjectAssert.propertiesAreEqual(this.testMultiObj, F.makeObject(testMulti));
    	YAHOO.util.ObjectAssert.propertiesAreEqual(this.testSpecialCharsObj, F.makeObject(testSpecialChars));
    	
    	YAHOO.util.ObjectAssert.propertiesAreEqual({}, F.makeObject(testEmpty));
   },
   
   testMakeObject_Elements: function(elemName, elemVal){
		/*:DOC testInputText = <input type='text' value='Mango' name='Apple' /> */
		/*:DOC testInputCheck = <input type='checkbox' value='Mango' name='Apple' /> */
		/*:DOC testInputRadio = <input type='radio' value='Mango' name='Apple' /> */
		/*:DOC testInputHidden = <input type='hidden' value='Mango' name='Apple' /> */
		/*:DOC testInputSelect = <select name='Apple'> <option value='Mango' selected> Mango </option> <option value='Apple'> Appple </option> </select> */

   		/*:DOC testForm = <form name="myForm"> 
   		 * <input type='hidden' value='Mango' name='Apple' />
   		 * <select name='Apple'> 
   		 * 		<option value='Mango' selected> Mango </option>
   		 * 		<option value='Apple'> Appple </option> 
   		 * </select> 
   		 * </form>
   		 */
   		var testEmpty  = null;

    	YAHOO.util.ObjectAssert.propertiesAreEqual(this.testSingleObj, F.makeObject(this.testInputText) );
    	YAHOO.util.ObjectAssert.propertiesAreEqual(this.testSingleObj, F.makeObject(this.testInputCheck) );
    	YAHOO.util.ObjectAssert.propertiesAreEqual(this.testSingleObj, F.makeObject(this.testInputRadio) );
    	YAHOO.util.ObjectAssert.propertiesAreEqual(this.testSingleObj, F.makeObject(this.testInputHidden) );
    	YAHOO.util.ObjectAssert.propertiesAreEqual(this.testSingleObj, F.makeObject(this.testInputSelect) );
    	YAHOO.util.ObjectAssert.propertiesAreEqual({}, F.makeObject(testEmpty));
    	
    	//Fail cases
    	/*:DOC test1 = <div id='Apple' /> */
    	/*:DOC test2 = <input type='checkbox' value='Mango' /> */
    	/*:DOC test2 = <input type='checkbox' name='Mango' /> */
    	
    	//assertException("Error parsing decision name: Element does not have 'name' property.", F.makeQueryString(this.test2));
    	
    },
   testMakeObject_Arrays: function(){
		var testSingle = ["Apple=Mango"];
    	var testMulti  = ["Apple=Mango", "game=life"];
    	var testMultiMixed  = ["Apple=Mango", {game:"life"}];
    	var testEmpty  = [];
    	
    	YAHOO.util.ObjectAssert.propertiesAreEqual(this.testSingleObj, F.makeObject(testSingle));
    	YAHOO.util.ObjectAssert.propertiesAreEqual(this.testMultiObj, F.makeObject(testMulti));
    	YAHOO.util.ObjectAssert.propertiesAreEqual(this.testMultiObj, F.makeObject(testMultiMixed));
    	YAHOO.util.ObjectAssert.propertiesAreEqual({}, F.makeObject(testEmpty));
    }
  });

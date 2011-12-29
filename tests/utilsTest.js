/**
 * @author Naren
 */

 TestCase("Forio.Utils", {
 	setUp: function(){
		 /*:DOC testDiv = <div id='testDiv'><p>foo</p></div>*/
		 /*:DOC testP = <p id='testP'><span>foo</span></p>*/
			
		 testStrings= ["", "test string", "Test !@#$% sTrInG123"];
    	 testNumbers = [123, 123.45, 0, -2, -2.34];
    	 testInvalids = [null, undefined];
    	 testArrays = [[], [2, "ee", {}]];
    	 testObjects = [{}, {a:"b"}];
    	 testElements = [this.testDiv, this.testP];
    	 
 	},
 	
    testIsString:function(){
    	for(var i=0; i< testStrings.length; i++){
    		assertTrue(F.isString(testStrings[i]));
    	}
    	assertTrue(F.isString(testStrings[0], testStrings[1]));
    	
    	var everythingElse = [].concat(testInvalids, testNumbers, testArrays, testObjects, testElements);
		for(var i=0; i< everythingElse.length; i++){
    		assertFalse(F.isString(everythingElse[i]));
    	}
		assertFalse(F.isString(new String("test"))); //Is an object
		assertFalse(F.isString(testStrings[0], testNumbers[1], testStrings[1]));
    },
    testIsNumber:function(){
    	for(var i=0; i< testNumbers.length; i++){
    		assertTrue(F.isNumber(testNumbers[i]));
    	}
    	assertTrue(F.isNumber(testNumbers[0], testNumbers[1]));
    	
    	var everythingElse = [].concat(testInvalids, testStrings, testArrays, testObjects, testElements);
		for(var i=0; i< everythingElse.length; i++){
    		assertFalse(F.isNumber(everythingElse[i]));
    	}
    	assertFalse(F.isNumber(testStrings[0], testNumbers[1], testNumbers[0]));
    },
    testIsArray: function(){
    	for(var i=0; i< testArrays.length; i++){
    		assertTrue(F.isArray(testArrays[i]));
    	}
    	assertTrue(F.isArray(testArrays[0], testArrays[1]));
    	
    	var everythingElse = [].concat(testInvalids, testStrings, testNumbers, testObjects, testElements);
		for(var i=0; i< everythingElse.length; i++){
    		assertFalse(F.isArray(everythingElse[i]));
    	}
    	assertFalse(F.isNumber(testStrings[0], testNumbers[1], testNumbers[0]));
    },
 	testIsObject: function(){
		for(var i=0; i< testObjects.length; i++){
    		assertTrue(F.isObject(testObjects[i]));
    	}
    	assertTrue(F.isObject(testObjects[0], testObjects[1]));
    	
    	var everythingElse = [].concat(testInvalids, testStrings, testNumbers, testArrays, testElements);
		for(var i=0; i< everythingElse.length; i++){
    		assertFalse(F.isObject(everythingElse[i]));
    	}
    	assertFalse(F.isNumber(testStrings[0], testObjects[1], testObjects[0]));
    	
    	assertFalse(F.isString(new Object("test"))); //Is not a plain object
    },
    testIsElement: function(){
    	assertTrue(F.isElement(testElements[1], "p"));
    	assertTrue(F.isElement(testElements[1]));
    	assertTrue(F.isElement(testElements[1], "P"));
    	
    	assertFalse(F.isElement(testElements[1], "div"));
    	var everythingElse = [].concat(testInvalids, testStrings, testNumbers, testArrays, testObjects);
		for(var i=0; i< everythingElse.length; i++){
    		assertFalse(F.isElement(everythingElse[i]));
    	}
    }
 });
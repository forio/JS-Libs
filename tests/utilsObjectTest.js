TestCase("Forio.utils.Object", {
	setUp: function(){
		F.O = F.Object;
			
		 plainObject = {name: "test", desc : "blahblah"};
		 objWithArrays = {name: "Test", stuff: ["a", "b", "c"], morestuff: [1,0]};
	},
	
	testToArray: function(){
		var obj1 =  ["name=test", "desc=blahblah"];
		var obj2 =  ["name=Test", "stuff=a", "stuff=b", "stuff=c", "morestuff=1", "morestuff=0"];
		
		YAHOO.util.ArrayAssert.itemsAreSame(obj1, F.O.toArray(plainObject));
		YAHOO.util.ArrayAssert.itemsAreSame(obj2, F.O.toArray(objWithArrays));
	}
});
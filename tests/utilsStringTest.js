TestCase("Forio.utils.String", {
	setUp: function(){
			F.S = F.String;
	},
	testEqualsIgnoreCase: function(){
		assertTrue(F.S.equalsIgnoreCase("TestString", "TestString"));
		assertTrue(F.S.equalsIgnoreCase("TESTSTRING", "teststring"));
		assertTrue(F.S.equalsIgnoreCase("Test !@#$% sTrInG123", "test !@#$% string123"));
		assertTrue(F.S.equalsIgnoreCase("", ""));
		assertTrue(F.S.equalsIgnoreCase("124", 124));
		
		assertFalse(F.S.equalsIgnoreCase("obviously", "notthesame"));
		
	},
	
	testClean: function(){
		
	},
	
	testIsValid: function(){
		
	},
	
	testIsValidEmail: function(){
		var validEmails = ["test@forio.com", "test123@forio.co.in", "test.1.2.3@ss.sb", "123@df.com", "my+id@gmail.com", "test_123+ab@gmail.com"];
		var invalidEmails = ["@jorn.com", "www.forio.com", "abcd", "rt@forio", "#$!@forio,com"];
		
		for(var i=0; i < validEmails.length; i++){
			assertTrue(F.S.isValidEmail(validEmails[i]));
		}
		
		for(var i=0; i < invalidEmails.length; i++){
			assertFalse(F.S.isValidEmail(invalidEmails[i]));
		}
	}
});
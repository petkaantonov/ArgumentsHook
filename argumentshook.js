/*!
 * JavaScript ArgumentsHook library v. 0.1
 * http://github.com/petkaantonov/ArgumentsHook
 *
 * MIT License. by Petka Antonov
 */

( function( global ){

var legitToString = /^\[object\s[a-zA-Z\$_-][a-zA-Z0-9\$_-]*?\]$/,
	arrayProtoMethods = "concat join pop push reverse shift slice sort splice unshift".split(" "),
	i,
	l = arrayProtoMethods.length, 
	prMethod;
	
	
	//Overload function with a key value pair object where
	//key is the argument signature and value is a function that will be called when arguments match that
	//signature

	function overload( methods ){
		if( this.isHooked ) {
		return this;
		}
	var self = this, cache = {};

		function overloaded(){
		var expected, typeList, args;
		this.arguments = new Arguments( arguments );

		args = this.arguments;
		typeList = args.typeList.join("");

			if( typeList in cache ) {
			return cache[ typeList ].apply( this, args.argumentList );
			}


			for( expected in methods ) {
				if( this.arguments.match( expected ) ) {
				cache[ typeList ] = methods[expected];
				return methods[expected].apply( this, args.argumentList );
				}
			}

		return self.apply( this, args.argumentList );
		}
	overloaded.isHooked = true;
	return overloaded;
	};

	//Hook arguments to a single function. Whenever that function is called, inside the function "this.arguments" will be available
	function argumentsHook(){
		if( this.isHooked ) {
		return this;
		}

	var self = this;

		function argumentsHooked(){
		this.arguments = new Arguments( arguments );
		return self.apply( this, this.arguments.argumentList );
		};

	argumentsHooked.isHooked = true;
	return argumentsHooked;
	};

	//Hook arguments to all methods in a constructor prototype.
	function hookMethods(){
	var obj = this.prototype, key, fn;

		for( key in obj ) {
		fn = obj[key]
			if( typeof fn == "function" && obj.hasOwnProperty(key) ) {
			obj[key] = fn.argumentsHook();
			}
		}
	return this;
	};

	function typeOf( obj ) {
	var spacePos, objStr;
	
		switch( typeof obj ) {
	
		case "string":
		return "string";
	
		case "number":
		return "number";
	
		case "boolean":
		return "boolean";
	
		case "function":
		return "function";
	
		case "undefined":
		return "undefined";
	
		case "object": 
		objStr = obj && obj.toString && obj.toString() || ""; //Check if the objects own toString method returns "legit" value first. Returns "" for string objects
		
			if( !legitToString.test( objStr ) ) {
			objStr = Object.prototype.toString.call( obj ); //Returns [object String] for string objects
			}
			
		// turn "[object Example]" into "example"
		spacePos = objStr.lastIndexOf( " " ); 
		return objStr.substr( spacePos + 1, objStr.lastIndexOf( "]" ) - spacePos - 1 ).toLowerCase();
		break;	
		}
	
	}
		
	function getContinuity( str ) {
	var type = str.replace( "...", "" );
	
		return {
			isContinuous: type != str,
			type: type
		};
	}
	
	function Arguments( args ){
	var i, l, argsObject, argsArray, typesArray = [];

	argsArray = Array.prototype.slice.call( args || [] );

		l = argsArray.length;
		
		for( i = 0; i < l; ++i ) {
		typesArray[i] = typeOf( argsArray[ i ] );
		this[i] = argsArray[ i ];
		}

	this.length = l;
	this.typeList = typesArray;
	this.argumentList = argsArray;
	this.original = args;
	this.thisFunction = args && args.callee;
	this.invalidArg = "";
	this.expectedN = -1;
	this.expected = "";
	};

	Arguments.prototype = {
	
		toString: function(){
		return "[object Arguments]";
		},

		constructor: Arguments,
				
		match: function( signature ){
		var validatorArgs = signature.toLowerCase().split(","),
			i, l = validatorArgs.length, validArg, typeList = this.typeList;

			if( !l ) {
			return true;
			}

			for( i = 0; i < l - 1; ++i ) {
			validArg = validatorArgs[i];

				if( !( i in typeList ) || typeList[i] != validArg ) {
				this.expectedN = i;
				this.expected = validArg;
				this.invalidArg = typeList[i] || "undefined";
				return false;
				}
			}

		validArg = getContinuity( validatorArgs[i] );
			if( validArg.type && !validArg.isContinuous ) {
				if( !( ( i in typeList ) && validArg.type == typeList[i] ) ) {
				this.expectedN = i;
				this.expected = validArg.type;
				this.invalidArg = typeList[i] || "undefined";
				return false;
				}
			
			}
			else if( validArg.type === false && validArg.isContinuous ) {
			return true;
			}
			else if( validArg.type && validArg.isContinuous ) {
			l = typeList.length;

				for( ; i < l; ++i ) {	
					if( typeList[i] != validArg.type ) {
					this.expectedN = i;
					this.expected = validArg.type;
					this.invalidArg = typeList[i];
					return false;
					}			
				}
			}
		return true;
		},

		getArgType: function( idx ) {
		return this.typeList[idx] || "Undefined";
		},

		getArgTypes: function(){
		return this.typeList;
		},
		
		toArray: function(){
		return this.argumentList;
		},
		
		ensure: function( signature, msg ) {
		
			if( this.match( signature ) ) {
			return true;
			}
			
		this.throwError( msg );
		},
		
		throwError: function( msg ){
		var message = typeof msg != "string" ? "" : msg;
		throw new TypeError(  "Expected "+this.expected+" as "+(this.expectedN+1)+". argument, got "+this.invalidArg +" instead.\n"+ message );
		}
	};
		
	for( i = 0; i < l; ++i ) {
	prMethod = arrayProtoMethods[i];
	Arguments.prototype[prMethod] = Array.prototype[prMethod];
	}
		
global.Function.prototype.argumentsHook = argumentsHook;
global.Function.prototype.overload = overload;
global.Function.prototype.hookMethods = hookMethods;

})( window );
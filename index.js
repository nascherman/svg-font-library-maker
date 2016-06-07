#!/usr/bin/env node
const fs = require('fs');
const TextToSVG = require('text-to-svg');

const attributes = {fill: 'black', stroke: 'black'};
const options = {x: 0, y: 0, fontSize: 32, anchor: 'top', attributes: attributes};

var assetsPath = './'; 
var type = '.ttf'
var fontFace;

var alphaLibrary = [
	'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v',
	'w','x','y','z'
];
var charLibrary = [
	'!','@','#','$','%','^','&','*','(',')',':',';',
	'{','}','|','?','>','<','+','_','-','/','\'','~','`',
	'1','2','3','4','5','6','7','8','9','0','[',']','\"',
	',','.','=','\\'
];

const directorySearch = require('directory-search');
MockBrowser = require('mock-browser').mocks.MockBrowser;

if(!process.argv[2]) {
	console.log('must provide an asset path');
}


if(process.argv[3]) {
	type = process.argv[3];
}

if(process.argv[4]) {
	alphaLibrary = process.argv[4].split('');
}
if(process.argv[5]) {
	alphaLibrary = process.argv[4].split('');
}



directorySearch(process.argv[2], type, function(err, results) {
	results.forEach( (result) => {
		var dirName = assetsPath + result.split('//')[0] + '/' + result.split('//')[1].split('.')[0];
		try {
			fs.mkdirSync(dirName );
		} catch (err) {
			console.warn(err);
		}
		TextToSVG.load(assetsPath + result, function(err, library) {
			if(err) console.warn(err);
			else {
				alphaLibrary.forEach(function(char) {
					const svg = library.getSVG(char, options);
					fs.writeFile(dirName + '/' + char.charCodeAt(0) +'.svg', svg, function(err) {
						if(err) console.log(err);
						else {
							console.log('Creating font lib for ' + char );
						}
					});
				});
				alphaLibrary.forEach(function(char) {
					const svg = library.getSVG(char.toUpperCase(), options);
					fs.writeFile(dirName + '/' + char.toUpperCase().charCodeAt(0) +'.svg', svg, function(err) {
						if(err) console.log(err);
						else {
							console.log('Creating font lib for ' + char.toUpperCase() );
						}
					});
				});
				charLibrary.forEach(function(char) {
					const svg = library.getSVG(char, options);
					fs.writeFile(dirName + '/' + char.charCodeAt(0) +'.svg', svg, function(err) {
						if(err) console.log(err);
						else {
							console.log('Creating font lib for ' + char );
						}
					});
				});
			}
		});	
	});
});
  

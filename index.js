#!/usr/bin/env node
const fs = require('fs');
const TextToSVG = require('text-to-svg');

const attributes = {fill: 'red', stroke: 'black'};
const options = {x: 0, y: 0, fontSize: 72, anchor: 'top', attributes: attributes};

var assetsPath = './assets/'; 
var fontFace;

var fontLibrary = [
	'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v',
	'w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P',
	'Q','R','S','T','U','V','W','X','Y','Z','!','@','#','$','%','^','&','*','(',')','?'
];
fontLibrary.forEach(function(item) {
	fontLibrary.push(item.toUpperCase() );
})

const directorySearch = require('directory-search');
MockBrowser = require('mock-browser').mocks.MockBrowser;

if(!process.argv[2]) {
	console.log('must provide a font');
}
else {
	fontFace = process.argv[2];
}

if(process.argv[3]) {
	assetsPath = process.argv[3];
}

if(process.argv[4]) {
	fontLibrary = process.argv[4].split('');
}
var dirName = assetsPath + fontFace.split('.')[0];
try {
	fs.mkdirSync(dirName );
} catch (err) {
	console.warn(err);
}

TextToSVG.load(assetsPath + fontFace, function(err, library) {
	fontLibrary.forEach(function(char) {
		const svg = library.getSVG(char, options);
		fs.writeFile(dirName + '/' + char +'.svg', svg, function(err) {
			if(err) console.log(err);
			else {
				console.log('Creating font lib for ' + char );
			}
		});
	});
});
  

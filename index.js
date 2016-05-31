#!/usr/bin/env node
const fs = require('fs');
const TextToSVG = require('text-to-svg');

const attributes = {fill: 'red', stroke: 'black'};
const options = {x: 0, y: 0, fontSize: 72, anchor: 'top', attributes: attributes};

var assetsPath = './assets/'; 
var fontFace;

var alphaLibrary = [
	'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v',
	'w','x','y','z'
];


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
	alphaLibrary = process.argv[4].split('');
}
var dirName = assetsPath + fontFace.split('.')[0];
try {
	fs.mkdirSync(dirName );
} catch (err) {
	console.warn(err);
}

TextToSVG.load(assetsPath + fontFace, function(err, library) {
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

});
  

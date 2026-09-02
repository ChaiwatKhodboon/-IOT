const test = require('node:test');
const assert = require('node:assert/strict');
const { positiveInteger, cleanText, equipmentInput } = require('../src/utils/validation');
test('positiveInteger accepts positive whole numbers',()=>{assert.equal(positiveInteger(1),true);assert.equal(positiveInteger('2'),true);assert.equal(positiveInteger(0),false);assert.equal(positiveInteger(1.5),false)});
test('cleanText trims and limits input',()=>{assert.equal(cleanText('  ESP32  '),'ESP32');assert.equal(cleanText('abcdef',3),'abc');assert.equal(cleanText(null),'')});
test('equipmentInput normalizes valid equipment',()=>{const result=equipmentInput({code:' iot-01 ',name:'ESP32',category:'Board',totalQuantity:'5'});assert.equal(result.data.code,'IOT-01');assert.equal(result.data.totalQuantity,5);assert.equal(result.data.status,'available')});
test('equipmentInput rejects incomplete equipment',()=>{assert.ok(equipmentInput({code:'',name:'',category:'',totalQuantity:0}).error)});
test('equipmentInput accepts a supported equipment image',()=>{const result=equipmentInput({code:'iot-02',name:'Sensor',category:'Sensor',totalQuantity:1,imageUrl:'data:image/png;base64,aGVsbG8='});assert.equal(result.data.imageUrl,'data:image/png;base64,aGVsbG8=')});
test('equipmentInput rejects an unsupported equipment image',()=>{const result=equipmentInput({code:'iot-03',name:'Sensor',category:'Sensor',totalQuantity:1,imageUrl:'data:text/html;base64,PHNjcmlwdD4='});assert.ok(result.error)});

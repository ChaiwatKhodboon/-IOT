const test=require('node:test');
const assert=require('node:assert/strict');
const {parseReturn}=require('../src/utils/returns');
test('partial mixed returns preserve the outstanding quantity',()=>{
  assert.deepEqual(parseReturn({quantities:{normal:2,damaged:1}},5),{parts:[{condition:'normal',quantity:2},{condition:'damaged',quantity:1}],total:3,remaining:2});
});
test('rejects empty, negative, fractional, invalid and excessive returns',()=>{
  for(const quantities of [{},{normal:-1},{normal:1.5},{normal:6},{normal:NaN},{normal:true},{normal:1,other:1},[],{normal:''}])assert.throws(()=>parseReturn({quantities},5));
});
test('supports full mixed returns and old single-condition requests',()=>{
  assert.equal(parseReturn({quantities:{normal:4,lost:1}},5).remaining,0);
  assert.deepEqual(parseReturn({condition:'normal'},2),{parts:[{condition:'normal',quantity:2}],total:2,remaining:0});
});

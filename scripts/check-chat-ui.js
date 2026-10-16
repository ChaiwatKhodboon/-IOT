// Optional visual check: requires Playwright and a reachable development database.
// Uses only temporary tables and rolls back all test data.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const express=require('express');
const jwt=require('jsonwebtoken');
const {chromium}=require('playwright');
const pool=require('../src/db');
const {jwtSecret}=require('../src/config');
const {createChatRouter}=require('../src/routes/chat');
const realtime=require('../src/realtime');

(async()=>{
  const client=await pool.connect();let server,browser;
  try{
    await client.query('BEGIN');
    await client.query(`CREATE TEMP TABLE users(id BIGINT PRIMARY KEY,username TEXT,full_name TEXT,role TEXT,active BOOLEAN);
      INSERT INTO users VALUES(1,'member','สมชาย ใจดี','user',TRUE),(2,'staff','ผู้ดูแลระบบ','admin',TRUE)`);
    await client.query(fs.readFileSync(path.join(__dirname,'../database/migrations/013_admin_chat.sql'),'utf8').replaceAll('CREATE TABLE IF NOT EXISTS','CREATE TEMP TABLE IF NOT EXISTS'));
    const app=express();app.use(express.json());
    app.use('/api/chat',createChatRouter({pool:{query:(...args)=>client.query(...args)},broadcast:realtime.broadcast}));
    app.get('/api/events',realtime.events);
    app.get('/api/auth/google/config',(req,res)=>res.json({enabled:false}));
    app.get('/api/dashboard',(req,res)=>res.json({total:0,available:0,borrowedQuantity:0,maintenance:0,lost:0,retired:0}));
    app.get('/api/loans',(req,res)=>res.json([]));
    app.get('/api/equipment',(req,res)=>res.json([]));
    app.use(express.static(path.join(__dirname,'../public')));
    server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
    browser=await chromium.launch({headless:true,...(process.env.CHAT_BROWSER_PATH?{executablePath:process.env.CHAT_BROWSER_PATH}:{})});
    const errors=[];
    async function pageFor(id,role){
      const page=await browser.newPage({viewport:{width:1280,height:900}});
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      await page.waitForFunction(()=>window.ChatWidget&&typeof login==='function');
      await page.evaluate(data=>login(data),{token:jwt.sign({id,role},jwtSecret,{expiresIn:'1h'}),user:{id,role,username:role,fullName:id===1?'สมชาย ใจดี':'ผู้ดูแลระบบ'}});
      await page.locator('#chatLauncher').waitFor({state:'visible'});
      return page;
    }
    const member=await pageFor(1,'user');
    await member.locator('#chatLauncher').click();
    await member.waitForFunction(()=>!document.querySelector('#chatInput').disabled);
    await member.locator('#chatInput').fill('สวัสดีครับ อยากสอบถามการยืม ESP32');await member.locator('#chatSend').click();
    await member.locator('#chatMessages').getByText('สวัสดีครับ อยากสอบถามการยืม ESP32',{exact:true}).waitFor();
    const admin=await pageFor(2,'admin');
    await admin.locator('#chatBadge').waitFor({state:'visible'});
    await admin.locator('#chatLauncher').click();await admin.locator('.chat-room').click();
    await admin.locator('#chatMessages').getByText('สวัสดีครับ อยากสอบถามการยืม ESP32',{exact:true}).waitFor();
    await admin.locator('#chatInput').fill('ได้ครับ แจ้งจำนวนและวันที่ต้องการยืมได้เลย');await admin.locator('#chatSend').click();
    await admin.locator('#chatMessages').getByText('ได้ครับ แจ้งจำนวนและวันที่ต้องการยืมได้เลย',{exact:true}).waitFor();
    await member.locator('#chatMessages').getByText('ได้ครับ แจ้งจำนวนและวันที่ต้องการยืมได้เลย',{exact:true}).waitFor();
    const output=process.env.CHAT_SCREENSHOT_DIR;
    if(output){fs.mkdirSync(output,{recursive:true});await member.screenshot({path:path.join(output,'chat-member-desktop.png')});await admin.screenshot({path:path.join(output,'chat-admin-desktop.png')})}
    for(const [label,page] of [['member',member],['admin',admin]]){
      for(const [width,height] of [[1920,1080],[1366,768],[1024,600],[900,500],[899,500],[768,1024],[720,480],[600,400],[390,844],[360,640],[320,568],[280,480],[844,390],[568,320],[320,320],[390,300]]){
        await page.setViewportSize({width,height});
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        const box=await page.locator('#chatPanel').boundingBox();
        assert.ok(box.x>=-1&&box.x+box.width<=width+1&&box.y>=-1&&box.y+box.height<=height+1,`${label} panel fits ${width}x${height}: ${JSON.stringify(box)}`);
        for(const selector of ['#chatClose','#chatInput','#chatSend']){
          const element=await page.locator(selector).boundingBox();
          if(output&&element&&(element.y+element.height>box.y+box.height+1))await page.screenshot({path:path.join(output,'chat-overflow-debug.png')});
          assert.ok(element&&element.x>=box.x&&element.x+element.width<=box.x+box.width+1&&element.y>=box.y&&element.y+element.height<=box.y+box.height+1,`${label} ${selector} stays inside panel at ${width}x${height}: ${JSON.stringify({box,element})}`);
        }
        assert.equal(await page.evaluate(()=>document.querySelector('#chatPanel').scrollWidth<=document.querySelector('#chatPanel').clientWidth),true,'no horizontal chat overflow');
        const nav=await page.locator('#bottomNav').boundingBox();
        if(nav.width>nav.height)assert.ok(box.y+box.height<=nav.y+1,'chat clears bottom navigation');
        if(width===1366&&height===768)assert.ok(height-box.y-box.height<100,'desktop chat is positioned lower');
        if(output&&((width===390&&height===844)||(width===844&&height===390)))await page.screenshot({path:path.join(output,`chat-${label}-${width===390?'mobile':'landscape'}.png`)});
      }
      await page.setViewportSize({width:390,height:844});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      // Simulate the visible viewport shrinking when a mobile keyboard opens.
      await page.evaluate(()=>{Object.defineProperty(window.visualViewport,'height',{configurable:true,value:320});window.visualViewport.dispatchEvent(new Event('resize'))});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const keyboardPanel=await page.locator('#chatPanel').boundingBox(),keyboardInput=await page.locator('#chatInput').boundingBox();
      assert.ok(keyboardPanel.y>=0&&keyboardPanel.y+keyboardPanel.height<=320&&keyboardInput.y+keyboardInput.height<=320,'panel and input fit above simulated keyboard');
      await page.evaluate(()=>{delete window.visualViewport.height;window.visualViewport.dispatchEvent(new Event('resize'))});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    }
    await member.locator('#chatInput').fill('<img src=x onerror=alert(1)>');await member.locator('#chatSend').click();
    await member.locator('#chatMessages').getByText('<img src=x onerror=alert(1)>',{exact:true}).waitFor();
    assert.equal(await member.locator('#chatMessages img').count(),0,'message HTML is escaped');
    await member.evaluate(()=>I18n.setLanguage('en'));
    assert.equal(await member.locator('#chatLauncherLabel').textContent(),'Contact admin');
    await member.locator('#chatClose').click();assert.equal(await member.locator('#chatPanel').isVisible(),false);
    await member.locator('#chatLauncher').click();
    await member.locator('#chatMessages').getByText('สวัสดีครับ อยากสอบถามการยืม ESP32',{exact:true}).waitFor();
    await member.evaluate(()=>logout());assert.equal(await member.locator('#chatWidget').isVisible(),false);
    assert.deepEqual(errors,[]);
    console.log('Chat UI passed: send/reply, SSE updates, escaped content, desktop/mobile, language and logout.');
  }finally{
    if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));
    await client.query('ROLLBACK');client.release();await pool.end();
  }
})().catch(error=>{console.error(error);process.exitCode=1});

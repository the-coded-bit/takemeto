const puppeteer = require('puppeteer');
let page;
console.log('before');

const browserPromise = puppeteer.launch({headless : false, slowMo : 100, defaultViewport : null, args : ['--start-maximized']});


browserPromise
            .then((browser) =>{
                    return browser.pages();
                })
            .then((tabsList) =>{
                page = tabsList[0]
                return tabsList[0].goto('https://www.google.com/');
            })
            .then((res) => {
                console.log('Reached', res.status());
                return page.waitForSelector('input[type="text"]', {visible : true});
            })
            .then(() => {
                return page.type('input[type="text"]','pepcoding', {delay : 100});
            })
            .then(() =>{
                return page.keyboard.press('Enter');
            })
            .then(() =>{
                return page.waitForSelector('h3.LC20lb.MBeuO.DKV0Md', {visible : true});
            })
            .then(() =>{
                page.click('h3.LC20lb.MBeuO.DKV0Md');
            })
console.log('after');
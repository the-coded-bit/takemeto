#!/usr/bin/env node

const puppeteer = require('puppeteer');
const xlsx = require('xlsx');
const process = require('process');

let tripHomePage, tripHotelPage, tripRestaurantsPage, browserL, defaultBrowserContext, links, placesArr, hotelsArr, restaurantsArr;
let placetovisitarr = process.argv;
let placetovisit = placetovisitarr[2];
placetovisit = placetovisit.charAt(0).toUpperCase() + placetovisit.slice(1);

const browserPromise = puppeteer.launch({defaultViewport : null, args : ['--start-maximized', '--disable-search-geolocation-disclosure'], headless : false});

browserPromise
             .then((browser) =>{
                 browserL = browser;
                 defaultBrowserContext = browser.defaultBrowserContext();
                 return  defaultBrowserContext.overridePermissions('https://www.tripadvisor.in/', ['geolocation']);
             })
             .then(() =>{
                return browserL.pages();
             })
             .then((tabsList) =>{
                 return tabsList[0];
             })
             .then((page) =>{
                 tripHomePage = page;
                 return page.goto('https://www.tripadvisor.in/', {waitUntil : 'domcontentloaded', timeout : 0});
             })
             .then((res) =>{
                 console.log(res.status());
                 return tripHomePage.waitForFunction('document.readyState === "complete"');
             })
             .then(() =>{
                return tripHomePage.waitForSelector('input[type="search" ][placeholder="Where to?"]', {visible : true});
            })
             .then(() =>{
                 return tripHomePage.setGeolocation({ latitude: 59.95, longitude: 30.31667 });
             })
             .then(() =>{
                 return tripHomePage.click('input[type="search" ][placeholder="Where to?"]', {delay : 150})
             })
             .then(() => {
                 return tripHomePage.type('input[type="search" ][placeholder="Where to?"]', placetovisit);
             })
             .then(() =>{
                 return tripHomePage.waitForFunction('document.readyState === "complete"');
             })
             .then(() =>{
                 return tripHomePage.waitForSelector('#typeahead_results a', {visible : true});
             })
             .then(() =>{
                return tripHomePage.waitForTimeout(1000);
             })
             .then(() => {
                return tripHomePage.click('#typeahead_results a', {delay : 100});
             })
             .then(() => {
                 return tripHomePage.waitForFunction('document.readyState === "complete"');
             })
             .then(() =>{
                 return tripHomePage.waitForSelector('.dVaSh a', {visible : true});
             })
             .then(() => {
                 return tripHomePage.waitForTimeout(1000);
             })
             .then(() =>{
                 let link = tripHomePage.evaluate(getUrls, '.dVaSh a');
                 return link;
             })
             .then((linksArr) =>{
                 links = linksArr;
                 for(let i = 0; i < links.length; i++){
                     links[i] = 'https://www.tripadvisor.in' + links[i];
                 }
             })
             .then(() =>{
                 return tripHomePage.goto(links[0], {waitUntil : 'load', timeout : 0});
             })
             .then(() =>{
                return tripHomePage.waitForFunction('document.readyState === "complete"');
            })
            .then(() =>{
                tripHomePage.waitForSelector('.bMktZ .eXwvx .bUshh.o.csemS', {visible : true});
            })
            .then(() => {
                tripHomePage.waitForTimeout(1000);
            })
            .then(() =>{
                return tripHomePage.evaluate(scrap, '.bMktZ .eXwvx .bUshh.o.csemS');
            })
            .then((places) =>{
                placesArr = places;
                placesArr = processing(placesArr);
            })
            .then(() =>{
                return browserL.newPage();
            })
            .then((page) => {
                tripHotelPage = page;
                return page.goto(links[1], {waitUntil : 'load', timeout : 0}); 
            })
            .then(() =>{
                return tripHotelPage.waitForFunction('document.readyState === "complete"');
            })
            .then(() => {
                return tripHotelPage.waitForSelector('.listing_title .property_title.prominent', {visible : true});
            })
            .then(() => {
                return tripHotelPage.evaluate(scrap, '.listing_title .property_title.prominent');
            })
            .then((hotels) =>{
                hotelsArr = hotels;
            })
            .then(() => {
                return tripHotelPage.close();
            })
            .then(() => {
                return browserL.newPage();
            })
            .then((page) => {
                tripRestaurantsPage = page;
                page.goto(links[2], {waitUntil : 'load', timeout : 0});
            })
            .then(() =>{
                return tripRestaurantsPage.waitForFunction('document.readyState === "complete"');
            })
            .then(() => {
                return tripRestaurantsPage.waitForSelector('.OhCyu', {visible : true});
            })
            .then(() => {
                return tripRestaurantsPage.evaluate(scrap, '.OhCyu');
            })
            .then((restaurants) =>{
                restaurantsArr = restaurants;
                restaurantsArr = processing(restaurantsArr);
            })
            .then(() => {
                return tripRestaurantsPage.close();
            })
            .then(() => {
                return browserL.close();
            })
            .then(() =>{
                console.log(links);
                console.log(placesArr);
                console.log(restaurantsArr);
                console.log(hotelsArr);
            }) 
            .then(() => {
                let obj = convertToArrayOfJson(placesArr,hotelsArr, restaurantsArr);

                let newWB = xlsx.utils.book_new();
                let newWS = xlsx.utils.json_to_sheet(obj);
                xlsx.utils.book_append_sheet(newWB, newWS, 'trip');
                xlsx.writeFile(newWB, 'trip.xlsx');
            })
             .catch((err) =>{console.log(err);})


function getUrls(selector){
    const url = document.querySelectorAll(selector);
    let links = [];
    for(let i = 0; i < url.length; i++){
        links.push(url[i].getAttribute('href'));
    }
    return links;
}


function scrap(selector){
    const selectors = document.querySelectorAll(selector);
    let items = [];
    for(let i = 0; i < selectors.length; i++){
        items.push(selectors[i].innerText);
    }
    return items;
}

function processing(data){
    for(let i = 0; i < data.length; i++){
        data[i] = data[i].substring(data[i].indexOf(" ") + 1);
    }
    return data;
}

function convertToArrayOfJson(placesArr, hotelsArr, restaurantsArr){
    let obj = [];
    for(let i = 1; i <= 30; i++){
        obj.push({
            id : i,
            places : placesArr[i - 1],
            hotels : hotelsArr[i - 1],
            restaurants : restaurantsArr[i - 1]
        });
    }
    return obj;
}
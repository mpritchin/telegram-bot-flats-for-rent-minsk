const axios = require('axios');
const lodash = require('lodash');

const onlinerFlatsUrls = require('./onlinerFlatsUrls');

function getFeatures(url) {
    return axios.get(url)
        .then(response => response.data)
        .then(points => points && points.apartments ? points.apartments : []);
}

function getFlatsFromOnliner() {
    return Promise.all(onlinerFlatsUrls.map(url => getFeatures(url)))
        .then(flatsArr => {
            const flats = [];
            flatsArr.forEach(arr => arr.forEach(f => flats.push(f)));
            return lodash.uniqBy(flats, 'id');
        })
        .catch(err => {
           console.error(err);
           return [];
        });
}

module.exports = getFlatsFromOnliner;

const request = require('request');
const jsdom = require("jsdom");
const fs = require('fs');
const { JSDOM } = jsdom;

const url = 'https://nztop40.co.nz/chart/singles';
const imgPrefixURL = 'https://nztop40.co.nz';

const printSuccessMessage = (date) => {
    console.log(`File ${date}.json successfully written`);
}

const download = async (url, path, callback) => {
    request.head(url, (err, res, body) => {
        if (err) { console.log(err) }
        request(url)
            .pipe(fs.createWriteStream(path))
            .on('close', callback)
    })
}

(async () => {
    const top40 = [];
    const dom = await JSDOM.fromURL(url, {});

    // Replace is called twice to change the 2 dots
    const date = dom.window.document.getElementById('main').getAttribute('data-chart-date').replace('.', '-').replace('.', '-');
    const tracks = [...dom.window.document.querySelectorAll('.record_case')];
    tracks.forEach((track, index) => {
        const recordNumber = track.querySelector('.record_number > p > span').textContent
        const title = track.querySelector('.title > span').textContent
        const artist = track.querySelector('.artist > span').textContent
        const imageURL = track.querySelector('.record_cover > img').getAttribute('src').slice(2);
        const imageName = imageURL.split('/').pop();
        const cover = `./data/images/${imageName}`;
        download(imgPrefixURL + imageURL, cover, () => {
            console.log(`${index + 1}. ${title} cover retrieved`)
        });

        top40.push({
            recordNumber,
            title,
            artist,
            cover
        })
    });

    fs.writeFileSync(`data/${date}.json`, JSON.stringify(top40));
    fs.writeFileSync(`data/latest.js`, 'export const songs = ' + JSON.stringify(top40) + ';');

    printSuccessMessage(date);
})();
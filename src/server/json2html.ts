import * as fs from 'fs';
import * as _ from 'lodash';

const css = fs.readFileSync('./assets/json2html.css');

function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

function produceBody(title, data) {
    var ret = '';

    ret += `<h1>${escapeXml(title)}</h1>`;

    if (data.collections) {
        ret += '<h2>Collections</h2>';
        ret += _.map(data.collections, c => {
            var tmp = `<h3>${c.name}</h3>`;
            tmp += `<p>${c.description}</p>`;
            tmp += `<h4>Links for the collection</h4>`;
            tmp += _.map(c.links, l => {
                return `<p>${l.rel} = <a href="${l.href}">${l.title || '(no title)'}</a> (${l.type})</p>`;
            }).join('');
            return tmp;
        } ).join('');
    }

    if (data.conformsTo) {
        ret += '<h2>Conforms to</h2>';
        ret += _.map(data.conformsTo, c => {
            return `<p>${c}</p>`;
        } ).join('');
    }

    if (data.links) {
        ret += '<h2>Links</h2>';
        ret += _.map(data.links, l => {
            return `<p>${l.rel} = <a href="${l.href}">${l.title}</a> (${l.type})</p>`;
        } ).join('');
    }

    ret += '<h2>Raw JSON output</h2>';
    ret += `<textarea cols="80" rows="15">${escapeXml(JSON.stringify(data, null, 2))}</textarea>`;

    return ret;
}

export function json2html(data) {
    var html = '<!DOCTYPE html><html>';

    var title = '??';
    var self = _.find(data.links, { rel : 'self'});
    if (self && self['title']) {
        title = self['title'];
    }

    html += '<head>';
    html += `<title>${escapeXml(title)}</title>`;
    html += '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Open+Sans:300,300italic,400,400italic,600,600italic%7CNoto+Serif:400,400italic,700,700italic%7CDroid+Sans+Mono:400,700">';
    html += `<style>${css}</style>`;
    html += '</head>';

    html += '<body>';
    html += '<div id="content">';

    html += produceBody(title, data);

    html += '</div>';
    html += '</body>';

    html += '</html>';

    return html;
}


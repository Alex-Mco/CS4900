const md5 = require('md5');

const ts = 1;
const publicKey = '7ac2b5ed470ff39808558a52bf7212fc';
const privateKey = 'db27f7df4780f8135b45eddd427aa9f549096dc0';
const hash = md5(ts + privateKey + publicKey);

const url = `https://gateway.marvel.com/v1/public/comics?ts=1&apikey=${publicKey}&hash=${hash}&title=spider-man&limit=1`;

console.log("Test URL:", url);

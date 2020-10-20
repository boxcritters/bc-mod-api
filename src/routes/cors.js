"use strict"
const express = require("express");
const cors = require("cors");
const request = require("request");
const absolutify = require("absolutify");
const imageDataURI = require("image-data-uri");

let router = express.Router();

function getHostName(url) {
	let nohttp = url.replace("http://", "").replace("https://", "");
	let http = url.replace(nohttp, "");
	let hostname = http + nohttp.split(/[/?#]/)[0];
	return hostname;
}

router.use("/", (req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	next();
});

/**
 * Paths
 */

/* /cors/data/(url) */
router.use("/data", async (req, res) => {
	let url = req.path.substr(1);
	console.log("URL:", url);
	if (!url) {
		res.set("Content-Type", "application/json");
		res.type("application/json");
		res.status(400).send(`{"err": "No URL provided."`);
		return;
	}
	try {
		imageDataURI.encodeFromURL(url).then(data => {
			res.json({ url: data });
		});
	} catch (err) {
		console.log(err);
		res.set("Content-Type", "application/json");
		res.type("application/json");
		res.status(503).send(`{"err": "${err}"`);
		return;
	}
});

/* /cors/file/(url) */
router.use("/file", async (req, res) => {
	let url = req.path.substr(1);
	console.log("URL:", url);
	if (!url) {
		res.set("Content-Type", "application/json");
		res.type("application/json");
		res.status(400).send(`{"err": "No URL provided."`);
		return;
	}
	request(url).pipe(res)
});

// /cors/(url)
router.use("/", async (req, res) => {
	let url = req.path.substr(1);
	console.log("URL:", url);
	if (!url) {
		res.set("Content-Type", "application/json");
		res.type("application/json");
		res.status(400).send(`{"err": "No URL provided."`);
		return;
	}
	try {
		let document = "";
		let i = 0;

		let settings = {
			url: url,
			encoding: null
		};

		request(settings, function (sub_err, sub_res, sub_body) {
			let i = 0;
			let document = sub_body;
			while (i < sub_res.rawHeaders.length)
			{
				res.set(sub_res.rawHeaders[i], sub_res.rawHeaders[i + 1]);
				i += 2;
			}
			if (sub_res.caseless.dict["content-type"] == "text/html")
			{
				document = absolutify(sub_body, `/cors/${getHostName(url)}`);
			}
			res.send(document);
		});
	} catch (err) {
		console.log(err);
		res.set("Content-Type", "application/json");
		res.type("application/json");
		res.status(503).send(`{"err": "${err}"`);
		return;
	}
});

module.exports = router;

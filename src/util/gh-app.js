"use strict";
const { Octokit } = require("@octokit/rest"),
	{ App } = require("@octokit/app"),
	bent = require("bent"),
	getJSON = bent("json");


if (process.env.GH_APP_PK != undefined) {
	// Initialize GitHub App with id:private_key pair and generate JWT which is used for
	// application level authorization
	let app = new App({
		id: process.env.GH_APP_ID,
		privateKey: process.env.GH_APP_PK
	});


	let jwt = app.getSignedJsonWebToken();

	async function getAccessToken(owner, repo) {
		// Firstly, get the id of the installation based on the repository
		let url = `https://api.github.com/orgs/${owner}/installation`;
		if (repo) url = `https://api.github.com/repos/${owner}/${repo}/installation`;
		console.debug({ url });
		let install = await getJSON(url, null, {
			authorization: `Bearer ${jwt}`,
			accept: "application/vnd.github.machine-man-preview+json"
		});
		let installationId = install.id;
		console.debug({ installationId });
		// And acquire access token for that id
		let accessToken = await app.getInstallationAccessToken({ installationId });

		return accessToken;
	}

	let getClient = accessToken =>
		new Octokit({
			auth() {
				return `token ${accessToken}`;
			}
		});

	module.exports = {
		getAccessToken,
		getClient
	};

} else {
	module.exports = {
		getAccessToken: () => { },
		getClient: () => { }
	};
}

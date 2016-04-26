import {
	TOKEN_KEY,
	LONG_NAME_KEY,
	SYMMETRIC_KEY,
	SERVER
} from '../constants/AuthConfig'
import {
	APP_DATA
} from '../constants/AppDataMaidsafe'

import * as sodium from 'libsodium-wrappers'
import * as axios from 'axios'

class Request {
	constructor(payload, callback) {
		this.payload = payload
		this.callback = callback
		this.axiosInstance = axios.create({
			baseURL: SERVER,
			timeout: 30000
		})
	}
	_encrypt() {
		if (!(this.payload.headers && this.payload.headers.authorization)) {
			return this.payload
		}
		this.payload.headers['Content-Type'] = 'text/plain'
		try {
			let symmetricKeys = getSymmetricKeys()
				// TODO query params decryption
			let query = this.payload.url.split('?')
			if (query[1]) {
				/*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
				let encryptedQuery = new Buffer(sodium.crypto_secretbox_easy(query[1],
						symmetricKeys.nonce, symmetricKeys.key)).toString('base64')
					/*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
				this.payload.url = query[0] + '?' + encodeURIComponent(encryptedQuery)
			}
			if (this.payload.data) {
				let data = this.payload.data
				if (!(data instanceof Uint8Array)) {
					data = new Uint8Array(new Buffer(JSON.stringify(data)));
				}
				/*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
				this.payload.data = new Buffer(sodium.crypto_secretbox_easy(data,
						symmetricKeys.nonce, symmetricKeys.key)).toString('base64')
					/*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
			}
			return this.payload
		} catch (e) {
			return this.callback(e)
		}
	}
	_decrypt(response) {
		let data = response.data
		if (!data) {
			return this.callback('Invalid data')
		}
		if (!(this.payload.headers && this.payload.headers.authorization)) {
			return data
		}
		try {
			let symmetricKeys = getSymmetricKeys()
			try {
				/*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
				data = sodium.crypto_secretbox_open_easy(new Uint8Array(new Buffer(data, 'base64')),
						symmetricKeys.nonce, symmetricKeys.key)
					/*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
				data = response.headers('file-name') ? new Buffer(data) : new Buffer(data).toString()
			} catch (e) {}
			return data
		} catch (e) {
			return this.callback(e)
		}
	}
	send() {
		this.axiosInstance.request(this._encrypt(this.payload)).then(response => {
			if (!response) {
				return this.callback();
			}
			this.callback(null, this._decrypt(response), response.headers);
		}, err => {

			if (err.status === -1) {
				return this.callback('Could not connect to launcher - Failed to connect with launcher. Launcher should be left running.');
			} else if (err.status === 401) {
				return this.callback('Access denied', 'Launcher has denied access. Restart application again to continue.');
			}
			return this.callback(this._decrypt(err));
		})
	}
}

function setAuthToken(token) {
	localStorage.setItem(TOKEN_KEY, token)
}

function setSymmetricKeys(symmetricKeys) {
	localStorage.setItem(SYMMETRIC_KEY, JSON.stringify(symmetricKeys))
}

function getAuthToken() {
	return localStorage.getItem(TOKEN_KEY)
}

function setUserLongName(longName) {
	localStorage.setItem(LONG_NAME_KEY, longName)
}

function getUserLongName() {
	return localStorage.getItem(LONG_NAME_KEY)
}

function getSymmetricKeys() {
	let symmetricKeys = JSON.parse(localStorage.getItem(SYMMETRIC_KEY))
	symmetricKeys.key = new Uint8Array(new Buffer(symmetricKeys.key, 'base64'))
	symmetricKeys.nonce = new Uint8Array(new Buffer(symmetricKeys.nonce, 'base64'))
	return symmetricKeys
};

function sendAuthorisationRequest(callback) {
	/*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
	let assymKeys = sodium.crypto_box_keypair()
	let assymNonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES)
		/*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
	let publicKey = new Buffer(assymKeys.publicKey).toString('base64')
	let nonce = new Buffer(assymNonce).toString('base64')

	function onResponse(err, body, headers) {
		if (!err && !body && !headers) {
			return callback('Unable to connect Launcher')
		}
		if (err) {
			return callback(err)
		}
		// self.authToken = body.token;
		let symmetricKeys = {
			key: null,
			nonce: null
		}
		setAuthToken(body.token)
		let cipher = new Uint8Array(new Buffer(body.encryptedKey, 'base64'))
		let publicKey = new Uint8Array(new Buffer(body.publicKey, 'base64'))
			/*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/
		let data = sodium.crypto_box_open_easy(cipher, assymNonce, publicKey, assymKeys.privateKey)
		symmetricKeys.key = data.slice(0, sodium.crypto_secretbox_KEYBYTES)
		symmetricKeys.nonce = data.slice(sodium.crypto_secretbox_KEYBYTES)
			/*jscs:enable requireCamelCaseOrUpperCaseIdentifiers*/
		symmetricKeys.key = new Buffer(symmetricKeys.key).toString('base64')
		symmetricKeys.nonce = new Buffer(symmetricKeys.nonce).toString('base64')
		setSymmetricKeys(symmetricKeys)
		callback(null, symmetricKeys)
	}

	let payload = {
		url: 'auth',
		method: 'POST',
		data: {
			app: APP_DATA,
			permissions: [],
			publicKey: publicKey,
			nonce: nonce
		}
	};
	(new Request(payload, onResponse)).send()
}

function isTokenValid(callback) {
	const token = getAuthToken()
	if (!token) {
		return callback('No token found')
	}

	let payload = {
		url: 'auth',
		method: 'GET',
		headers: {
			authorization: 'Bearer ' + token
		}
	};
	(new Request(payload, callback, true)).send()
}

// authorise application
export function safeAuth(callback) {
	isTokenValid(function (err) {
		if (err) {
			localStorage.clear()
			return sendAuthorisationRequest(callback)
		}
		return callback()
	})
}

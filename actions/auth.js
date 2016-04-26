import * as types from '../constants/AuthTypes'
import {
	safeAuth
} from '../utils/safeApi'

function authRequest() {
	return {
		type: types.AUTH_REQUEST,
		isProcessAuthentication: true
	}
}

function authSuccess(token) {
	return {
		type: types.AUTH_SUCCESS,
		isProcessAuthentication: false
	}
}

function authError(err) {
	return {
		type: types.AUTH_ERROR,
		isProcessAuthentication: false,
		err
	}
}

export function authorise() {
	return dispatch => {
  	dispatch(authRequest())
		safeAuth((err, res) => {
			if (err) {
				dispatch(authError(err))
			} else {
				console.log('Application authorised');
				dispatch(authSuccess(err))
			}
		})
	}
}

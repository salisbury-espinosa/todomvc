import {
  AUTH_REQUEST,
  AUTH_SUCCESS,
  AUTH_ERROR
} from '../constants/AuthTypes'

const initialState = {
  isProcessAuthentication: false,
  isAuthenticated: false
}

export default function auth(state = initialState, action) {
  switch (action.type) {
    case AUTH_REQUEST:
      return Object.assign({}, state, {
        isProcessAuthentication: true,
        isAuthenticated: false
      })

    case AUTH_SUCCESS:
      return Object.assign({}, state, {
        isProcessAuthentication: false,
        isAuthenticated: true
      })

    case AUTH_ERROR:
      return Object.assign({}, state, {
        isProcessAuthentication: false,
        isAuthenticated: false,
        error: action.err
      })

    default:
      return state
  }
}
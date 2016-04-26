import { combineReducers } from 'redux'
import todos from './todos'
import auth from './auth'

const rootReducer = combineReducers({
  auth,
  todos
})

export default rootReducer

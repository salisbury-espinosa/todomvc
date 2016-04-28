import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import Header from '../components/Header'
import MainSection from '../components/MainSection'
import * as TodoActions from '../actions/todos'

class App extends Component {
  render() {
    const { todos, auth, actions } = this.props

    if (auth.isProcessAuthentication) {

      return (
        <div>
          Please check the SAFE Launcher and grant access to the MaidSafe Demo application to connect to the SAFE Network.
        </div>
      )
    }
    else if (auth.isAuthenticated) {

      return (
        <div>
          <Header addTodo={actions.addTodo} />
          <MainSection todos={todos} actions={actions} />
        </div>
      )
    }
    else {

      return (
        <div>
          Error: {auth.error}
        </div>
      )
    }
  }
}

App.propTypes = {
  todos: PropTypes.array.isRequired,
  auth: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired
}

function mapStateToProps(state) {
  return {
    todos: state.todos,
    auth: state.auth
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(TodoActions, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)

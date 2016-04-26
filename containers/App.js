import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Header from '../components/Header'
import MainSection from '../components/MainSection'
import * as TodoActions from '../actions/index'
import * as AuthActions from '../actions/auth'

class App extends Component {
  constructor(props) {
    super(props)
    props.authActions.authorise()
  }
  render() {
    const { todos, auth, todoActions } = this.props

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
          <Header addTodo={todoActions.addTodo} />
          <MainSection todos={todos} actions={todoActions} />
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
  todoActions: PropTypes.object.isRequired,
  authActions: PropTypes.object.isRequired
}

function mapStateToProps(state) {
  return {
    todos: state.todos,
    auth: state.auth
  }
}

function mapDispatchToProps(dispatch) {
  return {
    todoActions: bindActionCreators(TodoActions, dispatch),
    authActions: bindActionCreators(AuthActions, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)

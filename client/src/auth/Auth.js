import React from 'react'
import { Redirect } from 'react-router'
import Auth0Lock from 'auth0-lock'

import { AUTH_CONFIG, configOptions } from './auth0-config'
import store from '../store/store'
import {
  requestLogin,
  loginSuccess,
  loginFailure,
  requestLogout,
  logoutSuccess
} from '../store/actions'

const AuthLock = new Auth0Lock(
  AUTH_CONFIG.clientId,
  AUTH_CONFIG.domain,
  configOptions
)

class Auth {
  constructor () {
    AuthLock.on('authenticated', (authResult) => {
      AuthLock.getUserInfo(authResult.accessToken, (error, profile) => {
        if (error) {
          store.dispatch(loginFailure({ error }))
        } else {
          this.setSession(authResult, profile)
        }
      })
    })
    this.authenticate = this.authenticate.bind(this)
    this.setSession = this.setSession.bind(this)
    this.logout = this.logout.bind(this)
    this.isAuthenticated = this.isAuthenticated.bind(this)
  }

  authenticate () {
    store.dispatch(requestLogin())
    AuthLock.show()
  }

  /* * Sets the time at which the access token will expire * */
  setSession (authResult, profile) {
    const { accessToken, idToken, idTokenPayload } = authResult
    const expiresAt = JSON.stringify((idTokenPayload.exp * 1000) + new Date().getTime())
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('id_token', idToken)
    localStorage.setItem('expires_at', expiresAt)
    store.dispatch(loginSuccess({ profile: profile }))
  }

  logout () {
    store.dispatch(requestLogout())
    this.clearSession()
    .then(() => store.dispatch(logoutSuccess()))
    return <Redirect to='/' />
  }

  clearSession () {
    return new Promise((resolve, reject) => {
      localStorage.removeItem('access_token')
      localStorage.removeItem('id_token')
      localStorage.removeItem('expires_at')
      resolve()
    })
  }

  isAuthenticated () {
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'))
    const currentTime = new Date().getTime()
    return expiresAt ? currentTime < expiresAt : false
  }
}

export default Auth

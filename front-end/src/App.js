import { useContext, useState } from 'react'
/** @jsx jsx */
import { jsx } from '@emotion/core'
// Local
import Oups from './Oups'
import Footer from './Footer'
import Header from './Header'
import Main from './Main'
import Login from './Login'
import Context from './Context'
import FormInscription from './FormInscription'
// Rooter
import {
  Switch,
  Route,
  Redirect,
  useLocation
} from "react-router-dom"
import Settings from './Settings'


const useStyles = {
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: '50px',
  }
}

export default () => {
  const location = useLocation()
  const { oauth } = useContext(Context)
  const styles = useStyles
  const [drawerMobileVisible, setDrawerMobileVisible] = useState(false)
  const drawerToggleListener = () => {
    setDrawerMobileVisible(!drawerMobileVisible)
  }

  return (
    <div className="App" css={styles.root}>
      <Header drawerToggleListener={drawerToggleListener} />
      <Switch>
        <Route exact path="/">
          {
            oauth ? (
              oauth.user ?
                (<Redirect

                  to={{
                    pathname: "/channels",
                    state: { from: location }
                  }}
                />) : (
                  <FormInscription />
                )
            ) : (
                <Login />
              )
          }
        </Route>
        <Route path="/channels">
          {
            oauth && oauth.user ? (
              <Main />
            ) : (
                <Redirect
                  to={{
                    pathname: "/",
                    state: { from: location }
                  }}
                />
              )
          }
        </Route>
        <Route path="/settings">
          <Settings />
        </Route>

        <Route path="/Oups">
          <Oups />
        </Route>
      </Switch>
      <Footer />
    </div>
  )
}

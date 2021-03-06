import { useContext } from 'react'
/** @jsx jsx */
import { jsx } from '@emotion/core'
import { useTheme } from '@material-ui/core/styles'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import Drawer from '@material-ui/core/Drawer'
import Context from './Context'
import Channels from './Channels'
import Channel from './Channel'
import Welcome from './Welcome'
import { Route, Switch } from 'react-router-dom'


const useStyles = (theme) => ({
  root: {
    backgroundColor: theme.palette.secondary.main,
    overflow: 'hidden',
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
  },
  drawer: {
    backgroundColor: theme.palette.secondary.main,
    width: '200px',
    display: 'none',
  },
  drawerVisible: {
    backgroundColor: theme.palette.secondary.main,
    display: 'block',
  },
})

export default () => {
  const {
    drawerVisible,
  } = useContext(Context)
  const theme = useTheme()
  const styles = useStyles(theme)
  const alwaysOpen = useMediaQuery(theme.breakpoints.up('sm'))
  const isDrawerVisible = alwaysOpen || drawerVisible
  
  return (
    <main css={styles.root}>
      <Drawer
        PaperProps={{ style: { position: 'relative' } }}
        BackdropProps={{ style: { position: 'relative' } }}
        ModalProps={{
          style: { position: 'relative' }
        }}
        variant="persistent"
        open={isDrawerVisible}
        css={[styles.drawer, isDrawerVisible && styles.drawerVisible]}
      >
        <Channels />
      </Drawer>
      <Switch>
        <Route path="/channels/:id">
          <Channel />
        </Route>
        <Route path="/">
          <Welcome />
        </Route>
      </Switch>
    </main>
  )
}

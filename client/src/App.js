import React from 'react';
import './App.css';
import {LoginChoice} from './HomeComponents.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import {BrowserRouter as Router, Route,Switch} from 'react-router-dom'
import {HomeTeacher} from './TeacherComponents.js'
import {HomeStudent} from './StudentComponents.js'

function App(){
  return(
    <Router>
      <Switch>
        <Route exact path="/" render={
            (routeProps)=>(<LoginChoice errDispl={(!routeProps.location.state ? "" : routeProps.location.state.errDispl)} err={(!routeProps.location.state ? "" : routeProps.location.state.err)} />)}>
            </Route>
        
        <Route path="/students/:id" render={({match})=>(<HomeStudent id={match.params.id} />)}/>
        <Route path="/teachers/:id" render={({match})=>(<HomeTeacher id={match.params.id} />)}/>
      </Switch>
    </Router>
  )
}

export default App;
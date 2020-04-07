import React, {Component} from 'react';
import './App.css';
import { Route, Switch } from "react-router-dom";
import { withRouter } from "react-router";

import Start from "./components/Start";
import TheApp from "./components/TheApp";

import Player from "./components/player/Player";

import Coach from "./components/coach/Coach";
import CoachGame from "./components/coach/CoachGame";

import PlayerChat from "./components/player/PlayerChat";


class App extends Component {

    render() {

        return (
            <div className="App">
                <Switch>
                    <Route exact path="/" component={Start} />
                    <Route exact path="/app" component={TheApp} />

                    <Route exact path="/app/coach" component={Coach} />
                    <Route path="/app/coach/:gameId" component={CoachGame} />

                    <Route exact path="/app/player" component={Player} />
                    <Route path="/app/player/:gameId" component={ PlayerChat } />
                </Switch>
            </div>
        );
    }
}

export default withRouter(App);

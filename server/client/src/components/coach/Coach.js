import React, { Component } from "react";
import { Button, ListGroup } from "reactstrap";
import { withRouter } from "react-router";
import { sortGames, renderGame } from "../util/utils";
import Sockette from "sockette";

class Coach extends Component {

    constructor(props) {
        super(props);
        this.state = {
            games: {

            },
            games_sorted: [

            ],
        };
    }

    componentDidMount() {

        this.state.socket = new Sockette('wss://inrtpyg747.execute-api.us-east-2.amazonaws.com/dev', {
            timeout: 5e3,
            maxAttempts: 10,
            onopen: e => {
                console.log('Connected!', e);

                this.state.socket.json({action: "getGames" });

            },
            onmessage: e => {
                console.log('Received:', e);

                const eObj = JSON.parse(e.data);
                const eventType = eObj.eventType;

                // two possible events
                // gamesData: Returns all the games, stored in eObj.Items
                // createGame: Returns the new gameId and then we redirect to the new game

                if (eventType === "gamesData") {
                    console.log(eObj.Items);

                    let games = {};
                    eObj.Items.forEach(item => {
                        games[item.gameId] = {date: item.date, coachId: item.coachId};
                    });

                    const arr = sortGames(games);
                    this.setState({games: games, games_sorted: arr});


                } else if (eventType === "createGame") {
                    const gameId = eObj.gameId;

                    this.props.history.push({
                        pathname: '/app/coach/' + gameId,
                    });
                }

            },
            onreconnect: e => console.log('Reconnecting...', e),
            onmaximum: e => console.log('Stop Attempting!', e),
            onclose: e => console.log('Closed!', e),
            onerror: e => console.log('Error:', e)
        });

    }

    newGame() {
        const coachId = localStorage.getItem('uid');

        const data = {
            "coachId": coachId,
        };

        this.state.socket.json({action: "createGame", data: data });
    }

    render() {
        const games_sorted = this.state.games_sorted;
        return (
            <div>
                <h2>Coach</h2>
                <Button color="primary" onClick={() => { this.newGame() } }>Create Game</Button>
                <h3>Games</h3>
                <ListGroup>
                    {
                        games_sorted.map(game => {
                            return renderGame(game, true);
                    }) }
                </ListGroup>
            </div>
        );
    }

}

export default withRouter(Coach);

import React, { Component } from "react";
import { sortGames, renderGame } from "../util/utils"
import { ListGroup } from "reactstrap";
import Sockette from "sockette";

class Player extends Component {

    constructor(props) {
        super(props);
        this.state = {
            games: {

            },
            games_sorted: [

            ]
        };
    }

    componentDidMount() {

        const socket = new Sockette('wss://inrtpyg747.execute-api.us-east-2.amazonaws.com/dev', {
            timeout: 5e3,
            maxAttempts: 10,
            onopen: e => {
                console.log('Connected!', e);

                socket.json({action: "getGames" });

            },
            onmessage: e => {
                console.log('Received:', e);

                const eObj = JSON.parse(e.data);
                const eventType = eObj.eventType;

                // Possible Events
                // gamesData: Returns all the games, stored in eObj.Items

                if (eventType === "gamesData") {
                    console.log(eObj.Items);

                    let games = {};
                    eObj.Items.forEach(item => {
                        games[item.gameId] = {date: item.date, coachId: item.coachId};
                    });

                    const arr = sortGames(games);
                    this.setState({games: games, games_sorted: arr});

                }

            },
            onreconnect: e => console.log('Reconnecting...', e),
            onmaximum: e => console.log('Stop Attempting!', e),
            onclose: e => console.log('Closed!', e),
            onerror: e => console.log('Error:', e)
        });

    }

    render() {
        const games_sorted = this.state.games_sorted;
        return (
            <div>
                <h2>Player</h2>
                <h3>Games</h3>
                <ListGroup>
                    {
                        games_sorted.map(game => {
                            return renderGame(game, false);
                        }) }
                </ListGroup>
            </div>
        );
    }

}

export default Player;

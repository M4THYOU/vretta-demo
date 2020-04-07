import React, { Component } from "react";
import { Button, ButtonGroup } from "reactstrap";
import { v4 as uuidv4 } from "uuid";
import Sockette from "sockette";

class TheApp extends Component {

    constructor(props) {
        super(props);
        this.state = {
            //
        };
    }

    redirectHandler(isCoach) {

        const socket = new Sockette('wss://inrtpyg747.execute-api.us-east-2.amazonaws.com/dev', {
            timeout: 5e3,
            maxAttempts: 10,
            onopen: e => {
                console.log('Connected!', e);
                socket.json({action: "getToken"});
            },
            onmessage: e => {
                console.log('Received:', e);
                const eObj = JSON.parse(e.data);
                const eventType = eObj.eventType;

                // Possible Events
                // getJWT: returns a JWT token to use as the playerId

                if (eventType === "getJWT") {
                    const token = eObj.Attributes.token;

                    localStorage.setItem("uid", token);
                    localStorage.setItem("isCoach", isCoach);

                    if (isCoach) {
                        this.props.history.push('/app/coach/');
                    } else {
                        this.props.history.push('/app/player/');
                    }

                }

            },
            onreconnect: e => console.log('Reconnecting...', e),
            onmaximum: e => console.log('Stop Attempting!', e),
            onclose: e => console.log('Closed!', e),
            onerror: e => console.log('Error:', e)
        });

    }

    render() {

        const isCoachVal = localStorage.getItem("isCoach");

        if (isCoachVal === 'false') {
            this.props.history.push('/app/player');
        } else if (isCoachVal === 'true') {
            this.props.history.push('/app/coach');
        }

        localStorage.getItem("uid");

        return (
            <div>
                <h2>App</h2>
                <ButtonGroup>
                    <Button outline color="primary" onClick={() => { this.redirectHandler(true) }}>Coach</Button>
                    <Button outline color="primary" onClick={() => { this.redirectHandler(false) }}>Player</Button>
                </ButtonGroup>

            </div>
        );
    }

}

export default TheApp;

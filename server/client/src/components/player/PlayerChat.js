import React, { Component } from "react";
import {Label, Input, Button, Container, Row, Col, InputGroup, InputGroupAddon, ListGroupItem} from "reactstrap";
import socketIOClient from "socket.io-client";
import Sockette from "sockette";

let sound = require('../../when.mp3');

class PlayerChat extends Component {

    constructor(props) {
        super(props);

        // create audio ref.
        this.audioRef = React.createRef();

        const game = props.location.state.game;

        this.state = {
            currentChat: [],
            currentMessage: '',
            gameId: null,
            coachId: null,
            socket: null
        };
    }

    exitHandler() {
        window.location.href = "/app/player";
    }

    componentDidMount() {
        const uid = localStorage.getItem('uid');

        this.state.socket = new Sockette('wss://inrtpyg747.execute-api.us-east-2.amazonaws.com/dev', {
            timeout: 5e3,
            maxAttempts: 10,
            onopen: e => {
                console.log('Connected!', e);

                const gameId = this.props.match.params.gameId;

                const data = {
                    uid: uid,
                    gameId: gameId
                };

                this.state.socket.json({action: "playerConnect", data: data });

            },
            onmessage: e => {
                console.log('Received:', e);
                const eObj = JSON.parse(e.data);
                const eventType = eObj.eventType;

                // Possible Events
                // getGame: returns all the game data this view needs.
                // message: a message has been received.
                // broadcast: a broadcast has been received.

                if (eventType === "getGame") {
                    const gameId = eObj.Attributes.gameId;
                    const coachId = eObj.Attributes.coachId;
                    const chat = eObj.Attributes.chat;

                    this.setState({
                        currentChat: chat,
                        gameId: gameId,
                        coachId: coachId,
                    });

                } else if (eventType === "message") {
                    const msg = eObj.Attributes.message;

                    this.audioRef.current.play().catch(err => {
                        console.log(err);
                    });

                    let currChat = this.state.currentChat.slice();
                    currChat.push([msg, true]);
                    this.setState({
                        currentChat: currChat
                    });

                } else if (eventType === "broadcast") {
                    const msg = eObj.Attributes.message;

                    this.audioRef.current.play().catch(err => {
                        console.log(err);
                    });

                    let currChat = this.state.currentChat.slice();
                    currChat.push([msg, true, true]);
                    this.setState({
                        currentChat: currChat
                    });
                }

            },
            onreconnect: e => console.log('Reconnecting...', e),
            onmaximum: e => console.log('Stop Attempting!', e),
            onclose: e => console.log('Closed!', e),
            onerror: e => console.log('Error:', e)
        });

    }

    sendMessage(e) {
        e.preventDefault();

        if (this.state.currentMessage === '') {
            console.log("empty message, returning");
            return;
        }

        const sender = localStorage.getItem('uid');
        const message = this.state.currentMessage;
        const gameId = this.state.gameId;

        // update the current client's chat.
        let currChat = this.state.currentChat.slice();
        currChat.push([message, false]);
        this.setState({
            currentChat: currChat,
            currentMessage: ''
        });

        console.log(message);

        if (this.state.socket) {

            const messageData = {
                uid: sender,
                message: message,
                gameId: gameId
            };

            this.state.socket.json({action: "messageFromPlayer", data: messageData });

        }

    }

    updateMessage(e) {
        this.setState({
            currentMessage: e.target.value
        })
    }

    renderMarginCol(msg) {
        if (!msg[1]) {
            return (
                <Col>

                </Col>
            );
        }
    }

    renderBroadcastBar(msg) {

        if (msg[2]) {
            return (
                <ListGroupItem className="not-my-broadcast-bar">
                </ListGroupItem>
            );
        }

    }
    renderMsg(msg, index) {
        let color = "secondary";
        if (!msg[1]) {
            color = "info";
        }
        return (
            <Row key={ index }>
                { this.renderMarginCol(msg) }
                { this.renderBroadcastBar(msg) }
                <Col sm='auto' className="no-margin-message">
                    <ListGroupItem color={ color } key={ index }>
                        { msg[0] }
                    </ListGroupItem>
                </Col>
            </Row>
        )
    }

    render() {
        const currentChat = this.state.currentChat;

        return (
            <Container className="outer-container">
                <audio id="message-sound" ref={ this.audioRef } src={ sound }></audio>
                <Button className="float-sm-left" color="danger" onClick={() => { this.exitHandler() }}>EXIT</Button>
                <Row className="outer-row">
                    <Col sm={{ size: 6, offset: 3 }} className="chat-view">
                        <h2>Current Chat</h2>
                        {
                            currentChat.map((msg, index) => {
                                return this.renderMsg(msg, index);
                            })
                        }

                    </Col>
                    <Col sm={{ size: 6, offset: 3 }}>
                        <InputGroup>
                            <Label for="message" hidden>Type here...</Label>
                            <Input type="text" name="message" id="message" placeholder="Type here..."
                                   value={ this.state.currentMessage } onChange={ e => this.updateMessage(e) }
                            />
                            <InputGroupAddon addonType="append">
                                <Button onClick={ (e) => this.sendMessage(e) }>Send</Button>
                            </InputGroupAddon>

                        </InputGroup>
                    </Col>
                </Row>
            </Container>
        );
    }

}

export default PlayerChat;

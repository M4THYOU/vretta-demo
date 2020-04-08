import React, { Component } from "react";
import {
    Button,
    Container,
    Col,
    Row,
    ListGroupItem,
    Label,
    Input,
    InputGroupAddon, InputGroup
} from "reactstrap";
import update from 'immutability-helper';
import Sockette from "sockette";

let sound = require('../../when.mp3');

class CoachGame extends Component {

    constructor(props) {
        super(props);

        // create audio ref.
        this.audioRef = React.createRef();

        this.state = {
            chatTitle: "Current Chat",
            players: [],
            currentChat: [],
            broadcasts: [],
            currentMessage: '',
            selectedPlayer: null,
            showBroadcasts: false,
            messages: {},
            game: null,
            socket: null,
            isActive: {},
            hasUnread: {},
        };

    }

    exitHandler() {
        window.location.href = "/app/coach";
    }

    componentDidMount() {
        this.state.socket = new Sockette('wss://inrtpyg747.execute-api.us-east-2.amazonaws.com/dev', {
            timeout: 5e3,
            maxAttempts: 10,
            onopen: e => {
                console.log('Connected!');

                const gameId = this.props.match.params.gameId;

                // connectionId is available in the lambda.
                const data = {
                    "gameId": gameId
                };

                // coachConnect returns the game.
                this.state.socket.json({action: "coachConnect", data: data });

            },
            onmessage: e => {
                console.log('Received:', e);

                const eObj = JSON.parse(e.data);
                const eventType = eObj.eventType;

                // Possible Events
                // gameData: Returns all the current game, which use to update the state
                // playerUpdate: playerList has changed or player has changed their activity.
                // message: message received from a player
                // playerChangeConnection: a player goes active or inactive.

                if (eventType === "gameData") {
                    const game = eObj.Attributes;
                    console.log(game);

                    this.setState({
                        players: game.players,
                        broadcasts: game.broadcasts,
                        messages: game.messages,
                        game: game,
                        isActive: game.isActive,
                        hasUnread: game.hasUnread
                    });

                } else if (eventType === "playerUpdate") {
                    const playerList = eObj.playerList;
                    const currPlayer = eObj.currPlayer;
                    const isActive = eObj.isActive;

                    console.log(isActive);
                    console.log(currPlayer);

                    this.setState({
                        players: playerList,
                        isActive: update(this.state.isActive, {[currPlayer]: {$set: isActive}}),
                    });
                }  else if (eventType === "message") {
                    console.log(eObj);

                    const msg = eObj.Attributes.message;
                    const playerId = eObj.Attributes.playerId;

                    this.audioRef.current.play().catch(err => {
                        console.log(err);
                    });

                    if (playerId === this.state.selectedPlayer) {
                        let currChat = this.state.currentChat.slice();
                        currChat.push(msg);

                        // now update state of messages
                        this.setState({
                            messages: update(this.state.messages, {[playerId]: {$set: currChat}}),
                            currentChat: currChat,
                            hasUnread: update(this.state.hasUnread, {[playerId]: {$set: false}}),
                        });

                        // unset it as hasUnread=false on db.
                        this.updateUnread(playerId, false);

                    } else { // then we just update messages
                        let currChat = this.state.messages[playerId];
                        if (typeof currChat === "undefined") {
                            currChat = [];
                        }
                        currChat.push(msg);

                        this.setState({
                            messages: update(this.state.messages, {[playerId]: {$set: currChat}}),
                            hasUnread: update(this.state.hasUnread, {[playerId]: {$set: true}}),
                        });
                    }

                } else if (eventType === "playerChangeConnection") {
                    console.log(eObj);

                    const isActive = eObj.Attributes.isActive;
                    const playerId = eObj.Attributes.playerId;

                    this.setState({
                        isActive: update(this.state.isActive, {[playerId]: {$set: isActive}}),
                    });

                }

            },
            onreconnect: e => console.log('Reconnecting...', e),
            onmaximum: e => console.log('Stop Attempting!', e),
            onclose: e => console.log('Closed!', e),
            onerror: e => console.log('Error:', e)
        });

    }

    updateUnread(playerId, unread) {
        const gameId = this.state.game.gameId;
        const data = {
            "gameId": gameId,
            "unread": unread,
            "playerId": playerId,
        };

        this.state.socket.json({action: "updateUnread", data: data });
    }

    playerOnClick(player) {
        const playerMessages = this.state.messages[player];

        if (this.state.hasUnread[player]) {
            this.updateUnread(player, false);
        }

        if (typeof playerMessages === "undefined") {
            this.setState({
                currentChat: [],
                selectedPlayer: player,
                showBroadcasts: false,
                chatTitle: "Current Chat",
                hasUnread: update(this.state.hasUnread, {[player]: {$set: false}}),
            });
        } else {
            this.setState({
                currentChat: playerMessages,
                selectedPlayer: player,
                showBroadcasts: false,
                chatTitle: "Current Chat",
                hasUnread: update(this.state.hasUnread, {[player]: {$set: false}}),
            });
        }
    }

    sendMessage(e) {
        e.preventDefault();

        const receiver = this.state.selectedPlayer;
        const showBroadcasts = this.state.showBroadcasts;
        if (!receiver && !showBroadcasts) { // if no player has been selected, i.e. selectedPlayer is null or undefined.
            console.log("returning...");
            return;
        }

        if (this.state.currentMessage === '') {
            console.log("empty message, returning");
            return;
        }
        
        const sender = localStorage.getItem('uid');
        const message = this.state.currentMessage;
        const gameId = this.state.game.gameId;

        // update the current client's chat.
        let currChat = this.state.currentChat.slice();

        if (showBroadcasts) {
            const newMsg = {
                msg: message,
                isBroadcast: true,
                sender: sender,
                date: Date()
            };
            currChat.push(newMsg); // third element indicates it's a broadcast message.

            // in this case, update broadcasts state too.
            let currBroadcasts = this.state.broadcasts.slice();
            currBroadcasts.push(newMsg);
            this.setState({ broadcasts: currBroadcasts });

            // update each player chat in the client
            let newMessages = {};
            this.state.players.forEach(player => {
                if (this.state.messages[player]) {

                    console.log('XX');
                    let playerChat = this.state.messages[player].slice();
                    playerChat.push(newMsg);
                    newMessages[player] = playerChat;

                } else if (player !== "placeholder") { // it must be player with no field in messages.
                    console.log('YY');
                    newMessages[player] = [newMsg];
                }
            });

            console.log(this.state.messages);
            console.log(newMessages);
            this.setState({
                messages: newMessages,
            });
            console.log(this.state.messages);

            if (this.state.socket) {
                const data = {
                    "message": message,
                    "gameId": gameId,
                    "coachId": sender
                };

                this.state.socket.json({action: "broadcast", data: data });
            }

        } else {
            const newMsg = {
                msg: message,
                isBroadcast: false,
                sender: sender,
                date: Date()
            };
            currChat.push(newMsg);

            if (this.state.socket) {
                const data = {
                    "coachId": sender,
                    "message": message,
                    "playerId": receiver,
                    "gameId": gameId
                };

                this.state.socket.json({action: "messageFromCoach", data: data });
            }

            this.setState({
                messages: update(this.state.messages, {[receiver]: {$set: currChat}}),
                currentChat: currChat,
                currentMessage: ''
            });

        }

        this.setState({
            currentChat: currChat,
            currentMessage: ''
        });

    }

    broadcastInitHandler() {
        this.setState({
            currentChat: this.state.broadcasts,
            selectedPlayer: "broadcast",
            showBroadcasts: true,
            chatTitle: 'Broadcast'
        });
    }

    updateMessage(e) {
        this.setState({
            currentMessage: e.target.value
        })
    }

    renderMarginCol(fromMe) {
        if (fromMe) {
            return (
                <Col>

                </Col>
            );
        }
    }

    renderBroadcastBar(isBroadcast) {

        if (isBroadcast) {
            return (
                    <ListGroupItem className="my-broadcast-bar">
                    </ListGroupItem>
            );
        }

    }

    renderMsg(msg, index) {
        const msg_s = msg.msg;
        const isBroadcast = msg.isBroadcast;
        const sender = msg.sender;
        const date = msg.date;
        const currentUid = localStorage.getItem('uid');

        const fromMe = (sender === currentUid);

        let color = "secondary";
        if (fromMe) {
            color = "info";
        }

        return (
            <Row key={ index }>
                { this.renderMarginCol(fromMe) }
                <Col sm='auto' className="no-margin-message">
                    { date }
                    <ListGroupItem color={ color } key={ index }>
                        { msg_s }
                    </ListGroupItem>
                </Col>
                { this.renderBroadcastBar(isBroadcast) }
            </Row>
        )
    }

    renderActiveIndicator(player) {
        if (this.state.isActive[player]) {
            return (
                <Button color="success" className="active-button" outline>Active</Button>
            );
        } else {
            return (
                <Button color="danger" className="active-button" outline>Inactive</Button>
            );
        }
    }

    renderUnread(player) {
        if (this.state.hasUnread[player]) {
            return (
                <Col>
                    <h1 className="message-indicator">&#x2022;</h1>
                </Col>
            );
        }
    }

    renderPlayer(player) {
        let classes = "player-row";

        if (player === "placeholder") {
            return;
        }

        if (this.state.selectedPlayer === player) {
            classes += " selected";
        }
        return (
            <Row onClick={() => this.playerOnClick(player)} key={ player } className={ classes }>
                <Col xs="6" key={ player }>
                    { player.slice(-10) }
                </Col>
                <Col xs="3">
                    { this.renderActiveIndicator(player) }
                </Col>
                    { this.renderUnread(player) }
            </Row>
        )
    }

    renderPlayers() {
        let players = [];
        if (this.state !== null && typeof this.state !== 'undefined') {
            players = this.state.players;
        }

        if (players === undefined || players.length < 2) {
            return (<p>Looking for players...</p>);
        } else {
            return (
                <Container>
                    {
                        players.map(player => {
                            return this.renderPlayer(player);
                        })
                    }
                </Container>
            );
        }

    }

    renderBroadcastButton() {
        if (this.state.selectedPlayer === "broadcast") {
            return (
                <Button color="info" onClick={() => this.broadcastInitHandler()}>Broadcast</Button>
            );
        } else {
            return (
                <Button color="info" onClick={() => this.broadcastInitHandler()} outline>Broadcast</Button>
            );
        }
    }

    render() {
        let currentChat = this.state.currentChat;
        if (typeof currentChat === 'undefined') {
            currentChat = [];
        }

        let selectedPlayer = this.state.selectedPlayer;
        if (selectedPlayer === "broadcast") {
            selectedPlayer = "";
        } else if (selectedPlayer) {
            selectedPlayer = selectedPlayer.slice(-10);
        }

            return (
                <Container className="outer-container">
                    <audio id="message-sound" ref={ this.audioRef } src={ sound }></audio>
                    <Button className="float-sm-left" color="danger" onClick={() => { this.exitHandler() }}>EXIT</Button>
                    <Row className="outer-row">
                        <Col xs="6">
                            <h2>Broadcast</h2>
                            { this.renderBroadcastButton() }
                            <h2>Players</h2>
                            { this.renderPlayers() }
                        </Col>

                        <Col xs="6" className="chat-view">
                            <h2>{ this.state.chatTitle }</h2>
                            <h6>{ selectedPlayer }</h6>
                            {
                                currentChat.map((msg, index) => {
                                    return this.renderMsg(msg, index);
                                })
                            }
                        </Col>
                        <Col xs={{ size: 6, offset: 6 }}>
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

export default CoachGame;

import React, { Component } from "react";
import { Link } from "react-router-dom";

class Start extends Component {

    constructor(props) {
        super(props);
        this.state = {
            //
        };
    }

    render() {
        return (
            <div>
                <Link to="/app">Enter</Link>
            </div>
        );
    }

}

export default Start;

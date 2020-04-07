import React, {Component} from "react";
import {Button, ListGroupItem} from "reactstrap";
import {Link} from "react-router-dom";

class SingleGame extends Component {

    constructor(props) {
        super(props);

        const isCoach = props.isCoach;
        let link = '/app/';
        if (isCoach) {
            link += 'coach/';
        } else {
            link += 'player/';
        }
        link +=  props.obj._id;

        this.state = {
            game: props.obj,
            link: link
        };
    }

    render() {
        return (
            <ListGroupItem>
                <Link to={{
                    pathname: this.state.link,
                    state: {
                        game: this.state.game,
                    }
                }}>
                    <Button>
                        { this.props.obj._id } | { this.props.obj.date }
                    </Button>
                </Link>
            </ListGroupItem>
        );
    }

}

export default SingleGame;

import SingleGame from "./SingleGame";
import React from "react";

export function  sortGames(games) {
    let arr = Object.keys(games).map(function(key) {
        return {'_id': key, 'date': games[key].date, "coachId": games[key].coachId};
    });

    arr.sort(function(a, b) {
        let keyA = new Date(a.date),
            keyB = new Date(b.date);
        // Compare the 2 dates
        if (keyA > keyB) return -1;
        if (keyA < keyB) return 1;
        return 0;
    });

    return arr;

}

export function renderGame(currentGame, isCoach) {
    return (<SingleGame obj={ currentGame }
                        key={ currentGame._id }
                        isCoach={ isCoach } />);
}

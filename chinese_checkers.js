var cc = {
    /* Created using my GUI Hex board tool at {@link} */
    BOARD: [
        [0,0],[-1,1],[-1,0],[0,-1],[1,-1],[1,0],[0,1],[-2,2],[-1,2],
        [0,2],[1,1],[2,0],[2,-1],[2,-2],[1,-2],[0,-2],[-1,-1],[-2,0],
        [-2,1],[-3,2],[-3,1],[-3,0],[-2,-2],[-2,-1],[0,-3],[-1,-2],
        [1,-3],[2,-3],[3,-3],[3,-2],[3,-1],[3,0],[2,1],[1,2],[0,3],[-1,3],
        [-2,3],[-3,3],[-3,-1],[-4,0],[-4,1],[-4,2],[-4,3],[-4,4],[-3,4],
        [-2,4],[-1,4],[0,4],[-1,-3],[0,-4],[1,-4],[2,-4],[3,-4],[4,-4],
        [4,-3],[4,-2],[4,-1],[4,0],[3,1],[2,2],[1,3],[2,-5],[3,-5],[3,-6],
        [5,-3],[6,-3],[5,-2],[3,2],[3,3],[2,3],[-2,5],[-3,6],[-3,5],[-5,3],
        [-6,3],[-5,2],[-3,-2],[-3,-3],[-2,-3],[1,-5],[2,-6],[3,-7],[4,-8],
        [4,-7],[4,-6],[4,-5],[5,-4],[6,-4],[7,-4],[8,-4],[7,-3],[6,-2],
        [5,-1],[4,1],[4,2],[4,3],[4,4],[3,4],[2,4],[1,4],[-1,5],[-2,6],[-3,7],
        [-4,8],[-4,7],[-4,6],[-4,5],[-5,4],[-6,4],[-7,4],[-8,4],[-7,3],[-6,2],
        [-5,1],[-4,-1],[-4,-2],[-4,-3],[-4,-4],[-3,-4],[-2,-4],[-1,-4]
    ],

    BACKGROUND: "wood.png",
    SELECT_COLOR: "green",
    ERROR_COLOR: "red"
};

cc.initEmpty = function(svgClass){
    (new H$.HexGrid(480, 420, 28, svgClass)).addMany(cc.BOARD).setGlobalBackgroundImage(cc.BACKGROUND).drawAll();
}

cc.startGame = function(form, radio, svgClass, announceClass){
    var buttons = form[radio];
    for(var i = 0; i < buttons.length; i++){
        if(buttons[i].checked){
            (new cc.Game(parseInt(buttons[i].value), svgClass, announceClass)).start();
            break;
        }
    }
    return false;
}

cc.Game = function(nPlayers, svgClass, announceClass){

    this.ANNOUNCE = announceClass;
    switch(nPlayers){
        case 2: this.players = [cc.Player.NORTH, cc.Player.SOUTH]; break;
        case 3: this.players = [cc.Player.NORTHWEST, cc.Player.NORTHEAST, cc.Player.SOUTH]; break;
        case 4: this.players = [cc.Player.NORTHWEST, cc.Player.NORTHEAST, cc.Player.SOUTHEAST, cc.Player.SOUTHWEST]; break;
        case 6: this.players = [cc.Player.NORTH, cc.Player.NORTHEAST, cc.Player.SOUTHEAST,
            cc.Player.SOUTH, cc.Player.SOUTHWEST, cc.Player.NORTHWEST]; break;
        default: throw "BadNumberOfPlayersException";
    }

    var board = new H$.HexGrid(480, 420, 28, svgClass);
    board.addMany(cc.BOARD).setGlobalBackgroundImage(cc.BACKGROUND).drawAll();
    var payloadNorth = cc.makePayload(cc.Player.NORTH); //TODO: add this to grid class?
    var payloadNortheast = cc.makePayload(cc.Player.NORTHEAST);
    var payloadSoutheast = cc.makePayload(cc.Player.SOUTHEAST);
    var payloadSouth = cc.makePayload(cc.Player.SOUTH);
    var payloadSouthwest = cc.makePayload(cc.Player.SOUTHWEST);
    var payloadNorthwest = cc.makePayload(cc.Player.NORTHWEST);
    for(var i = 0; i < cc.Player.NORTHWEST.corner.length; i++){
        var pair = cc.Player.NORTHWEST.corner[i];
        if(this.players.indexOf(cc.Player.NORTHWEST) != -1) board.get(pair[0], pair[1]).setPayload(payloadNorthwest);
        if(this.players.indexOf(cc.Player.SOUTHEAST) != -1) board.get(-pair[0], -pair[1]).setPayload(payloadSoutheast);
    }
    for(var i = 0; i < cc.Player.NORTH.corner.length; i++){
        var pair = cc.Player.NORTH.corner[i];
        if(this.players.indexOf(cc.Player.NORTH) != -1) board.get(pair[0], pair[1]).setPayload(payloadNorth);
        if(this.players.indexOf(cc.Player.SOUTH) != -1) board.get(-pair[0], -pair[1]).setPayload(payloadSouth);
    }
    for(var i = 0; i < cc.Player.NORTHEAST.corner.length; i++){
        var pair = cc.Player.NORTHEAST.corner[i];
        if(this.players.indexOf(cc.Player.NORTHEAST) != -1) board.get(pair[0], pair[1]).setPayload(payloadNortheast);
        if(this.players.indexOf(cc.Player.SOUTHWEST) != -1) board.get(-pair[0], -pair[1]).setPayload(payloadSouthwest);
    }
    board.drawAll();

    this.board = board;

};

(function Game_init(){
    //for(var i = 0; /* until win */; i = (i + 1) % this.players.length){

    function Game_start(){
        var game = this;
        var active = 0;
        var board = game.board;
        var selected = null;
        var firstMove;
        var gameOver = false;
        listenFor(firstClick);

        function firstClick(){
            var click = d3.mouse(this);
            var clicked = board.getAt(click[0], click[1]);
            if(clicked != null && clicked.getPayloadData() != null){
                if(clicked.getPayloadData().getPlayer() === game.players[active]){
                    selected = clicked;
                    selected.setBackgroundColor(cc.SELECT_COLOR).draw();
                    firstMove = true;
                    listenFor(secondClick);
                }
            }
        }

        function secondClick(){
            var click = d3.mouse(this);
            var clicked = board.getAt(click[0], click[1]);
            if(clicked != null && clicked.getPayloadData() != null){
                clickedOnPiece(clicked);
            } else if(clicked != null && clicked.getPayloadData() === null){
                clickedOnBlank(clicked);
            }
        }

        function clickedOnPiece(clicked){
            if(clicked.getPayloadData().getPlayer() === game.players[active]){
                if(clicked === selected){
                    selected.setBackgroundImage(cc.BACKGROUND).draw();
                    selected = null;
                    // De-selecting piece during a jump ends the turn
                    if(!firstMove) nextPlayer();
                    listenFor(firstClick);
                } else if(firstMove){
                    selected.setBackgroundImage(cc.BACKGROUND).draw();
                    selected = clicked.setBackgroundColor(cc.SELECT_COLOR).draw();
                } else {
                    nope(clicked);
                }
            } else {
                nope(clicked);
            }
        }

        function clickedOnBlank(clicked){
            var delta = selected.getStraightLineDistanceTo(clicked);
            if(delta != null){
                if(delta === 1 && firstMove){
                    selected.setBackgroundImage(cc.BACKGROUND).draw();
                    clicked.setBackgroundColor(cc.SELECT_COLOR).draw();
                    listenFor(null);
                    selected.movePayload(clicked, {
                        callback: function(){
                            clicked.setBackgroundImage(cc.BACKGROUND).draw();
                            nextPlayer();
                            listenFor(firstClick);
                        }
                    });
                } else if(delta === 2){
                    var dir = selected.getDirectionTo(clicked);
                    var middle = selected.getNeighbor(dir);
                    if(middle != null && middle.getPayloadData() != null){
                        selected.setBackgroundImage(cc.BACKGROUND).draw();
                        clicked.setBackgroundColor(cc.SELECT_COLOR).draw();
                        listenFor(null);
                        selected.movePayload(clicked, {
                            callback: function(){
                                firstMove = false;
                                selected = clicked;
                                listenFor(secondClick);
                            }
                        });
                    } else {
                        nope(clicked);
                    }
                } else {
                    nope(clicked);
                }
            } else {
                nope(clicked);
            }
        }

        // Remove the old listener, add the next
        function listenFor(click){
            if(!gameOver){
                if(click === firstClick) announce(game.players[active].name + " player's turn!");
                d3.select("." + board.getDOMClass()).on("click", click);
            }
        }

        function nextPlayer(){
            victoryCheck(game.players[active]);
            active = (active + 1) % game.players.length;
        }

        function victoryCheck(player){
            var goal = cc.Player[(player.value + 3) % 6].corner;
            for(var i = 0; i < goal.length; i++){
                var piece = board.get(goal[i][0], goal[i][1]).getPayloadData();
                if(piece === null || piece.getPlayer() != player) return false;
            }
            // Victory!
            listenFor(null);
            gameOver = true;
            announce(player.name + " player won!");
        }

        function announce(text){
            d3.select("." + game.ANNOUNCE).text(text);
        }

        function nope(clicked){
            clicked.setBackgroundColor(cc.ERROR_COLOR).draw();
            setTimeout(function(){
                clicked.setBackgroundImage(cc.BACKGROUND).draw();
            }, 400);
        }

    }

    cc.Game.prototype = {
        start: Game_start
    };
})();

cc.makePayload = function(player){
    return new H$.Payload(new cc.Piece(player), new H$.Asset(player.marble, 42, 42));
};

cc.Piece = function(player){
    function Piece_getPlayer(){
        return player;
    }
    this.getPlayer = Piece_getPlayer;
};

cc.Player = {};
(function Player_init(){

    var rotate = function(array){
        return array.map(function(pair){
            return [-pair[0], -pair[1]];
        });
    };

    /**
     * Note: south corner is a 180 rotation around the origin from the north corner.
     * Thus, for north hex (q, r) the corresponding south hex is (-q, -r)
     */
    cc.Player.NORTHWEST = {value: 5, name: "Northwest", marble: "blue.png",
        corner: [[-4,-4],[-4,-3],[-3,-4],[-4,-2],[-3,-3],[-2,-4],[-4,-1],[-3,-2],[-2,-3],[-1,-4]]
    };

    cc.Player.NORTH = {value: 0, name: "North", marble: "pearl.png",
        corner: [[4,-8],[3,-7],[4,-7],[2,-6],[3,-6],[4,-6],[1,-5],[2,-5],[3,-5],[4,-5]]
    };

    cc.Player.NORTHEAST = {value: 1, name: "Northeast", marble: "red.png",
        corner: [[8,-4],[7,-4],[7,-3],[6,-4],[6,-3],[6,-2],[5,-4],[5,-3],[5,-2],[5,-1]]
    };

    cc.Player.SOUTHEAST = {value: 2, name: "Southeast", marble: "gold.png",
        corner: rotate(cc.Player.NORTHWEST.corner)
    };

    cc.Player.SOUTH = {value: 3, name: "South", marble: "silver.png",
        corner: rotate(cc.Player.NORTH.corner)
    };

    cc.Player.SOUTHWEST = {value: 4, name: "Southwest", marble: "green.png",
        corner: rotate(cc.Player.NORTHEAST.corner)
    };

    // Set up reverse mapping for Player lookup
    for(var prop in cc.Player){
        if(!cc.Player.hasOwnProperty(prop)) continue;
        cc.Player[cc.Player[prop].value] = cc.Player[prop];
        cc.Player[cc.Player[prop].name] = cc.Player[prop];
    }

    Object.freeze(cc.Player);
})();

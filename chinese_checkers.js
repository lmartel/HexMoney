
function chinese_checkers(){
    var board = setup();
}

function setup(){
    /* Created using my GUI Hex board tool at {@link} */
    var COORDS = [
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
    ];

    /**
     * Note: south corner is a 180 rotation around the origin from the north corner.
     * Thus, for north hex (q, r) the corresponding south hex is (-q, -r)
     *
     */
    var NORTHWEST_CORNER = [
        [-4,-4],[-4,-3],[-3,-4],[-4,-2],[-3,-3],[-2,-4],[-4,-1],[-3,-2],[-2,-3],[-1,-4]
    ];

    var NORTH_CORNER = [
        [4,-8],[3,-7],[4,-7],[2,-6],[3,-6],[4,-6],[1,-5],[2,-5],[3,-5],[4,-5]
    ];

    var NORTHEAST_CORNER = [
        [8,-4],[7,-4],[7,-3],[6,-4],[6,-3],[6,-2],[5,-4],[5,-3],[5,-2],[5,-1]
    ];

    var board = new H$.HexGrid(480, 480, 32, "chinese-checkers-svg");
    board.addMany(COORDS).setGlobalBackgroundImage("wood.png").drawAll();
    var payloadNorth = new H$.Payload(null, new H$.Asset("pearl.png", 42, 42));
    var payloadNortheast = new H$.Payload(null, new H$.Asset("red.png", 42, 42));
    var payloadSoutheast = new H$.Payload(null, new H$.Asset("gold.png", 42, 42));
    var payloadSouth = new H$.Payload(null, new H$.Asset("silver.png", 42, 42));
    var payloadSouthwest = new H$.Payload(null, new H$.Asset("green.png", 42, 42));
    var payloadNorthwest = new H$.Payload(null, new H$.Asset("blue.png", 42, 42));
    for(var i = 0; i < NORTHWEST_CORNER.length; i++){
        var pair = NORTHWEST_CORNER[i];
        board.get(pair[0], pair[1]).setPayload(payloadNorthwest);
        board.get(-pair[0], -pair[1]).setPayload(payloadSoutheast);
    }
    for(var i = 0; i < NORTH_CORNER.length; i++){
        var pair = NORTH_CORNER[i];
        board.get(pair[0], pair[1]).setPayload(payloadNorth);
        board.get(-pair[0], -pair[1]).setPayload(payloadSouth);
    }
    for(var i = 0; i < NORTHEAST_CORNER.length; i++){
        var pair = NORTHEAST_CORNER[i];
        board.get(pair[0], pair[1]).setPayload(payloadNortheast);
        board.get(-pair[0], -pair[1]).setPayload(payloadSouthwest);
    }
    return board.drawAll();
}
function kitties(){
    var testGrid = new H$.HexGrid(400, 400, 64, "kitties-svg");
    testGrid.addMegahex(0, 0, 7);
    testGrid.setGlobalBackgroundImage("http://placekitten.com/200/200");
    testGrid.get(0, 0).setBackgroundImage("http://placekitten.com/g/200/200");
    testGrid.get(0 ,0).setPayload(new H$.Payload(null, new H$.Asset("http://placekitten.com/80/80", 80, 80)));
    testGrid.drawAll();

    var brownianKitty = function(hex){
        var next = null;
        while(next === null){
            var randomDir = Math.floor(Math.random() * 6);
            next = hex.getNeighbor(H$.DIRECTION[randomDir]);
        }
        hex.movePayload(next, {
            duration: 1600,
            callback: function(target){
                brownianKitty(target);
            }
        })
    };
    brownianKitty(testGrid.get(0,0));
}

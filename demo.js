function demo(){
    var demoGrid = new H$.HexGrid(350, 350, 16, "demo-svg");
    demoGrid.addMegahex(0, 0, 25);
    demoGrid.get(0 ,0).setPayload(new H$.Payload(null, new H$.Asset("asterisk.png", 16, 16)));
    demoGrid.drawAll();

    var resultGrid = new H$.HexGrid(350, 350, 16, "result-svg");
    resultGrid.add(0, 0).setPayload(new H$.Payload(null, new H$.Asset("asterisk.png", 16, 16))).draw().detachDrawnAsset();
    resultGrid.remove(0,0);

    var selected = {};
    var bgs = [];
    var count = 0;

    var prefix = "myHexGrid.addMany([ ";
    var suffix = " ]).drawAll();";
    var emitCode = function(){

        function miniVar(n){
            return "_bg" + (n + 1);
        }

        var bgDeclarations = "";
        for(var i = 0; i < bgs.length; i++){
            bgDeclarations += "var " + miniVar(i) + " = " + bgs[i] + ";\n";
        }
        var coords = "";
        for(var loc in selected){
            if(!selected.hasOwnProperty(loc)) continue;
            var bg = selected[loc];
            coords += ",[" + loc + (bg ? "," + miniVar(bgs.indexOf(bg)) : "") + "]";
        }
        // Chop that first comma
        coords = coords.replace(",", "");
        d3.select(".result-code")
            .text(bgDeclarations + prefix + coords + suffix);
    };
    emitCode();

    d3.select("." + demoGrid.getDOMClass()).on("click", function(){
        var click = d3.mouse(this);
        var clicked = demoGrid.getAt(click[0], click[1]);
        if(clicked != null){
            var loc = clicked.getLocation();
            if(loc in selected){
                delete selected[loc];
                count--;
                resultGrid.remove(loc.x(), loc.y());
                clicked.setBackgroundColor("white").draw();
            } else {
                var bg = d3.select(".background-path").property("value");
                selected[loc] = bg ? bg : false;
                count++;
                var hex = resultGrid.add(loc.x(), loc.y())
                    .setPayload(loc.x() === 0 && loc.y() === 0 ? (new H$.Payload(null, new H$.Asset("asterisk.png", 16, 16))) : null);
                if(bg){
                    if(bgs.indexOf(bg) === -1) bgs.push(bg);
                    hex.setBackgroundImage(bg);
                    clicked.setBackgroundImage(bg);
                } else {
                    hex.setBackgroundColor("gray");
                    clicked.setBackgroundColor("grey");
                }
                hex.draw();
                clicked.draw();
            }
            emitCode();
        }
    });
}
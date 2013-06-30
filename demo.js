function demo(){
    var demoGrid = new H$.HexGrid(350, 350, 16, "demo-svg");
    demoGrid.addMegahex(0, 0, 25);
    demoGrid.get(0 ,0).setPayload(new H$.Payload(null, new H$.Asset("asterisk.png", 16, 16)));
    demoGrid.drawAll();

    var resultGrid = new H$.HexGrid(350, 350, 16, "result-svg");
    resultGrid.add(0, 0).setPayload(new H$.Payload(null, new H$.Asset("asterisk.png", 16, 16))).draw().detachDrawnAsset();
    resultGrid.remove(0,0);

    var selected = {};
    var count = 0;

    var prefix = "myHexGrid.addMany([ ";
    var suffix = " ]).drawAll();";
    var emitCode = function(){
        var coords = "";
        for(var loc in selected){
            if(!selected.hasOwnProperty(loc)) continue;
            coords += ",[" + loc + "]";
        }
        // Chop that first comma
        coords = coords.replace(",", "");
        d3.select(".result-code")
            .text(prefix + coords + suffix);
    };
    emitCode();

    d3.select("svg").on("click", function(){
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
                selected[loc] = true;
                count++;
                resultGrid.add(loc.x(), loc.y()).setBackgroundColor("gray")
                    .setPayload(loc.x() === 0 && loc.y() === 0 ? (new H$.Payload(null, new H$.Asset("asterisk.png", 16, 16))) : null)
                    .draw();
                clicked.setBackgroundColor("grey").draw();
            }
            emitCode();
        }
    });
}
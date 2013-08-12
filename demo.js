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
    emitCode();

    d3.select(".result-code").on("blur", function(){
        var raw = this.value.split("\n");

        selected = {};
        count = 0;

        var vars = []; // How meta
        if(raw.length < 2) bgs = [];
        else{
            bgs = raw.slice(0, -1).map(function(line){
                var afterQuote = line.indexOf('"') + 1;
                // Add the variable name to the vars list
                vars.push(line.split("var ")[1].split(" =")[0]);
                // Substr between the quotes (exclusive) to get the background url/path
                return line.substr(afterQuote, line.lastIndexOf('"') - afterQuote);
            });
        }

        var cmd = raw[raw.length - 1];

        for(var i = 0; i < bgs.length; i++){
            // Replace all
            cmd = cmd.split(vars[i]).join('"' + bgs[i] + '"');
        }
        cmd = cmd.substr(cmd.indexOf("["), cmd.lastIndexOf("]") - cmd.indexOf("[") + 1);
        var data = JSON.parse(cmd);

        demoGrid.setGlobalBackgroundColor("white").drawAll();
        resultGrid.removeAll().drawAll();
        for(var i = 0; i < data.length; i++){
            var datum = data[i];
            enableHex(demoGrid.get(datum[0], datum[1]), datum[2]);
        }
    });

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
                enableHex(clicked, bg);
            }
            emitCode();
        }
    });

    /* Helpers */
    function miniVar(n){
        return "_bg" + (n + 1);
    }

    function emitCode(){

        var bgDeclarations = "";
        for(var i = 0; i < bgs.length; i++){
            bgDeclarations += 'var ' + miniVar(i) + ' = "' + bgs[i] + '";\n';
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
            .property("value", bgDeclarations + prefix + coords + suffix);
    }

    function enableHex(clicked, bg){
        var loc = clicked.getLocation();
        selected[loc] = bg ? bg : false;
        count++;
        var hex = resultGrid.add(loc.x(), loc.y());
        if(loc.x() === 0 && loc.y() === 0) hex.setPayload(new H$.Payload(null, new H$.Asset("asterisk.png", 16, 16)));
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

}
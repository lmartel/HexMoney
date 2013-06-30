d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

var H$ = {};
(function(){
    /**
     * Creates and initializes a hexagonal grid.
     * The grid itself is stored as a hash of Point objects to Hexagons.
     * This allows for sparse boards. The Point class has a toString method => "x,y"
     * that means Points with the same coords will be hashed to the same value, allowing
     * for random access by coordinate pair.
     *
     * @param cx                the pixel x-coordinate of the center of the grid
     * @param cy                the pixel y-coordinate of the center of the grid
     * @param hexSize           the length from center to vertex of each hexagon in the grid
     * @param klass             the DOM class of the svg element this grid will be drawn in
     * @constructor
     */
    H$.HexGrid = function HexGrid(cx, cy, hexSize, klass){
        var boardCenter = new Point(cx, cy);
        function HexGrid_getCenter(){ return boardCenter; }
        this.getCenter = HexGrid_getCenter;

        function HexGrid_getHexagonSize(){ return hexSize; }
        this.getHexagonSize = HexGrid_getHexagonSize;

        function HexGrid_getDOMClass(){ return klass; }
        this.getDOMClass = HexGrid_getDOMClass;

        this.grid = {};
        this.patterns = {};

        var defs = d3.select("." + klass + " defs");
        if(defs.size() === 0) d3.select("." + klass).append("svg:defs");
    };
    (function(){

        function HexGrid_add(q, r){
            var coords = new Point(q, r);
            if(this.grid[coords] != null) throw "exception: attempting to add a duplicate hexagon!";
            this.grid[coords] = new Hexagon(this, axialToPixel(this, q, r), coords);
            return this.grid[coords];
        }

        function HexGrid_addMegahex(cq, cr, diameter){
            if(diameter % 2 === 0) throw "exception: diameter of megahex must be an odd number";
            var steps = Math.floor(diameter / 2);
            for(var dx = -steps; dx <= steps; dx++){
                var dyMin = Math.max(-steps, -dx-steps);
                var dyMax = Math.min(steps, -dx+steps);
                for(var dy = dyMin; dy <= dyMax; dy++){
                    var dz = -dx-dy;
                    var q = cq + dx;
                    var r = cr + dz;
                    var coords = new Point(q, r);
                    this.grid[coords] = new Hexagon(this, axialToPixel(this, q, r), coords);
                }
            }
            return this.grid[new Point(cq, cr)];
        }

        function HexGrid_addMany(pairs){
            for (var i = 0; i < pairs.length; i++){
                var coords = new Point(pairs[i][0], pairs[i][1]);
                this.grid[coords] = new Hexagon(this, axialToPixel(this, coords.x(), coords.y()), coords);
            }
            return this;
        }

        function HexGrid_remove(q, r){
            var coords = new Point(q, r);
            if(this.grid[coords] === undefined) throw "exception: attempting to remove nonexistent hexagon!";
            this.grid[coords].undraw();
            delete this.grid[coords];
        }

        function HexGrid_removeAll(q, r){
            for (var pointStr in this.grid){
                if(!this.grid.hasOwnProperty(pointStr)) continue;
                this.grid[pointStr].undraw();
                delete this.grid[pointStr];
            }
        }

        function HexGrid_drawAll(){
            for (var pointStr in this.grid){
                if(!this.grid.hasOwnProperty(pointStr)) continue;
                this.grid[pointStr].draw();
            }
        }

        // TODO: preloadAsset, specify path and size.
        // Centered automatically when rendered. Cap size at hex size.
        // Should probably make Asset a public class.

        function HexGrid_preloadBackgroundImage(path){
            if(this.patterns[path] === undefined){
                initNewBackgroundImage(this, path);
            }
        }

        function HexGrid_setGlobalBackgroundImage(path){
            if(this.patterns[path] === undefined){
                initNewBackgroundImage(this, path);
            }
            for (var pointStr in this.grid){
                if(!this.grid.hasOwnProperty(pointStr)) continue;
                this.grid[pointStr].fill = "url(#" + this.patterns[path] + ")";
            }
        }

        function HexGrid_setGlobalBackgroundColor(css){
            for (var pointStr in this.grid){
                if(!this.grid.hasOwnProperty(pointStr)) continue;
                this.grid[pointStr].setBackgroundColor(css);
            }
        }

        function HexGrid_get(q, r){
            var coords = new Point(q, r);
            if(this.grid[coords] === undefined) throw "exception: attempting to get nonexistent hexagon!";
            return this.grid[coords]
        }

        function HexGrid_getAt(x, y){
            x -= this.getCenter().x();
            y -= this.getCenter().y();
            var q = (1/3 * Math.sqrt(3) * x - 1/3 * y) / this.getHexagonSize();
            var r = 2/3 * y / this.getHexagonSize();
            var roundedLoc = roundAxial(q, r);
            var hex = this.grid[roundedLoc];
            // Avoid returning undefined
            return (hex ? hex : null);
        }

        //TODO: set gridline colors, both globally and individually (for walls etc)

        H$.HexGrid.prototype = {
            add: HexGrid_add,
            addMegahex: HexGrid_addMegahex,
            addMany: HexGrid_addMany,
            remove: HexGrid_remove,
            removeAll: HexGrid_removeAll,
            drawAll: HexGrid_drawAll,
            preloadBackgroundImage: HexGrid_preloadBackgroundImage,
            setGlobalBackgroundImage: HexGrid_setGlobalBackgroundImage,
            setGlobalBackgroundColor: HexGrid_setGlobalBackgroundColor,
            get: HexGrid_get,
            getAt: HexGrid_getAt
        };

        /* Begin private HexGrid functions */

        /**
         * Converts from axial coordinates to pixel coordinates,
         * @param grid
         * @param q
         * @param r
         * @returns a new Point object
         */
        var axialToPixel = function(grid, q, r){
            var size = grid.getHexagonSize();
            var dx = size * Math.sqrt(3.0) * (q + r/2.0);
            var dy = size * 3.0/2.0 * r;
            return grid.getCenter().next(dx, dy);
        };

        var roundAxial = function(x, z){
            var y = -x-z;
            var rx = Math.round(x);
            var ry = Math.round(y);
            var rz = Math.round(z);

            var xErr = Math.abs(rx - x);
            var yErr = Math.abs(ry - y);
            var zErr = Math.abs(rz - z);

            if(xErr > yErr && xErr > zErr){
                rx = -ry-rz
            } else if(yErr > zErr){
                ry = -rx-rz;
            } else {
                rz = -rx-ry;
            }
            return new Point(x, z);
        }


    })();

    /* Begin public helper classes */

    /**
     * A simple wrapper around the necessary information to add an asset.
     * @constructor
     */
    var Asset = function(path, width, height){
        function Asset_path(){ return path; }
        this.path = Asset_path;

        function Asset_width(){ return width; }
        this.width = Asset_width;

        function Asset_height(){ return height; }
        this.height = Asset_height;
    };
    (function(){
        Asset.CSS_SUFFIX = "-asset";
        Asset.DEFAULT_ANIMATION_DURATION = 800;
    })();
    H$.Asset = Asset;

    var Payload = function(data, asset){
        this.data = data;
        this.asset = asset;
    };
    (function(){
        function Payload_getData(){
            return this.data;
        }

        function Payload_setData(data){
            this.data = data;
        }

        function Payload_getAsset(){
            return this.asset;
        }

        function Payload_setAsset(asset){
            this.asset = asset;
        }

        Payload.prototype = {
            getData: Payload_getData,
            setData: Payload_setData,
            getAsset: Payload_getAsset,
            setAsset: Payload_setAsset
        }
    })();
    H$.Payload = Payload;

    /* End public classes */
    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
    /* Begin private-constructor helper classes */

    /**
     * A class that manages the details
     * (pixel coordinates, payload, and vertices) about an individual
     * hexagon.
     * @param grid
     * @param c
     * @param coords
     * @constructor
     */
    var Hexagon = function(grid, c, coords) {
        this.grid = grid;

        function Hexagon_center(){ return c; }
        this.center = Hexagon_center;

        function Hexagon_getLocation(){ return coords; }
        this.getLocation = Hexagon_getLocation;

        this.fill = null;

        this.payload = new Payload(null, null);
    };

    (function(){
        // Private helper
        var calcR = function(s){
            return Math.cos(Math.PI / 6.0) * s;
        };

        function Hexagon_vertices(){
            // Sets up the vertices
            var s = this.size();
            var r = calcR(s);
            var h = s / 2;
            var c = this.center();
            //calculate all vertices by offset from center, starting at top and going clockwise
            var vertices = [
                c.next(0, -s),
                c.next(r, -h),
                c.next(r, h),
                c.next(0, s),
                c.next(-r, h),
                c.next(-r, -h)
            ];
            return vertices;
        }

        function Hexagon_height(){
            return 2 * this.size();
        }

        function Hexagon_width(){
            return 2 * calcR(this.size());
        }

        function Hexagon_size(){
            return this.grid.getHexagonSize();
        }

        function Hexagon_getGridClass(){
            return this.grid.getDOMClass();
        }

        function Hexagon_getHexClass(){
            return this.grid.getDOMClass() + "-" + this.center().toString().replace(",", "-");
        }

        // Private helper
        var calcAssetX = function(hex, asset){
            return hex.center().x() - (asset.width() / 2.0);
        };

        // Private helper
        var calcAssetY = function(hex, asset){
            return hex.center().y() - (asset.height() / 2.0);
        };

        function Hexagon_detachDrawnAsset(){
            var assetClass = this.getHexClass() + Asset.CSS_SUFFIX;
            d3.select("." + assetClass)
                .attr("class", assetClass + "-detached")
            var asset = this.payload.getAsset();
            this.payload.setAsset(null);
            return asset;
        }

        function Hexagon_draw(){
            d3.select("." + this.getHexClass()).remove();
            d3.select("." + this.getGridClass()).append("svg:polygon")
                .attr("class", this.getHexClass())
                .attr("points", this.vertices().join(" "))
                .style("stroke", "black")
                .style("fill", (this.fill != null ? this.fill : "none"));

            var assetClass = this.getHexClass() + Asset.CSS_SUFFIX;
            var asset = this.payload.asset;
            d3.select("." + assetClass).remove();
            if(asset != null){
                d3.select("." + this.getGridClass()).append("svg:image")
                    .attr("class", assetClass)
                    .attr("xlink:href", asset.path())
                    .attr("width", asset.width())
                    .attr("height", asset.height())
                    .attr("x", calcAssetX(this, asset))
                    .attr("y", calcAssetY(this, asset));
            }
            return this;
        }

        function Hexagon_undraw(){
            d3.select("." + this.getHexClass()).remove();
            d3.select("." + this.getHexClass() + Asset.CSS_SUFFIX).remove();
        }

        function Hexagon_setBackgroundImage(path){
            if(this.grid.patterns[path] === undefined){
                initNewBackgroundImage(this.grid, path);
            }
            this.fill = "url(#" + this.grid.patterns[path] + ")";
            return this;
        }

        function Hexagon_setBackgroundColor(css){
            this.fill = css;
            return this;
        }

        function Hexagon_setPayload(payload){
            if(payload === null) this.payload = new Payload(null, null);
            else this.payload = payload;
            return this;
        }

        function Hexagon_getPayload(){
            return this.payload;
        }

        /**
         * A shortcut function that clears the hexagon's payload,
         * redraws it (unless false is passed as a parameter),
         * and returns the payload. Convenient for "move"
         * actions in games.
         */
        function Hexagon_popPayload(redraw){
            redraw = redraw || true;
            var payload = this.payload;
            this.payload = new Payload(null, null);
            if(redraw) this.draw();
            return payload;
        }

        function Hexagon_movePayload(targetHex, options){
            var currentHex = this;
            options = options || {};
            duration = options["duration"] || Asset.DEFAULT_ANIMATION_DURATION;
            var assetClass = this.getHexClass() + Asset.CSS_SUFFIX;
            var asset = this.payload.getAsset();

            targetHex.setPayload(this.payload);
            if(currentHex != targetHex) currentHex.payload = new Payload(null, null);

            d3.select("." + assetClass)
                .moveToFront()
                .transition()
                .duration(duration)
                .attr("x", calcAssetX(targetHex, asset))
                .attr("y", calcAssetY(targetHex, asset))
                .each("end", function(){
                    targetHex.draw();
                    currentHex.draw();
                    if(options["callback"] != undefined) options["callback"](targetHex);
                });
            return targetHex;
        }

        // Private helper
        var findNeighbor = function(hex, direction){
            var neighbor = hex.grid.grid[hex.getLocation().add(direction.offset)];
            if(neighbor === undefined) return null;
            return neighbor;
        };

        function Hexagon_getNeighbor(direction){
            return findNeighbor(this, direction);
        }

        function Hexagon_getNeighbors(){
            var neighbors = [];
            for(var i = DIRECTION.START; i < DIRECTION.END; i++){
                var next = findNeighbor(this, DIRECTION[i]);
                if(next != null) neighbors.push(next);
            }
            return neighbors;
        }

        function Hexagon_getDirectionTo(neighbor){
            var offset = neighbor.getLocation().subtract(this.getLocation());
            var dir = DIRECTION[offset];
            if(dir === undefined) throw "exception: getDirectionTo currently finds only adjacent neighbors";
            return dir;
        }

        Hexagon.prototype = {
            vertices: Hexagon_vertices,
            height: Hexagon_height,
            width: Hexagon_width,
            size: Hexagon_size,
            getGridClass: Hexagon_getGridClass,
            getHexClass: Hexagon_getHexClass,
            detachDrawnAsset: Hexagon_detachDrawnAsset,
            draw: Hexagon_draw,
            undraw: Hexagon_undraw,
            setBackgroundImage: Hexagon_setBackgroundImage,
            setBackgroundColor: Hexagon_setBackgroundColor,
            getPayload: Hexagon_getPayload,
            setPayload: Hexagon_setPayload,
            popPayload: Hexagon_popPayload,
            movePayload: Hexagon_movePayload,
            getNeighbor: Hexagon_getNeighbor,
            getNeighbors: Hexagon_getNeighbors,
            getDirectionTo: Hexagon_getDirectionTo
        }
    })();

    /**
     * A simple immutable Point class with a hashable
     * and svg-compatible toString representation.
     * @param x
     * @param y
     * @constructor
     */
    var Point = function(x, y){
        function Point_x(){ return x; }
        function Point_y(){ return y; }

        this.x = Point_x;
        this.y = Point_y;
    };

    (function(){
        /**
         * Returns a new Point at the given offset from the current point.
         */
        function Point_next(dx, dy){
            return new Point(this.x() + dx, this.y() + dy);
        }

        function Point_add(pt2){
            return new Point(this.x() + pt2.x(), this.y() + pt2.y());
        }

        function Point_subtract(pt2){
            return new Point(this.x() - pt2.x(), this.y() - pt2.y());
        }

        function Point_toString(){
            return Math.round(this.x()) + "," + Math.round(this.y());
        }
        Point.prototype = {
            next: Point_next,
            add: Point_add,
            subtract: Point_subtract,
            toString: Point_toString
        };
    })();

    /* End helper classes */
    /* Begin misc utilities */

    var SIZEOF = function(obj){
        var size = 0;
        for(var key in obj){
            if(obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    var initNewBackgroundImage = function (grid, path){
        // Generate unique id for new pattern
        var id = grid.getDOMClass() + "-bg-" + (SIZEOF(grid.patterns) + 1);
        d3.select("." + grid.getDOMClass() + " defs")
            .append("svg:pattern")
            .attr("id", id)
            .attr("width", 1)
            .attr("height", 1)
            .append("svg:image")
            .attr("xlink:href", path)
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", grid.getHexagonSize() * 2)
            .attr("height", grid.getHexagonSize() * 2);
        grid.patterns[path] = id;
    };

    var DIRECTION = {
        NE: { value: 0, name: "Northeast", offset: new Point(1, -1) },
        E: { value: 1, name: "East", offset: new Point(1, 0) },
        SE: { value: 2, name: "Southeast", offset: new Point(0, 1) },
        SW: { value: 3, name: "Southwest", offset: new Point(-1, 1) },
        W: { value: 4, name: "West", offset: new Point(-1, 0) },
        NW: { value: 5, name: "Northwest", offset: new Point(0, -1) }
    };
    (function(){
        // Set up reverse mapping for DIRECTION lookup
        for(var prop in DIRECTION){
            if(!DIRECTION.hasOwnProperty(prop)) continue;
            DIRECTION[DIRECTION[prop].value] = DIRECTION[prop];
            DIRECTION[DIRECTION[prop].name] = DIRECTION[prop];
            DIRECTION[DIRECTION[prop].offset] = DIRECTION[prop];
        }
        DIRECTION.START = 0;
        DIRECTION.END = 6;
    })();
    H$.DIRECTION = Object.freeze(DIRECTION);

    /* End utilities */

})();

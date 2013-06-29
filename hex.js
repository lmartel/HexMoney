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
    };
    (function(){

        function HexGrid_add(q, r){
            var coords = new Point(q, r);
            if(this.grid[coords] != null) throw "exception: attempting to add a duplicate hexagon!";
            this.grid[coords] = new Hexagon(this, axialToPixel(this, q, r), coords);
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
            if(this.patterns[path] === null){
                initNewBackgroundImage(this, path);
            }
        }

        function HexGrid_setGlobalBackgroundImage(path){
            if(this.patterns[path] === null){
                initNewBackgroundImage(this, path);
            }
            for (var pointStr in this.grid){
                if(!this.grid.hasOwnProperty(pointStr)) continue;
                this.grid[pointStr].setFill("url(#" + this.patterns[path] + ")");
            }
        }

        function HexGrid_setGlobalBackgroundColor(css){
            for (var pointStr in this.grid){
                if(!this.grid.hasOwnProperty(pointStr)) continue;
                this.grid[pointStr].setFill(css);
            }
        }

        function HexGrid_get(q, r){
            var coords = new Point(q, r);
            if(this.grid[coords] === null) throw "exception: attempting to get nonexistent hexagon!";
            return this.grid[coords]
        }

        //TODO: set gridline colors, both globally and individually (for walls etc)

        H$.HexGrid.prototype = {
            add: HexGrid_add,
            drawAll: HexGrid_drawAll,
            preloadBackgroundImage: HexGrid_preloadBackgroundImage,
            setGlobalBackgroundImage: HexGrid_setGlobalBackgroundImage,
            setGlobalBackgroundColor: HexGrid_setGlobalBackgroundColor,
            get: HexGrid_get
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
    H$.Asset = Asset;

    var Payload = function(data, asset){
        this.data = data;
        this.asset = asset;
    };
    (function(){
        function Payload_data(){
            return this.data;
        }

        function Payload_setData(data){
            this.data = data;
        }

        function Payload_asset(){
            return this.asset;
        }

        function Payload_setAsset(asset){
            this.asset = asset;
        }

        Payload.prototype = {
            data: Payload_data,
            setData: Payload_setData,
            asset: Payload_asset,
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
        this.location = Hexagon_getLocation;

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

        function Hexagon_draw(){
            // Eventual TODO: remove d3 dependency
            d3.select("." + this.getHexClass()).remove();
            d3.select("." + this.getGridClass()).append("svg:polygon")
                .attr("class", this.getHexClass())
                .attr("points", this.vertices().join(" "))
                .style("stroke", "black")
                .style("fill", (this.fill != null ? this.fill : "none"));

            var assetClass = this.getHexClass() + "-asset";
            var asset = this.payload.asset;
            d3.select("." + assetClass).remove();
            if(asset != null){
                d3.select("." + this.getGridClass()).append("svg:image")
                    .attr("class", assetClass)
                    .attr("xlink:href", asset.path())
                    .attr("width", asset.width())
                    .attr("height", asset.height())
                    .attr("x", this.center().x() - (asset.width() / 2.0))
                    .attr("y", this.center().y() - (asset.height() / 2.0));
            }
            return this;
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

        function Hexagon_payload(){
            return this.payload;
        }

        function Hexagon_popPayload(){
            var payload = this.payload;
            this.payload = new Payload(null, null);
            return payload;
        }

        Hexagon.prototype = {
            vertices: Hexagon_vertices,
            height: Hexagon_height,
            width: Hexagon_width,
            size: Hexagon_size,
            getGridClass: Hexagon_getGridClass,
            getHexClass: Hexagon_getHexClass,
            draw: Hexagon_draw,
            setBackgroundImage: Hexagon_setBackgroundImage,
            setBackgroundColor: Hexagon_setBackgroundColor,
            payload: Hexagon_payload,
            setPayload: Hexagon_setPayload,
            popPayload: Hexagon_popPayload
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

        function Point_toString(){
            return Math.round(this.x()) + "," + Math.round(this.y());
        }
        Point.prototype = {
            next: Point_next,
            add: Point_add,
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

    var DIRECTION = Object.freeze({
        NE: { value: 0, name: "Northeast", offset: new Point(1, -1) },
        E: { value: 1, name: "East", offset: new Point(1, 0) },
        SE: { value: 2, name: "Southeast", offset: new Point(0, 1) },
        SW: { value: 3, name: "Southwest", offset: new Point(-1, 1) },
        W: { value: 4, name: "West", offset: new Point(-1, 0) },
        NW: { value: 5, name: "Northwest", offset: new Point(0, -1) }
    });
    H$.DIRECTION = DIRECTION;

    /* End utilities */

})();

function demo(){
    var testGrid = new H$.HexGrid(250, 250, 64, "my-svg");
    for(var i = -1; i <= 1; i++){
        for(var j = -1; j <= 1; j++){
            testGrid.add(i, j);
        }
    }
    testGrid.drawAll();
    testGrid.get(0, 0).setBackgroundImage("http://placekitten.com/g/300/300");
    testGrid.get(1, 0).setBackgroundImage("http://placekitten.com/g/200/200");
    testGrid.drawAll();
    testGrid.get(0 ,1).setBackgroundColor("#f00").setPayload(new H$.Payload(null, new H$.Asset("http://placekitten.com/50/50", 50, 50))).draw();

}
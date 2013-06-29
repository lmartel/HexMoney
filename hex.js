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

        // Private helper function
        var initNewBackgroundImage = function HexGrid_initNewBackgroundImage(grid, path){
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

        // TODO: preloadAsset, specify path and size.
        // Centered automatically when rendered. Cap size at hex size.
        // Should probably make Asset a public class.

        function HexGrid_preloadBackgroundImage(path){
            if(this.patterns[path] == null){
                initNewBackgroundImage(this, path);
            }
        }

        function HexGrid_addBackgroundImage(q, r, path){
            var coords = new Point(q, r);
            if(this.grid[coords] == null) throw "exception: attempting to set background image of nonexistent hexagon!";
            if(this.patterns[path] == null){
                initNewBackgroundImage(this, path);
            }
            this.grid[coords].setFill("url(#" + this.patterns[path] + ")");
        }

        function HexGrid_addBackgroundImageToAll(path){
            if(this.patterns[path] == null){
                initNewBackgroundImage(this, path);
            }
            for (var pointStr in this.grid){
                if(!this.grid.hasOwnProperty(pointStr)) continue;
                this.grid[pointStr].setFill("url(#" + this.patterns[path] + ")");
            }
        }

        function HexGrid_addBackgroundColor(q, r, css){
            var coords = new Point(q, r);
            if(this.grid[coords] == null) throw "exception: attempting to set background color of nonexistent hexagon!";
            this.grid[coords].setFill(css);
        }

        function HexGrid_addBackgroundColorToAll(css){
            for (var pointStr in this.grid){
                if(!this.grid.hasOwnProperty(pointStr)) continue;
                this.grid[pointStr].setFill(css);
            }
        }

        //TODO: set gridline colors, both globally and individually (for walls etc)

        H$.HexGrid.prototype = {
            add: HexGrid_add,
            drawAll: HexGrid_drawAll,
            preloadBackgroundImage: HexGrid_preloadBackgroundImage,
            addBackgroundImage: HexGrid_addBackgroundImage,
            addBackgroundImageToAll: HexGrid_addBackgroundImageToAll,
            addBackgroundColor: HexGrid_addBackgroundColor,
            addBackgroundColorToAll: HexGrid_addBackgroundColorToAll
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

    /* Begin helper classes */

    /**
     * A class that manages the details
     * (pixel coordinates, payload, and vertices) about an individual
     * hexagon.
     * @param grid
     * @param c
     * @constructor
     */
    var Hexagon = function Hexagon(grid, c, coords) {
        // Sets up the vertices
        var s = grid.getHexagonSize();
        var r = Math.cos(Math.PI / 6.0) * s;
        var h = s / 2;
        //calculate all vertices by offset from center, starting at top and going clockwise
        var vertices = [
            c.next(0, -s),
            c.next(r, -h),
            c.next(r, h),
            c.next(0, s),
            c.next(-r, h),
            c.next(-r, -h)
        ];
        function Hexagon_vertices(){ return vertices; }
        this.vertices = Hexagon_vertices;

        function Hexagon_center(){ return c; }
        this.center = Hexagon_center;

        function Hexagon_size(){ return s; }
        this.size = Hexagon_size;

        var height = 2 * s;
        function Hexagon_height(){ return height; }
        this.height = Hexagon_height;

        var width = 2 * r;
        function Hexagon_width(){ return width; }
        this.width = Hexagon_width;

        var gridClass = grid.getDOMClass();
        function Hexagon_getGridClass(){ return gridClass; }
        this.getGridClass = Hexagon_getGridClass;

        var hexClass = gridClass + "-" + c.toString().replace(",", "-");
        function Hexagon_getHexClass(){ return hexClass; }
        this.getHexClass = Hexagon_getHexClass;

        this.core = new HexagonCore(coords);
        this.fill = null;
    };

    (function(){

        function Hexagon_draw(){
            // Eventual TODO: remove d3 dependency
            d3.select("." + this.getHexClass()).remove();
            d3.select("." + this.getGridClass()).append("svg:polygon")
                .attr("class", this.getHexClass())
                .attr("points", this.vertices().join(" "))
                .style("stroke", "black")
                .style("fill", (this.fill != null ? this.fill : "none"));
        }

        function Hexagon_setFill(fill){
            this.fill = fill;
        }

        Hexagon.prototype = {
            draw: Hexagon_draw,
            setFill: Hexagon_setFill
        }
    })();

    /**
     * A class that contains the pieces of the Hexagon class
     * exposed to the client.
     * @constructor
     */
    var HexagonCore = function HexagonCore(location){
        function HexagonCore_getLocation(){ return location; }
        this.location = HexagonCore_getLocation;

        // TODO: make payload an object whose constructor takes an object that just gets spit back out and an optional asset
        this.payload = null;
    };

    /**
     * A simple immutable Point class with a hashable
     * and svg-compatible toString representation.
     * @param x
     * @param y
     * @constructor
     */
    var Point = function Point(x, y){
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

    var SIZEOF = function sizeOf(obj){
        var size = 0;
        for(var key in obj){
            if(obj.hasOwnProperty(key)) size++;
        }
        return size;
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
    testGrid.addBackgroundImage(0, 0, "http://placekitten.com/g/300/300");
    testGrid.addBackgroundImage(1, 0, "http://placekitten.com/g/200/200");
    testGrid.addBackgroundImageToAll("http://placekitten.com/g/300/300");
    //testGrid.addBackgroundColorToAll("#0f0");
    testGrid.addBackgroundColor(0, 0, "#f00");
    testGrid.drawAll();
}
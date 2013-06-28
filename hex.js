var H$ = {};
(function(){
    /**
     * Creates and initializes a hexagonal grid.
     * The grid itself is stored as a hash of Point objects to Hexagons.
     * This allows for sparse boards. The Point class has a toString method => "x,y"
     * that means Points with the same coords will be hashed to the same value, allowing
     * for random access by coordinate pair.
     *
     * @param boardCenter        a Point containing the cartesian coordinates of the center of the grid
     * @param hexSize            the length from center to vertex of each hexagon in the grid
     * @constructor
     */
    H$.HexGrid = function HexGrid(cx, cy, hexSize){
        var boardCenter = new H$.Point(cx, cy);
        function HexGrid_getCenter(){ return boardCenter; }
        function HexGrid_getHexagonSize(){ return hexSize; }

        this.getCenter = HexGrid_getCenter;
        this.getHexagonSize = HexGrid_getHexagonSize;
        this.grid = {};
    };
    (function(){

        /**
         * An inner class of HexGrid that manages the details
         * (pixel coordinates, payload, and vertices) about an individual
         * hexagon.
         * @param center
         * @param size
         * @constructor
         */
        var Hexagon = function Hexagon(center, size) {
            function Hexagon_center(){ return center; }
            this.center = Hexagon_center;

            function Hexagon_size(){ return size; }
            this.size = Hexagon_size;

            // Sets up the vertices
            var s = this.size();
            var c = this.center();
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

            this.payload = null;
        };

        (function(){
            function Hexagon_draw(){
                var points = this.vertices().join(" ");
                //console.log(points);
                d3.select("svg").append("polygon").attr("points", points).style("stroke", "black").style("fill", "none");
            }

            // Possible TODO: make payload private?

            Hexagon.prototype = {
                draw: Hexagon_draw
            }
        })();


        function HexGrid_add(q, r){
            var coords = new H$.Point(q, r);
            if(this.grid[coords] != null) throw "exception: attempting to add a duplicate hexagon!"
            this.grid[coords] = new Hexagon(axialToPixel(this, q, r), this.getHexagonSize());
        }

        function HexGrid_drawAll(){
            for (var pointStr in this.grid){
                this.grid[pointStr].draw();
            }
        }

        H$.HexGrid.prototype = {
            add: HexGrid_add,
            drawAll: HexGrid_drawAll
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
            console.log(dx);
            return grid.getCenter().next(dx, dy);
        }
    })();

    /**
     * A simple immutable Point class.
     * @param x
     * @param y
     * @constructor
     */
    //PROBABLE TODO: make this a private member of HexGrid too
    H$.Point = function Point(x, y){
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
            return new H$.Point(this.x() + dx, this.y() + dy);
        }

        /**
         * @return (String)
         */
        function Point_toString(){
            return this.x() + "," + this.y();
        }
        H$.Point.prototype = {
            next: Point_next,
            toString: Point_toString
        };
    })();
})();

function demo(){
    var testGrid = new H$.HexGrid(250, 250, 64);
    for(var i = -1; i <= 1; i++){
        for(var j = -1; j <= 1; j++){
            testGrid.add(i, j);
        }
    }
    testGrid.drawAll();
}
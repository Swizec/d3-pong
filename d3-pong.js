
(function () {

    var svg = d3.select("main")
            .append("svg"),
        margin = {top: 10,
                  right: 10,
                  bottom: 10,
                  left: 10};

    var Screen = function () {
            return {
                width: Number(svg.style("width").replace("px", "")),
                height: Number(svg.style("height").replace("px", ""))
            };
        },
        Paddle = function () {
            var paddle = svg.append('rect')
                    .attr({width: 5});
            return function (x, y) {
                return paddle.attr({
                    x: x,
                    y: y,
                    height: Screen().height*0.05
                });
            };
        },
        Score = function (x, y) {
            var score = svg.append('text')
                    .attr({
                        x: x,
                        y: y
                    });
            return function (value) {
                return score.text(value);
            };
        },
        Middle = function () {
            var line = svg.append('line');
            return function () {
                var screen = Screen();
                return line.attr({
                    x1: screen.width/2,
                    y1: margin.top,
                    x2: screen.width/2,
                    y2: screen.height-margin.bottom
                });
            };
        };
    

    var left = {score: Score(Screen().width*0.25, margin.top*3)(0),
                paddle: Paddle()(margin.left, Screen().height/2)},
        right = {score: Score(Screen().width*0.75, margin.top*3)(0),
                paddle: Paddle()(Screen().width-margin.right, Screen().height/2)},
        middle = Middle()();
    
    
})();

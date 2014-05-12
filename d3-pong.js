"use strict";

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

            return function f(x, y) {
                paddle.attr({
                    x: x,
                    y: y,
                    height: Screen().height*0.1
                });
                return f;
            };
        },
        Score = function (x) {
            var score = svg.append('text');

            return function f(value) {
                score.text(value)
                    .attr({x: Screen().width*x,
                           y: margin.top*3});
                return f;
            };
        },
        Middle = function () {
            var line = svg.append('line');

            return function f() {
                var screen = Screen();
                line.attr({
                    x1: screen.width/2,
                    y1: margin.top,
                    x2: screen.width/2,
                    y2: screen.height-margin.bottom
                });
                return f;
            };
        };
    

    var left = {score: Score(0.25)(0),
                paddle: Paddle()(margin.left, Screen().height/2)},
        right = {score: Score(0.75)(0),
                paddle: Paddle()(Screen().width-margin.right, Screen().height/2)},
        middle = Middle()();
    
    d3.select(window).on('resize', function () {
        var screen = Screen();

        left.score(0);
        left.paddle(margin.left, screen.height/2);
        right.score(0);
        right.paddle(screen.width-margin.right, screen.height/2);

        middle();
    });
})();

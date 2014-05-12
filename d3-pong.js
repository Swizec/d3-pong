"use strict";

(function () {

    var svg = d3.select("main")
            .append("svg"),
        margin = {top: 10,
                  right: 10,
                  bottom: 10,
                  left: 10};

    // always returns current SVG dimensions
    var Screen = function () {
            return {
                width: Number(svg.style("width").replace("px", "")),
                height: Number(svg.style("height").replace("px", ""))
            };
        },
        // generates a paddle, returns function for updating its position
        Paddle = function (which) {
            var width = 5,
                area = svg.append('rect')
                    .classed('area', true)
                    .attr({width: width*7}),
                paddle = svg.append('rect')
                    .classed('paddle', true)
                    .classed(which+"_paddle", true)
                    .attr({width: 5}),
                update = function (x, y) {
                    var height = Screen().height*0.15;

                    paddle.attr({
                        x: x,
                        y: y,
                        height: height
                    });
                    area.attr({
                        x: x-width*5/2,
                        y: y,
                        height: height
                    });
                    return update;
                };
            
            // make paddle draggable
            var drag = d3.behavior.drag()
                    .on("drag", function () {
                        var y = Number(area.attr("y")),
                            height = Screen().height*0.1;
                        
                        update(Number(paddle.attr("x")),
                               Math.max(margin.top, 
                                        Math.min(Number(paddle.attr("y"))+d3.event.dy,
                                                 Screen().height-margin.bottom-height)));
                                        
                                        
                    })
                    .origin(function () {
                        return {x: Number(area.attr("x")),
                                y: Number(area.attr("y"))};
                    });

            area.call(drag);

            return update;
        },
        // generates a score, returns function for updating value and repositioning score
        Score = function (x) {
            var value = 0,
                score = svg.append('text')
                    .text(value);

            return function f(inc) {
                value += inc;

                score.text(value)
                    .attr({x: Screen().width*x,
                           y: margin.top*3});
                return f;
            };
        },
        // generates middle line, returns function for updating position
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
        },
        // generates the ball, returns function to perform animation steps
        Ball = function () {
            var R = 5,
                ball = svg.append('circle')
                    .classed("ball", true)
                    .attr({r: R,
                           cx: Screen().width/2,
                           cy: Screen().height/2}),
                scale = d3.scale.linear().domain([0, 1]).range([-1, 1]),
                vector = {x: scale(Math.random()),
                          y: scale(Math.random())},
                speed = 7;

            var hit_paddle = function (y, paddle) {
                return y-R > Number(paddle.attr("y")) && y+R < Number(paddle.attr("y"))+Number(paddle.attr("height"));
            },
            collisions = function () {
                var x = Number(ball.attr("cx")),
                    y = Number(ball.attr("cy")),
                    left_p = d3.select(".left_paddle"),
                    right_p = d3.select(".right_paddle");

                // collision with top or bottom
                if (y-R < margin.top || y+R > Screen().height-margin.bottom) {
                    vector.y = -vector.y;
                }
                
                // bounce off right paddle or score
                if (x+R > Number(right_p.attr("x"))) {
                    if (hit_paddle(y, right_p)) {
                        vector.x = -vector.x;
                    }else{
                        return "left";
                    }
                }

                // bounce off left paddle or score
                if (x-R < 
                    Number(left_p.attr("x"))+Number(left_p.attr("width"))) {
                    if (hit_paddle(y, left_p)) {
                        vector.x = -vector.x;
                    }else{
                        return "right";
                    }
                }

                return false;
            };
            
            return function f(left, right) {
                var screen = Screen();

                ball.attr({
                    cx: Number(ball.attr("cx"))+vector.x*speed,
                    cy: Number(ball.attr("cy"))+vector.y*speed
                });
                
                var scored = collisions();
                    
                if (scored) {
                    if (scored == "left") {
                        left.score(1);
                    }else{
                        right.score(1);
                    }
                    return true;
                }

                return false;
            };
        };
    

    // generate starting scene
    var left = {score: Score(0.25)(0),
                paddle: Paddle("left")(margin.left, Screen().height/2)},
        right = {score: Score(0.75)(0),
                paddle: Paddle("right")(Screen().width-margin.right, Screen().height/2)},
        middle = Middle()(),
        ball = Ball();
    
    // detect window resize events (also captures orientation changes)
    d3.select(window).on('resize', function () {
        var screen = Screen();

        left.score(0);
        left.paddle(margin.left, screen.height/2);
        right.score(0);
        right.paddle(screen.width-margin.right, screen.height/2);

        middle();
    });

    // start animation timer that runs until a player scores
    // then reset ball and start again
    function run() {
        d3.timer(function () {
            var scored = ball(left, right);
            if (scored) {
                d3.select(".ball").remove();
                ball = Ball();
                run();
            }
            return scored;
        }, 500);
    };
    run();
})();

document.body.addEventListener('touchstart', function(e){ e.preventDefault(); });

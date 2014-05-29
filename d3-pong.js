
(function () {
    "use strict";

    var svg = d3.select("main")
            .append("svg"),
        margin = {top: 10,
                  right: 10,
                  bottom: 10,
                  left: 10},
        parse = function (N) {
            return Number(N.replace("px", ""));
        },
        currentKeysPressed = [];


    // Add support for movement by keys
    // When a key is pressed, add it to the current keys array for further tracking
    d3.select("body").on("keydown", function() {
        if (currentKeysPressed.indexOf(d3.event.keyCode) != -1) { return }
        currentKeysPressed.push(d3.event.keyCode);
    });

    // When the key is relased, remove it from the array.
    d3.select("body").on("keyup", function() {
        currentKeysPressed.splice(currentKeysPressed.indexOf(d3.event.keyCode), 1);
    });

    // always returns current SVG dimensions
    var Screen = function () {
            return {
                width: parse(svg.style("width")),
                height: parse(svg.style("height"))
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
                        var y = parse(area.attr("y")),
                            height = Screen().height*0.1;
                        
                        update(parse(paddle.attr("x")),
                               Math.max(margin.top, 
                                        Math.min(parse(paddle.attr("y"))+d3.event.dy,
                                                 Screen().height-margin.bottom-height)));
                                        
                                        
                    })
                    .origin(function () {
                        return {x: parse(area.attr("x")),
                                y: parse(area.attr("y"))};
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
                console.log(screen);
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
                return y-R > parse(paddle.attr("y")) && y+R < parse(paddle.attr("y"))+parse(paddle.attr("height"));
            },
            collisions = function () {
                var x = parse(ball.attr("cx")),
                    y = parse(ball.attr("cy")),
                    left_p = d3.select(".left_paddle"),
                    right_p = d3.select(".right_paddle");

                // collision with top or bottom
                if (y-R < margin.top || y+R > Screen().height-margin.bottom) {
                    vector.y = -vector.y;
                }
                
                // bounce off right paddle or score
                if (x+R > parse(right_p.attr("x"))) {
                    if (hit_paddle(y, right_p)) {
                        vector.x = -vector.x;
                    }else{
                        return "left";
                    }
                }

                // bounce off left paddle or score
                if (x-R < 
                    parse(left_p.attr("x"))+parse(left_p.attr("width"))) {
                    if (hit_paddle(y, left_p)) {
                        vector.x = -vector.x;
                    }else{
                        return "right";
                    }
                }

                return false;
            };
            
            return function f(left, right, delta_t) {
                var screen = Screen(),
                    // this should pretend we have 100 fps
                    fps = delta_t > 0 ? (delta_t/1000)/100 : 1; 

                ball.attr({
                    cx: parse(ball.attr("cx"))+vector.x*speed*fps,
                    cy: parse(ball.attr("cy"))+vector.y*speed*fps
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

    // Check if the paddle needs to be moved depending on current key presses
    function movePaddle() {
        for (var i = 0; i < currentKeysPressed.length; i++) {
            var currentKeyPressed = currentKeysPressed[i];

            /*  Key Codes:
            *   87 = W
            *   83 = A
            *   38 = Up Arrow
            *   40 = Down Arrow
            */
            if (currentKeyPressed && [38, 40, 83, 87].indexOf(currentKeyPressed) != -1) {
                var leftPaddle = [83, 87].indexOf(currentKeyPressed) != -1;
                var directionUp = [38, 87].indexOf(currentKeyPressed) != -1;
                var paddleClass = leftPaddle ? '.left_paddle' : '.right_paddle';
                var paddle = d3.select(paddleClass);
                var paddleDy = 10 * (directionUp ? -1 : 1);
                var newPaddleY = Math.max(margin.top, 
                                        Math.min(parse(paddle.attr("y")) + paddleDy,
                                                 Screen().height - margin.bottom - Screen().height * 0.1));
                var paddleInstance = leftPaddle ? left : right;
                paddleInstance.paddle(parse(paddle.attr('x')), newPaddleY);
            }
        }
    }

    // start animation timer that runs until a player scores
    // then reset ball and start again
    function run() {
        var last_time = Date.now();
        d3.timer(function () {
            
            var now = Date.now(),
                scored = ball(left, right, now-last_time),
                last_time = now;
            
            movePaddle();

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

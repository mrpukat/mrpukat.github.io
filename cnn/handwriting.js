
// Drawing code taken from: https://daily-dev-tips.com/posts/javascript-mouse-drawing-on-the-canvas/
const canvas_in = document.getElementById("canvas");
const canvas_out = document.getElementById("canvasoutput");
const predict_text = document.getElementById("prediction");
const ctx_in = canvas_in.getContext("2d");
//const ctx_out = canvas_out.getContext("2d");
let coord = { x: 0, y: 0 };
let letter
const model = tf.loadLayersModel('indexeddb://9941js/model.json');

document.addEventListener("mousedown", start);
document.addEventListener("mouseup", stop);
window.addEventListener("resize", resize);

//resize();

// Aperently the backgrund for a cavas whas not white but black that looks like white
ctx_in.fillStyle = "#FFFFFF";
ctx_in.fillRect(0, 0, canvas_in.width, canvas_in.height);


function predictImage() {
	let image = tf.fromPixels(canvas_out);  // for example
	let prediction = model.predict(image);
	predict_text.innerHTML = prediction;
}

function resize() {
  ctx_in.canvas.width = window.innerWidth;
  ctx_in.canvas.height = window.innerHeight;
}

function reposition(event) {
  coord.x = event.clientX - canvas.offsetLeft;
  coord.y = event.clientY - canvas.offsetTop;
}

function start(event) {
  document.addEventListener("mousemove", draw);
  reposition(event);
}

function stop() {
  document.removeEventListener("mousemove", draw);
  letter = formatImage();
}

function draw(event) {
  ctx_in.beginPath();
  ctx_in.lineWidth = 20;
  ctx_in.lineCap = "round";
  ctx_in.strokeStyle = "#000000";
  ctx_in.moveTo(coord.x, coord.y);
  reposition(event);
  ctx_in.lineTo(coord.x, coord.y);
  ctx_in.stroke();
}

function matDebug(mat) {
	console.log('image width: '   + mat.cols         + '\n' +
    	        'image height: '  + mat.rows         + '\n' +
        	    'image size: '    + mat.size().width + '*'  + mat.size().height + '\n' +
        	    'image depth: '   + mat.depth()      + '\n' +
        	    'image channels ' + mat.channels()   + '\n' +
        	    'image type: '    + mat.type()       + '\n');	
}


// Prediction code
function formatImage() {

	let mat = cv.imread('canvas');
	let dst = new cv.Mat();

	cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY, 0);
	cv.bitwise_not(mat,mat);

	// Dont know what this does
	//mat.convertTo(mat, cv.CV_8U, 1, 0);

	let markers = new cv.Mat();
	let stats = new cv.Mat();
	let center = new cv.Mat();
	
	cv.connectedComponentsWithStats(mat, markers, stats, center);

	//matDebug(mat);
	//matDebug(markers);
	//matDebug(stats);
	//matDebug(center);

	// Amount at objects
	console.log(stats.rows - 1)

	let rect = new cv.Rect(stats.intPtr(1, 0)[0], stats.intPtr(1, 1)[0], 
						   stats.intPtr(1, 2)[0], stats.intPtr(1, 3)[0]);


	dst = mat.roi(rect);


	// Backgrund color
	let s = new cv.Scalar(0, 0, 0, 0);

	// Male the image square (will be a problem whit letters like i if not)
	let margin = Math.abs(stats.intPtr(1, 2)[0] - stats.intPtr(1, 3)[0]);
	margin /= 2;

	if (stats.intPtr(1, 2)[0] > stats.intPtr(1, 3)[0]) {
		cv.copyMakeBorder(dst, dst, margin, margin, 0, 0, cv.BORDER_CONSTANT, s);
	}
	else {
		cv.copyMakeBorder(dst, dst, 0, 0, margin, margin, cv.BORDER_CONSTANT, s);
	}

	// Make a border so that the eages are black
	cv.copyMakeBorder(dst, dst, 10, 10, 10, 10, cv.BORDER_CONSTANT, s);

	// Set final size
	cv.resize(dst, dst, new cv.Size(28, 28), 0, 0, cv.INTER_AREA);

	let show = dst.clone();

	// Nomolize to valus between 0 and 1
	// in, out, norm value, not used, type
	cv.normalize(dst, dst, 1, 0, cv.NORM_INF); 

	// Output
	//letter = dst.clone();

	// Make visable
	cv.resize(show, show, new cv.Size(300, 300), 0, 0, cv.INTER_AREA);
	//cv.normalize(dst, dst, 255, 0, cv.NORM_INF);

	cv.imshow('canvasoutput', show);
	mat.delete();
	show.delete();
	dst.delete();
	markers.delete();
	stats.delete();
	center.delete();
}

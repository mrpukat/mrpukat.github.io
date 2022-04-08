
// Drawing code taken from: https://daily-dev-tips.com/posts/javascript-mouse-drawing-on-the-canvas/
const canvas_in = document.getElementById("canvas");
const ctx_in = canvas_in.getContext("2d");
const predict_text = document.getElementById("prediction");
const responceDiv = document.getElementById("responce");

let coord = { x: 0, y: 0 };
var model;

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/*
var test_el = document.createElement("CANVAS");
test_el.stylr = "border:1px solid #000000";
document.body.appendChild(test_el);
*/

// On Server
tf.loadLayersModel('./9941js/model.json').then(res => {
	model = res;
});

// On lockal
/*
tf.loadLayersModel('https://raw.githubusercontent.com/mrpukat/mrpukat.github.io/main/cnn/9941js/model.json').then(res => {
	model = res;
});
*/

// Mouse
canvas_in.addEventListener("mousedown", start);
canvas_in.addEventListener("mouseup", stop);

clearCanvas();

// Aperently the backgrund for a cavas whas not white but black that looks like white
function clearCanvas() {
	ctx_in.fillStyle = "#FFFFFF";
	ctx_in.fillRect(0, 0, canvas_in.width, canvas_in.height);
	predict_text.innerHTML = "...";
	responceDiv.removeChild(responceDiv.lastChild);
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

  predict_text.innerHTML = "";
  const subImages = formatImage();
  for (let i = 0; i < subImages.length; ++i) {
	  predictImage(subImages[i]);
  }
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

// Prediction code
function predictImage(mat) {

	// Get data from Mat
	let imgData = new ImageData(new Uint8ClampedArray(mat.data), mat.cols, mat.rows);

	// mean(2) <- grayschale the image
	// expandDims <- Set dimetions to fin net
	// div(255) <- normilze to values between 0-1 (Cant figure out how to do it whit openCV)
	let image = tf.browser.fromPixels(imgData).mean(2).expandDims(2).expandDims().div(255);

	/*
	image.data().then(res => {
		console.log(res);
	});
	*/

	model.predict(image).data().then(res => {
		let prediction = res;
		tf.argMax(prediction).data().then(index => {
			predict_text.innerHTML += alphabet[index];
		});
	});
}


function matDebug(mat) {
	console.log('image width: '   + mat.cols         + '\n' +
    	        'image height: '  + mat.rows         + '\n' +
        	    'image size: '    + mat.size().width + '*'  + mat.size().height + '\n' +
        	    'image depth: '   + mat.depth()      + '\n' +
        	    'image channels ' + mat.channels()   + '\n' +
        	    'image type: '    + mat.type()       + '\n');	
}

// Stolen from https://stackoverflow.com/questions/3730510/javascript-sort-array-and-return-an-array-of-indices-that-indicates-the-positio
function sortWithIndeces(toSort) {
	var len = toSort.length;
	var indices = new Array(len);
	for (var i = 0; i < len; ++i) indices[i] = i;
	indices.sort(function (a, b) { return toSort[a] < toSort[b] ? -1 : toSort[a] > toSort[b] ? 1 : 0; });
	//console.log(indices);
	return indices;
}

// Format code
function formatImage() {

	let mat = cv.imread('canvas');

	cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY, 0);
	cv.bitwise_not(mat,mat);

	let markers = new cv.Mat();
	let stats = new cv.Mat();
	let center = new cv.Mat();
	
	cv.connectedComponentsWithStats(mat, markers, stats, center);

	// Backgrund color
	let s = new cv.Scalar(0, 0, 0, 0);


	//cv.sortIdx(stats, indexes, cv.SORT_EVERY_ROW + cv.SORT_ASCENDING);

	const pixelList = [];

	// Current algorithm assums that there is only one word
	for (let i = 1; i < stats.rows; ++i) {
		pixelList.push(stats.intPtr(i,0)[0]);
	}

	let indices = sortWithIndeces(pixelList);

	const subImages = [];

	for (let i = 0; i < stats.rows - 1; ++i) {

		let pixel = indices[i] + 1;

		let dst = new cv.Mat();

		let rect = new cv.Rect(stats.intPtr(pixel, 0)[0], stats.intPtr(pixel, 1)[0], 
												   stats.intPtr(pixel, 2)[0], stats.intPtr(pixel, 3)[0]);

		dst = mat.roi(rect);

		// Male the image square (will be a problem whit letters like i if not)
		let margin = Math.abs(stats.intPtr(pixel, 2)[0] - stats.intPtr(pixel, 3)[0]);
		margin /= 2;

		if (stats.intPtr(pixel, 2)[0] > stats.intPtr(pixel, 3)[0]) {
			cv.copyMakeBorder(dst, dst, margin, margin, 0, 0, cv.BORDER_CONSTANT, s);
		}
		else {
			cv.copyMakeBorder(dst, dst, 0, 0, margin, margin, cv.BORDER_CONSTANT, s);
		}

		// Make a border so that the eages are black
		cv.copyMakeBorder(dst, dst, 10, 10, 10, 10, cv.BORDER_CONSTANT, s);

		// Set final size
		cv.resize(dst, dst, new cv.Size(28, 28), 0, 0, cv.INTER_AREA);

		cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA, 0);

		subImages.push(dst);

	}

	mat.delete();
	markers.delete();
	stats.delete();
	center.delete();

	return subImages;
}


// Stolen from https://www.reddit.com/r/javascript/comments/6dqlx8/how_to_use_javascript_to_get_the_definition_of_a/
const key = '358d6847-4a89-4f30-a4c7-3bd7e6560375';

function getDefinition() {

	if (responceDiv.firstChild != null) {
		responceDiv.removeChild(responceDiv.firstChild); // Remove old def
	}

	let word = predict_text.innerHTML;

  fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${key}`)
    .then(response => response.json())
    .then(data => {

	   	let defList = data[0]["shortdef"];

	   	if (typeof defList == "undefined") {

	   		responceDiv.innerHTML = "No maching word";

	   	}
	   	else {
	   		const elemetList = document.createElement('ul');

   			for (let i = 0; i < defList.length; ++i) {
   				const listItem = document.createElement('li');
   				listItem.innerHTML = defList[i];
   				elemetList.appendChild(listItem);
 		  	}


				responceDiv.appendChild(elemetList);
	   	}


  	})
    .catch(error => console.error(error));
}
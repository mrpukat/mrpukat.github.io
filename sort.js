// Help functions
// Stole from stackoverflow
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Stole from stackoverflow
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// Site startupp 

// Create list
var arraySize = 500; // Size of list, YOU need to uppdate radixSort <-
var list = []; //Global list
for (var i = 0; i < arraySize; i++) {
	list.push({id:i+1, index:i, value:i+1});
}

// Grafics
const continer = d3.select('svg');

var height = continer._groups[0][0].clientHeight;
var width = continer._groups[0][0].clientWidth;


const xScale = d3
	.scaleBand()
	.domain(list.map(data => data.index))
	.rangeRound([0, width]);
const yScale = d3.scaleLinear().domain([0,arraySize+1]).range([height, 0]);


const bars = continer
	.selectAll('.bar')
	.data(list, data => data.index)
	.enter()
	.append('rect')
	.classed('bar',true)
	.attr('width',xScale.bandwidth())
	.attr('height', data => height - yScale(data.value))
	.attr('x', data => xScale(data.index))
	.attr('y', data => yScale(data.value));

// HTML button functions

// chepp shuffel button fix
function startup() {
	shuffle(list);

	for (var i = 0; i < arraySize; i++) {
		list[i].index = i;
	}

	bars.data(list, data => data.index).style('fill', 'lightgray').attr('x', data => xScale(data.index));
}


// Bubelsort function uses global list
async function boubleSort() {
	var sorted = false;
	var steps = 0;
	while (!sorted) {
		sorted = true;
		for (var i = 1; i < list.length - steps; i++) {
			if (list[i - 1].value > list[i].value) {
				swap(list, i, i - 1);
				sorted = false;
			}
			await uppdate(list, i - 1, i);
		}
		steps++;
	}
	return 1;
}

// Selection sort function uses global list
async function selectionSort() {

	for (var i = 0; i < list.length-1; i++) {
		var bigestIndex = 0;
		for (var j = 1; j < list.length - i; j++) {
			if (list[j].value > list[bigestIndex].value) bigestIndex = j;
			await uppdate(list, bigestIndex, j);
		}
		swap(list,bigestIndex, list.length-1-i);
		await uppdate(list, bigestIndex, list.length-1-i);
		
	}
	return 1;
}

// Insertion sort function uses global list
async function insertionSort() {

	for (var i = 1; i < list.length; i++) {
		for (var j = i; (j > 0) && (list[j].value < list[j-1].value); j--) {
			swap(list, j, j-1);
			await uppdate(list, j-1, j);
		}
	}
	return 1;
}

// Shell sort function uses global list
async function shellSort() {

	for (var gap = list.length/2; gap > 0; gap /= 2) {
		gap = Math.floor(gap); // Get an int

		for (var i = gap; i < list.length; i++) {
			for (var j = i; j >= gap && list[j].value < list[j - gap].value; j -= gap) {

				swap(list,j,j-gap);
				await uppdate(list, j, j - gap);
			}
		}
	}


	return 1;
}


// Merge sort function uses global list
async function submerge(list, l, m, r) {

	var n1 = m - l + 1;
	var n2 = r - m;
	var llist = [];
	var rlist = [];

	for (var i = 0; i < n1; ++i) { 
		llist.push(list[l + i]); 
	}

	for (var i = 0; i < n2; ++i) { 
		rlist.push(list[m + 1 + i]);
	}

	var i = 0;
	var j = 0;
	var k = l;
	while (i < n1 && j < n2) {
		if (llist[i].value <= rlist[j].value) {
			list[k] = llist[i];
			list[k].index = k;
			await uppdate(list, k, i + l);
			i++;
		}
		else {
			list[k] = rlist[j];
			list[k].index = k;
			await uppdate(list, k, m + 1 + j);
			j++;
		}
		k++;
	}

	while (i < n1) {
		list[k] = llist[i];
		list[k].index = k;
		await uppdate(list, k, i + l);
		i++;
		k++;
	}

	while (j < n2) {
		list[k] = rlist[j];
		list[k].index = k;
		await uppdate(list, k, j + 1 + m);
		j++;
		k++;
	}

	return 1;
}
async function mergeSort(l, r) {

	if (l < r) {
		var m = l + Math.floor((r - l)/2);
		await mergeSort(l, m);
		await mergeSort(m + 1, r);

		await submerge(list, l, m, r);
	}



	return 1;
}

async function quickSort(i, j) {
	var pivitIndex = findpivot(i,j);
	swap(list, pivitIndex, j);
	await uppdate(list, pivitIndex, j);
	var k = await partition(list, i, j-1,list[j].value);
	swap(list, k, j);
	await uppdate(list, k, j);
	if (k-i > 1) await quickSort(i, k-1);
	if (j-k > 1) await quickSort(k+1, j);

	return 1;
}

function findpivot(i, j) {
	return Math.floor((i + j)/2);
}

async function partition(list, left, right, pivit) {
	while (left <= right) {
		while (list[left].value < pivit) {
			left++;
			await uppdate(list, left, right);
		}
		while ((right >= left) && (list[right].value >= pivit)) { 
			right--;
			await uppdate(list, left, right);
		}
		if (right > left) {
			swap(list, left, right);
			await uppdate(list, left, right);
		}
		
	}
	return left;
}

async function heapSort() {

	var heapSize = list.length;
	await buldHeap(list, heapSize);
	for (var i = 0; i < list.length; i++) {
		heapSize = await heapRemoveMax(heapSize);
	}

	return 1;
}


async function buldHeap(list, n) {
	for (var i = (list.length/2)-1; i>=0; i--) await heapSiftdown(i, n);
	return 1;
}

async function heapSiftdown(pos, n) {
	if ((pos < 0) || (pos >= n)) return 1;
	while(!heapIsLeaf(pos, n)) {
		var j = 2*pos + 1;
		if ((j < (n-1)) && (list[j].value < list[j+1].value)) j++;
		if (list[pos].value >= list[j].value) return 1;
		swap(list, pos, j);
		await uppdate(list, pos, j);
		pos = j;
	}
	return 1;
}

function heapIsLeaf(pos, n) {
	return ((pos >= Math.floor(n/2)) && (pos < n));
}

async function heapRemoveMax(n) {
	if (n == 0) return 0;
	swap(list, 0, --n);
	await uppdate(list, 0, n);
	if (n != 0) {
		await heapSiftdown(0, n);
	}
	return n;
}


async function radixSort() {
	var rtok;
	var k = 3;
	var r = 10;

	for (var i = 0, rtok = 1; i < k; i++, rtok *= r) {
		var saveList = [];
		var countList = [];
		for (var j = 0; j < r; j++) countList.push(0);


		for (var j = 0; j < list.length; j++) {
			saveList.push(-1);
			countList[Math.floor(list[j].value/rtok)%r]++;
			await uppdate(list, j, -1);
		}

		countList[0]--;
		for (var j = 1; j < r; j++) countList[j] += countList[j-1];

		for (var j = list.length-1; j >= 0; j--) {
			var index = countList[Math.floor(list[j].value/rtok)%r];
			saveList[index] = list[j];
			saveList[index].index = index;
			countList[Math.floor(list[j].value/rtok)%r]--;
		}


		for (var j = 0; j < list.length; j++) {
			list[j] = saveList[j];
			list[j].index = j;
		}
		await uppdate(list, -1, -1);
		
	}



	return 1;
}

function swap(list, i, j) {
	var tempvar = list[i];
	list[i] = list[j];
	list[i].index = i;
	list[j] = tempvar;
	list[j].index = j;
}

async function uppdate(list, selected1, selected2) {
	bars.data(list, data => data.index).attr('x', data => xScale(data.index));
	//.transition()
	bars.each(function(d) {
		var selected = (selected1 == d.index || selected2 == d.index);
		d3.select(this).style('fill', selected ? 'red' : 'lightgray');
	});
	await sleep(5);
	return 1;
}

async function runSort() {
	var dropDown = document.getElementById("sortSelect");
	switch(dropDown.value) {
		case '1':
			await boubleSort();
			break;
		case '2':
			await selectionSort();
			break;
		case '3':
			await insertionSort();
			break;
		case '4':
			await shellSort();
			break;
		case '5':
			await mergeSort(0, list.length-1);
			break;
		case '6':
			await quickSort(0, list.length-1);
			break;
		case '7':
			await heapSort();
			break;
		case '8':
			await radixSort();
			break;
		default:
			console.log("Error in dropDown, value: " + dropDown.value);
	}
	bars.style('fill', 'green');
}
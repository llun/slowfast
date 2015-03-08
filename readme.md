# SlowFast with JS Experimental

SlowFast is a library splitting video for playing different playback rate. The idea comes from [iOS application the same name as this library.](http://www.studioneat.com/products/slowfast)

## Usage

Create SlowFast object with video from html in the page and rates information for each part.

```js
var video = document.querySelector('video') // <video src="some_video.mp4">
var rates = [
  { time: 0.0, rate: 1.0 },
  { time: 1.0, rate: 2.0 },
  { time: 2.5, rate: 0.5 }
]

var slowfast = new SlowFast(video, rates)
slowfast.play()
```

Playback rate will increasing or decresing to the rate at each block at linear function which is a default transition function. It can change by passing
function when create an object.

```js
var slowfast = new SlowFast(video, rates, function(start, end, time) {
  return rate.at(time)
})
```

Rates can update later by calling updateRates at any time which will pause the video and adjust playback rate with transition function

```js
var slowfast = new SlowFast(video, rates)
slowfast.play()

slowfast.updateRates(rates.concat([{ time: 4.0, rate: 3.0 }]))
slowfast.play()
```

## Demo
At [Github Page](http://llun.github.io/slowfast/)

# License

[MIT](http://llun.mit-license.org/)

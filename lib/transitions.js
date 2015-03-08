export default {
  linear(start, end, time) {
    if (!start) return null
    if (!end || !time) return start.rate

    let totalTimeInBlock = end.time - start.time
      , timeInBlock = time - start.time
    if (start.rate < end.rate) {
      return Math.tan(Math.atan((end.rate - start.rate)/totalTimeInBlock)) * timeInBlock + start.rate
    }

    return Math.tan(Math.atan((start.rate - end.rate)/totalTimeInBlock)) * (totalTimeInBlock - timeInBlock) + end.rate
  }
}
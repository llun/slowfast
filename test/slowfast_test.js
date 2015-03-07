import chai from 'chai'

import SlowFast from '../js/slowfast'

const expect = chai.expect

describe('SlowFast', () => {

  let slowfast

  beforeEach(() => {
    slowfast = new SlowFast
  })

  it ('shall be pass', () => {
    console.log ('pass')
  })

  describe('linear transition', () => {

    let transition = SlowFast.LinearTransition

    it ('returns rate between start and end', () => {
      let start = { time: 0, rate: 1.0 }
        , end = { time: 1.2, rate: 2.0 }

      let rate = transition(start, end, 0.4)
      expect(parseFloat(rate.toFixed(2))).to.equal(1.33)
    })

    it (`minus start time before calculate rate in that block`, () => {
      let start = { time: 1.2, rate: 1.0 }
        , end = { time: 2.5, rate: 2.0 }

      let rate = transition(start, end, 2)
      expect(parseFloat(rate.toFixed(2))).to.equal(1.62)
    })

    it (`reverse calculate when rate go down`, () => {
      let start = { time: 0, rate: 4.2 }
        , end = { time: 2.0, rate: 0.5 }

      let rate = transition(start, end, 1.3)
      expect(rate).to.equal(1.795)
    })

    it (`returns start rate when there's no end`, () => {
      let start = { time: 0, rate: 4.2 }
        , end = null

      let rate = transition(start, end, 1.2)
      expect(rate).to.equal(4.2)
    })

    it (`returns normal rate when passing no start`, () => {
      let start = null
        , end = { time: 0, rate: 4.2 }

      let rate = transition(start, end, 1.2)
      expect(rate).to.equal(null)
    })

    it (`returns null when no start and end`, () => {
      let rate = transition(null, null, 1.2)
      expect(rate).to.equal(null)
    })

    it (`returns start rate when passing no time`, () => {
      let start = { time: 0, rate: 2.4 }
        , end = { time: 1.3, rate: 4.2 }
      let rate = transition(start, end)
      expect(rate).to.equal(2.4)
    })

  })

})
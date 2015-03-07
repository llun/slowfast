import chai from 'chai'
import sinon from 'sinon'
import sinon_chai from 'sinon-chai'

import SlowFast from '../js/slowfast'

const expect = chai.expect
chai.use(sinon_chai)

describe('SlowFast', () => {

  let slowfast, video

  beforeEach(() => {
    video = { 
      events: {},
      play: sinon.stub(), 
      pause: sinon.stub(),
      addEventListener: (name, fn) => {
        if (!video.events[name]) video.events[name] = []
        video.events[name].push(fn)
      },
      trigger: (name) => {
        video.events[name].forEach(fn => {
          fn()
        })
      }
    }
    slowfast = new SlowFast(video, [])
  })

  it (`plays video`, () => {
    slowfast.play()
    expect(video.play).to.have.been.called
  })

  it (`pause video`, () => {
    slowfast.pause()
    expect(video.pause).to.have.been.called
  })

  it (`reset video time`, () => {
    video.currentTime = 10.0
    slowfast.reset()

    expect(video.pause).to.have.been.called
    expect(video.currentTime).to.equal(0)
  })

  describe(`update rates`, () => {

    it (`pause video when rates is getting update`, () => {
      slowfast.updateRates([{ time: 0, rate: 1.0}, { time: 2.0, rate: 2.0}])
      expect(video.pause).to.have.been.called
    })

  })

})
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

})
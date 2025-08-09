import request from 'supertest'
import { app } from '../src/index'

describe('availability', () => {
  it('rejects bad date', async () => {
    const res = await request(app).get('/api/availability?date=bad')
    expect(res.status).toBe(400)
  })
})



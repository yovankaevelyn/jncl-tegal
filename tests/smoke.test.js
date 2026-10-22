import { describe, expect, it } from 'vitest'

describe('smoke', () => {
  it('project loads package.json', async () => {
    const pkg = await import('../package.json', { with: { type: 'json' } })
    expect(pkg).toBeDefined()
    expect(pkg.name).toBeTypeOf('string')
  })
})

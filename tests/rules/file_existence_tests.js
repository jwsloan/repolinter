// Copyright 2017 TODO Group. All rights reserved.
// Licensed under the Apache License, Version 2.0.

const chai = require('chai')
const expect = chai.expect
const Result = require('../../lib/result')

describe('rule', () => {
  describe('files_existence', () => {
    const fileExistence = require('../../rules/file-existence')

    it('returns a passed result if requested file exists', () => {
      const rule = {
        options: {
          fs: {
            findFirst () {
              return 'LICENSE.md'
            }
          },
          files: ['LICENSE*'],
          name: 'License file'
        }
      }

      const expected = [
        new Result(
            rule,
            'found (LICENSE.md)',
            'LICENSE.md',
            true
          )
      ]

      const actual = fileExistence('.', rule)

      expect(actual).to.deep.equal(expected)
    })

    it('returns a failure result if requested file doesn\'t exist', () => {
      const rule = {
        options: {
          fs: {
            findFirst () {
            }
          },
          files: ['LICENSE*'],
          name: 'License file'
        }
      }

      const expected = [
        new Result(
            rule,
            'not found',
            '.',
            false
          )
      ]

      const actual = fileExistence('.', rule)

      expect(actual).to.deep.equal(expected)
    })
  })
})

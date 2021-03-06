// Copyright 2017 TODO Group. All rights reserved.
// Licensed under the Apache License, Version 2.0.

const linguist = require('./lib/linguist')
const jsonfile = require('jsonfile')
const path = require('path')
const findConfig = require('find-config')
const Result = require('./lib/result')

module.exports.defaultFormatter = require('./formatters/symbol_formatter')
module.exports.jsonFormatter = require('./formatters/json_formatter')

module.exports.resultFormatter = exports.defaultFormatter

module.exports.lint = function (targetDir) {
  console.log(`Target directory: ${targetDir}`)

  let rulesetPath = findConfig('repolint.json', {cwd: targetDir})
  rulesetPath = rulesetPath || findConfig('repolinter.json', {cwd: targetDir})
  rulesetPath = rulesetPath || path.join(__dirname, 'rulesets/default.json')

  console.log(`Ruleset: ${rulesetPath}`)

  let languages = ['all']
  try {
    const detectedLanguages = Object.getOwnPropertyNames(linguist.identifyLanguagesSync(targetDir)).map(language => language.toLowerCase())
    languages = languages.concat(detectedLanguages)
    console.log(`Languages: ${detectedLanguages.join(', ')}`)
  } catch (error) {
    console.log(`Languages: Linguist not found in path, only running language-independent rules`)
  }
  console.log('')

  let anyFailures = false
  const ruleset = jsonfile.readFileSync(rulesetPath)
  languages.forEach(language => {
    const languageRules = ruleset.rules[language]
    if (languageRules) {
      Object.getOwnPropertyNames(languageRules).forEach(ruleId => {
        const rule = parseRule(languageRules[ruleId])
        const ruleIdParts = ruleId.split(':')
        rule.id = ruleIdParts[0]
        rule.module = ruleIdParts.length === 2 ? ruleIdParts[1] : ruleIdParts[0]
        if (rule.enabled) {
          // TODO: Do something more secure
          let results = []
          try {
            const ruleFunction = require(path.join(__dirname, 'rules', rule.module))
            results = ruleFunction(targetDir, rule)

            anyFailures = results.some(result => !result.passed && result.level === 'error')
          } catch (error) {
            results.push(new Result(rule, error.message, targetDir, false))
          }
          renderResults(results.filter(result => !result.passed))
          renderResults(results.filter(result => result.passed))
        }
      })
    }
  })

  if (anyFailures) {
    process.exitCode = 1
  }

  function renderResults (results) {
    formatResults(results).filter(x => !!x).forEach(renderResult)
  }

  function formatResults (results) {
    return results.map(formatResult)
  }

  function renderResult (result) {
    console.log(result)
  }

  function formatResult (result) {
    return exports.resultFormatter.format(result)
  }

  function parseRule (rule) {
    const result = {}

    if (Array.isArray(rule) && rule.length > 0) {
      result.enabled = parseEnabled(rule[0])
      result.level = parseLevel(rule[0])
      result.options = rule.length > 1 ? rule[1] : {}
    } else if (typeof rule === 'boolean' || typeof rule === 'string') {
      result.enabled = parseEnabled(rule)
      result.level = parseLevel(rule)
      result.options = {}
    }

    return result
  }

  function parseEnabled (value) {
    if (typeof value === 'boolean') {
      return value
    } else if (typeof value === 'string') {
      return value.toLowerCase() !== 'off'
    } else if (typeof value === 'object') {
      return value.enabled || true
    }
    return true
  }

  function parseLevel (value) {
    if (typeof value === 'string') {
      return value.trim().toLowerCase()
    }
    return 'error'
  }
}

// Copyright 2017 TODO Group. All rights reserved.
// Licensed under the Apache License, Version 2.0.

const spawnSync = require('child_process').spawnSync
const Result = require('../lib/result')

function grepLog (targetDir, patterns, ignoreCase) {
  let args = ['-C', targetDir, 'log', '--all', '--format=full', '-E']
    .concat(patterns.map(pattern => `--grep=${pattern}`))
  if (ignoreCase) {
    args.push('-i')
  }
  const log = spawnSync('git', args).stdout.toString()
  return parseLog(log)
}

function parseLog (log) {
  const logEntries = log.split('\ncommit ').filter(x => !!x)

  return logEntries.map(entry => {
    return extractInfo(entry)
  })
}

function extractInfo (commit) {
  const [hash, , , ...message] = commit.split('\n')
  return {
    hash: hash.split(' ')[1],
    message: message.join('\n')
  }
}

module.exports = function (targetDir, rule) {
  const options = rule.options
  const commits = grepLog(targetDir, options.blacklist, options.ignoreCase)

  let results = commits.map(commit => {
    const message = `Commit ${commit.hash} contains blacklisted words:\n${commit.message}`

    return new Result(rule, message, commit.hash, false)
  })

  if (results.length === 0) {
    results.push(new Result(rule, 'No blacklisted words found in any commit messages.', '', true))
  }

  return results
}

const { getCodewars, getAuthoredKatas, appendKataCompletions, hasAuthored } = require("../model/codewars-api");
const { getFreeCodeCamp } = require("../model/freecodecamp-crawl");
const { getGithubPage } = require('../model/github-page');
const { getW3Validator } = require('../model/w3-validator');
const { getGithubRepos } = require('../model/github-repo-api');
const { getGithubCommits } = require('../model/github-commits-api');
const getMeetupCount = require('../model/meetups');
const isValidRequest = require('./validate-request');

const displayReport = (req, res) => {
  if (!isValidRequest(req.session, req.query)) {
    return res.redirect('/links');
  }
  const { githubPage, fccHandle, cwHandle, ghHandle } = req.query;
  Promise.all([
    getCodewars(cwHandle),
    getFreeCodeCamp(fccHandle),
    getGithubPage(githubPage),
    getW3Validator(githubPage),
    getGithubRepos(ghHandle, req.session.token),
    getGithubCommits(ghHandle, githubPage, req.session.token),
    getAuthoredKatas(cwHandle).then(appendKataCompletions),
    getMeetupCount(ghHandle)
      .catch((err) => {
        console.error('Fetching Promise.all Kata completions');
      })])
    .then((values) => {
      const summaryObject = {};
      [summaryObject.codewars,
        summaryObject.freeCodeCamp,
        summaryObject.githubPage,
        summaryObject.w3Validation,
        summaryObject.githubRepos,
        summaryObject.githubCommits,
        summaryObject.codewarsKatas,
        summaryObject.meetups] = values;
      summaryObject.codewars.hasAuthored = hasAuthored(summaryObject.codewarsKatas);
      summaryObject.githubHandle = ghHandle;
      res.render('report', summaryObject);
    })
    .catch((err) => {
      console.error('Danger, danger: Report Promise.all errored!');
      console.error(err);
    });
};

module.exports = displayReport;

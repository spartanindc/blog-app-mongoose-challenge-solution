'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

//Add in seed data for testing purposes
function seedBlogData() {
  console.info('seeding blog data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateBlogData());
  }
  return BlogPost.insertMany(seedData);
}

//Data generation for ID, Author, Title, content

function generateBlogData() {
  return {
    id: faker.random.uuid(),
    author: faker.name.firstName() + '_' + faker.name.lastName(),
    title: faker.lorem.words(),
    content: faker.lorem.paragraph()
  }
}

//Tear Down
function tearDownDb() {
  console.warn('Deleting the database!');
  return mongooose.connection.dropDatabase();
}

//Test process

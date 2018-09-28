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
    content: faker.lorem.paragraph(),
    created: faker.date.recent()
  };
}

//Tear Down
function tearDownDb() {
  console.warn('Deleting the database!');
  return mongoose.connection.dropDatabase();
}

//Test process

describe('Blog API', function() {

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  //GET Test

  describe('GET Endpoint', function() {

    it('should return all existing blog posts', function() {
      let res;
      return chai.request(app)
        .get('/posts')
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body.posts).to.have.lengthOf.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
          expect(res.body.posts).to.have.lengthOf(count);
        });
    });

    it('should return blog posts with the correct fields', function() {

      let resBlogpost;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.posts).to.be.a('array');
          expect(res.body.posts).to.have.lengthOf.at.least(1);

          res.body.posts.forEach(function(post) {
            expect(post).to.be.a('object');
            expect(post).to.include.keys(
              'id', 'author', 'title', 'content', 'created');
          });
          resBlogpost = res.body.posts[0];
          return BlogPost.findById(resBlogpost.id);
        })
        .then(function(post) {
          expect(resBlogpost.id).to.equal(post.id);
          expect(resBlogpost.author).to.equal(post.author);
          expect(resBlogpost.title).to.equal(post.title);
          expect(resBlogpost.content).to.equal(post.content);
          expect(resBlogpost.created).to.equal(newBlogPost.created);
        });
    });
  });
//POST test
  describe('POST endpoint', function() {

    it('should add a new blog post', function() {

      const newBlogPost = generateBlogData();

      return chai.request(app)
        .post('/posts')
        .send(newBlogPost)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'id', 'author', 'title', 'content', 'created');
          expect(res.body.name).to.equal(newBlogPost.author);
          expect(res.body.id).to.not.be.null;
          expect(res.body.title).to.equal(newBlogPost.title);
          expect(res.body.content).to.equal(newBlogPost.content);
          expect(res.body.created).to.equal(newBlogPost.created);

          return BlogPost.findById(res.body.id);
        })
        .then(function(post) {
          expect(post.author).to.equal(newBlogPost.author);
          expect(post.title).to.equal(newBlogPost.title);
          expect(post.content).to.equal(newBlogPost.content);
          expect(post.created).to.equal(newBlogPost.created);
        });
    });
  });
//PUT test
  describe('PUT endpoint', function() {

      it('should update fields you send over', function() {
        const updateData = {
          title: 'We write the best blogs',
          content: 'another one'
        };

        return BlogPost
          .findOne()
          .then(function(post) {
            updateData.id = post.id;

            return chai.request(app)
              .put(`/posts/${post.id}`)
              .send(updateData);
          })
          .then(function(res) {
            expect(res).to.have.status(204);

            return BlogPost.findById(updateData.id);
          })
          .then(function(post) {
            expect(post.title).to.equal(updateData.title);
            expect(post.content).to.equal(updateData.content);
          });
      });
    });

  //DELETE Test
  describe('DELETE endpoint', function() {

    it('delete a blog post by id', function() {

      let blog;

      return BlogPost
        .findOne()
        .then(function(_blog) {
          blog = _blog;
          return chai.request(app).delete(`/posts/${blog.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return BlogPost.findById(blog.id);
        })
        .then(function(_blog) {
          expect(_blog).to.be.null;
        });
    });
  });
});

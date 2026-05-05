const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const app = require('../server'); // Adjust path as needed

describe('Auth API', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/test');
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'verifier'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  it('should login user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
  });
});
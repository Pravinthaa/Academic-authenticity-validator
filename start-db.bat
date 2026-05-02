@echo off
echo Starting local MongoDB for VERI-CHAIN...
cd backend
mongod --dbpath .local_db

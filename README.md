
![](logo.png)

# Humsafar [![node:v11.5.0](https://img.shields.io/badge/node-v11.5.0-brightgreen.svg)](http://nodejs.org/download/) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) ![](https://img.shields.io/badge/version-0.0.2-lightgrey.svg)

Humsafar is a lightweight, easy to use bot that serves as a one-stop solution to all your transport needs. It uses a simple conversational interface to guide users through cab bookings, train updates, location data, PNR status, and much more.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

## Prerequisites

Humsafar has the following dependencies:

- cheerio>=1.0.0-rc.2
- restify>=7.3.0
- body-parser>=1.18.3
- botbuilder>=3.13.1
- botbuilder-azure>=4.2.0
- botbuilder-cognitiveservices>=1.2.0

## Built With

- Google Place API
- Bing Static Maps API
- Uber Ride Request API
- getpnrstatus.co.in

## Installing

The first thing to do is to get the relevant API keys :-

- Google Place API - Follow the instructions given in [this website](https://developers.google.com/places/web-service/intro) and get the API token for Google Place.
- Bing Static API - Follow the intructions given on [this website](https://docs.microsoft.com/en-us/bingmaps/rest-services/imagery/get-a-static-map) and get the API for Bing Maps.
- Uber Ride Requests API - Follow the instructions [here](https://developer.uber.com/docs/riders/ride-requests/tutorials/api/introduction) and get the API Access token for riders.

Write these API tokens into the file src/config.js.example and rename the file to src/config.js.

Hamsafar runs on Node.js, which must be installed from its PPA -

    cd ~
    curl -sL https://deb.nodesource.com/setup_8.x -o nodesource_setup.sh

You can inspect the contents of this script with nano (or your preferred text editor):

    nano nodesource_setup.sh

And run the script under sudo:

    sudo bash nodesource_setup.sh

The PPA will be added to your configuration and your local package cache will be updated automatically. After running the setup script from nodesource, you can install the Node.js package in the same way you did above:

    sudo apt-get install nodejs

To check which version of Node.js you have installed after these initial steps, type:

    nodejs -v

In order for some npm packages to work (those that require compiling code from source, for example), you will need to install the build-essential package:

    sudo apt-get install build-essential

Then, run the following in the cloned Hamsafar directory:

    npm install

## Deployment

Deployment is uncomplicated, in the install directory simply run:

    node app.js

## Usage

This bot can be deployed on multiple platforms on the internet. To test locally download version 3.x of the Microsoft Bot Emulator. Run the bot using deployment command. Connect the emulator to http://localhost:3978/api/message and enjoy chatting to your bot.

## Authors

- Atishya Jain
- Shashwat Shivam
- Partha Dhar
- Kabir Tomer

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgements

- Digital Ocean, for their excellent Node.js tutorial.
- Stack Overflow, for keeping us sane.

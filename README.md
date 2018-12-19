

# Humsafar [![node:v11.5.0](https://img.shields.io/badge/node-v11.5.0-brightgreen.svg)](http://nodejs.org/download/) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) ![](https://img.shields.io/badge/version-0.0.2-lightgrey.svg)

Humsafar is a lightweight, easy to use bot that serves as a one-stop solution to all your transport needs. It uses a simple conversational interface to guide users through cab bookings, train updates, location data, PNR status, and much more.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

## Prerequisites

Humsafar requires:

- cheerio>=1.0.0-rc.2
- request>=2.88.0

Humsafar also has the following dependencies:

- body-parser>=1.18.3
- ajax-request>=1.2.3
- botbuilder>=3.12.0
- botbuilder-azure>=3.0.4
- botbuilder-cognitiveservices>=1.1.0
- fast-csv>=2.4.1
- fb>=2.0.0
- form-data>=2.3.3
- fs-extra>=4.0.2
- natural>=0.6.1
- nodemon>=1.18.4
- restify>=6.3.4

## Built With

- Google Place API
- Bing Static Maps API
- Uber Ride Request API
- getpnrstatus.co.in

## Installing

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

    npm start

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

import fs from 'fs';
import axios from 'axios';
import readline from 'readline';
import { promisify } from 'util';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { context } from '../data/context.js';
import nodemailer from 'nodemailer';
// import MailComposer from 'nodemailer/lib/mail-composer.js';
import path from 'path';
const gmail = google.gmail('v1');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
// const rlQuestionAsync = promisify(rl.question);
// const gmailGetMessagesAsync = promisify(gmail.users.messages.get);
// const gmailListMessagesAsync = promisify(gmail.users.messages.list);

const gmailGetMessagesAsync = (params) => {
  return new Promise((resolve, reject) => {
    gmail.users.messages.get(params, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
};

const gmailListMessagesAsync = (params) => {
  return new Promise((resolve, reject) => {
    gmail.users.messages.list(params, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
};

// const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const SCOPES = ['https://mail.google.com/'];

const TOKEN_PATH = 'gToken.json';
const CREDENTIAL_FILE = 'gCredentials.json';

const getAndStoreToken = async () => {
  const content = await readFileAsync('gCredentials.json');
  const credentials = JSON.parse(content);
  //authentication
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUrl = credentials.installed.redirect_uris[0];
  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

  //get new token
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  rl.question(`Authorize this app by visiting this url: ${authUrl}\n` +
    'Enter the code from that page here: ', (code) => {
      rl.close();
      oauth2Client.getToken(code, async (err, token) => {
        if (err) {
          console.log('Error while trying to retrieve access token', err);
          return;
        }
        oauth2Client.credentials = token;
        await writeFileAsync(TOKEN_PATH, JSON.stringify(token));
      });
    });
};

const getEmailContents = async (subject) => {
  // Get credential information  & specify the client secret file
  const content = await readFileAsync('gCredentials.json');
  const credentials = JSON.parse(content);

  // authentication
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUrl = credentials.installed.redirect_uris[0];
  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

  // get refreshed token
  const token = JSON.parse(await readFileAsync(TOKEN_PATH));

  if (token.expiry_date > (new Date).getTime() + 5000) {
    oauth2Client.credentials = token;
  } else {
    const requestBody = {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token.refresh_token,
      grant_type: "refresh_token"
    };
    const currentTime = (new Date).getTime();
    const response = await axios.post(`https://${context.AllURLs.urls.googleapi_token}`, requestBody);
    console.log("New Token------>", response.data);
    oauth2Client.credentials = response.data;
    const newToken = {
      "access_token": response.data.access_token,
      "refresh_token": token.refresh_token,
      "scope": response.data.scope,
      "token_type": response.data.token_type,
      "expiry_date": currentTime + response.data.expires_in * 1000
    }
    await writeFileAsync(TOKEN_PATH, JSON.stringify(newToken));
  }

  // Access the gmail via API
  let res = await gmailListMessagesAsync({
    auth: oauth2Client,
    userId: "me",
    maxResults: 5,
  });

  let messageContents = '';
  for (const message of res.data.messages) {
    let emailSubject = '';
    let res = await gmailGetMessagesAsync({
      auth: oauth2Client,
      userId: "me",
      id: message.id,
    });
    for (const h of res.data.payload.headers) {
      if (h.name == "Subject") {
        emailSubject = h.value;
        break;
      }
    }

    if (emailSubject == subject) {
      // decode the base64 encoded message.
      const mailBody = JSON.stringify(res.data.payload.body.data);
      messageContents = (new Buffer.from(mailBody, "base64")).toString();
      // console.log('------>', messageContents);
      break;
    }
  }
  return messageContents;
};

const checkEmail = async (subject) => {
  // Get credential information  & specify the client secret file
  const content = await readFileAsync('gCredentials.json');
  const credentials = JSON.parse(content);

  // authentication
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUrl = credentials.installed.redirect_uris[0];
  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

  // get refreshed token
  const token = JSON.parse(await readFileAsync(TOKEN_PATH));

  if (token.expiry_date > (new Date).getTime() + 5000) {
    oauth2Client.credentials = token;
    console.log("------> gToken is not expired");
  } else {
    const requestBody = {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token.refresh_token,
      grant_type: "refresh_token"
    };
    const currentTime = (new Date).getTime();
    const response = await axios.post(`https://${context.AllURLs.urls.googleapi_token}`, requestBody);
    console.log("New Token------>", response.data);
    oauth2Client.credentials = response.data;
    const newToken = {
      "access_token": response.data.access_token,
      "refresh_token": token.refresh_token,
      "scope": response.data.scope,
      "token_type": response.data.token_type,
      "expiry_date": currentTime + response.data.expires_in * 1000
    }
    await writeFileAsync(TOKEN_PATH, JSON.stringify(newToken));
  }

  // Access the gmail via API
  let res = await gmailListMessagesAsync({
    auth: oauth2Client,
    userId: "me",
    maxResults: 5,
  });

  let receiveEmail = false;
  for (const message of res.data.messages) {
    let emailSubject = '';
    let res = await gmailGetMessagesAsync({
      auth: oauth2Client,
      userId: "me",
      id: message.id,
    });
    for (const h of res.data.payload.headers) {
      if (h.name == "Subject") {
        emailSubject = h.value;
        break;
      }
    }

    if (emailSubject == subject) {
      receiveEmail = true;
      break;
    }
  }
  return receiveEmail;
};

const getOath2Client = async () => {
  const content = await readFileAsync('gCredentials.json');
  const credentials = JSON.parse(content);

  // authentication
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUrl = credentials.installed.redirect_uris[0];
  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

  // get refreshed token 
  const token = JSON.parse(await readFileAsync(TOKEN_PATH));

  if (token.expiry_date > (new Date).getTime() + 5000) {
    oauth2Client.credentials = token;
  } else {
    const requestBody = {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token.refresh_token,
      grant_type: "refresh_token"
    };
    const currentTime = (new Date).getTime();
    const response = await axios.post('https://oauth2.googleapis.com/token', requestBody);
    console.log("New Token------>", response.data);
    oauth2Client.credentials = response.data;
    const newToken = {
      "access_token": response.data.access_token,
      "refresh_token": token.refresh_token,
      "scope": response.data.scope,
      "token_type": response.data.token_type,
      "expiry_date": currentTime + response.data.expires_in * 1000
    }
    await writeFileAsync(TOKEN_PATH, JSON.stringify(newToken));
  }

  return oauth2Client;
};

const sendEmail = async (testInputs = {}) => {
  if (!Object.prototype.hasOwnProperty.call(testInputs, 'recipients')) {
    throw new Error('recipients must be set');
  }

  // Create the raw email with nodemailer
  const mail = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });

  const mailOptions = {
    to: testInputs.recipients, // multiple recipients separate by comma
    subject: (testInputs.subject) || ''
  };

  if (Object.prototype.hasOwnProperty.call(testInputs, 'bodyText')) {
    mailOptions.text = testInputs.bodyText;
  }

  if (Array.isArray(testInputs.attachments)) {
    mailOptions.attachments = [];
    for (const a of testInputs.attachments) {
      if (!fs.existsSync(a)) {
        throw new Error(`Attachment ${a} does not exist`);
      }
      mailOptions.attachments.push({
        filename: path.basename(a),
        content: fs.readFileSync(a)
      });
    }
  }

  const message = await mail.sendMail(mailOptions);
  const encodedMessage = message.message.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const oauth2Client = await getOath2Client();
  try {
    const res = await gmail.users.messages.send({
      auth: oauth2Client,
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      }
    });
    console.log('Email sent:', res.data);
  } catch (err) {
    // console.error("Error:", JSON.stringify(err));
    throw err;
  }

};

const deleteEmail = async (subject, tokenPath = TOKEN_PATH, credentialFile = CREDENTIAL_FILE) => {
  // Get credential information  & specify the client secret file
  const content = await readFileAsync(credentialFile);
  const credentials = JSON.parse(content);

  // authentication
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUrl = credentials.installed.redirect_uris[0];
  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

  // get refreshed token 
  const token = JSON.parse(await readFileAsync(tokenPath));

  if (token.expiry_date > (new Date).getTime() + 5000) {
    oauth2Client.credentials = token;
  } else {
    const requestBody = {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token.refresh_token,
      grant_type: "refresh_token"
    };
    const currentTime = (new Date).getTime();
    const response = await axios.post(`https://${context.AllURLs.urls.googleapi_token}`, requestBody);
    console.log("New Token------>", response.data);
    oauth2Client.credentials = response.data;
    const newToken = {
      "access_token": response.data.access_token,
      "refresh_token": token.refresh_token,
      "scope": response.data.scope,
      "token_type": response.data.token_type,
      "expiry_date": currentTime + response.data.expires_in * 1000
    }
    await writeFileAsync(tokenPath, JSON.stringify(newToken));
  }

  // Access the gmail via API
  let res = await gmailListMessagesAsync({
    auth: oauth2Client,
    userId: "me",
    maxResults: 5,
  });

  let messageContents = '';
  for (const message of res.data.messages) {
    let emailSubject = '';
    let res = await gmailGetMessagesAsync({
      auth: oauth2Client,
      userId: "me",
      id: message.id,
    });
    for (const h of res.data.payload.headers) {
      if (h.name == "Subject") {
        emailSubject = h.value;
        break;
      }
    }

    if (emailSubject == subject) {
      await gmailDeleteMessagesAsync({
        auth: oauth2Client,
        userId: "me",
        id: message.id,
      });
    }
  }
};

// getAndStoreToken();
// getEmailContents('AutoTestFirm72247 - Welcome to MyBGL');

export {
  getEmailContents,
  checkEmail,
  sendEmail,
  deleteEmail
};